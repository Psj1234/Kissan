/**
 * Crop shelf life data and selling recommendation logic
 */

export type CropShelfLife = {
  crop: string;
  shelfLifeDays: number;
  category: 'perishable' | 'semi-perishable' | 'storable';
  storageNotes: string;
};

export const CROP_SHELF_LIFE: Record<string, CropShelfLife> = {
  onion: {
    crop: 'Onion',
    shelfLifeDays: 30,
    category: 'semi-perishable',
    storageNotes: 'Store in cool, dry place. Can last 1-2 months with proper ventilation.'
  },
  potato: {
    crop: 'Potato',
    shelfLifeDays: 45,
    category: 'semi-perishable',
    storageNotes: 'Keep in dark, cool place. Avoid moisture and light exposure.'
  },
  tomato: {
    crop: 'Tomato',
    shelfLifeDays: 7,
    category: 'perishable',
    storageNotes: 'Highly perishable. Sell within 5-7 days for best prices.'
  },
  cucumber: {
    crop: 'Cucumber',
    shelfLifeDays: 5,
    category: 'perishable',
    storageNotes: 'Very perishable. Sell within 3-5 days.'
  },
  wheat: {
    crop: 'Wheat',
    shelfLifeDays: 180,
    category: 'storable',
    storageNotes: 'Long shelf life. Store in moisture-free containers.'
  },
  rice: {
    crop: 'Rice',
    shelfLifeDays: 180,
    category: 'storable',
    storageNotes: 'Long shelf life. Protect from pests and moisture.'
  },
  bajra: {
    crop: 'Bajra',
    shelfLifeDays: 120,
    category: 'storable',
    storageNotes: 'Good storage life. Keep dry and pest-free.'
  },
  soybean: {
    crop: 'Soybean',
    shelfLifeDays: 90,
    category: 'storable',
    storageNotes: 'Store in dry conditions. Monitor for moisture.'
  }
};

export type SellingRecommendation = {
  recommendation: 'sell_today' | 'sell_this_week' | 'wait_for_better_price' | 'sell_immediately';
  bestDay: string;
  reasoning: string[];
  priceAnalysis: {
    trend: 'increasing' | 'decreasing' | 'stable';
    trendPercentage: number;
    currentPrice: number;
    predictedPrice?: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  urgency: number; // 1-10 scale
};

/**
 * Analyze price trend from historical prices
 */
function analyzePriceTrend(prices: number[]): { trend: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
  if (prices.length < 2) return { trend: 'stable', percentage: 0 };
  
  // Calculate average change
  let totalChange = 0;
  for (let i = 0; i < prices.length - 1; i++) {
    const change = ((prices[i] - prices[i + 1]) / prices[i + 1]) * 100;
    totalChange += change;
  }
  
  const avgChange = totalChange / (prices.length - 1);
  
  if (avgChange > 2) return { trend: 'increasing', percentage: avgChange };
  if (avgChange < -2) return { trend: 'decreasing', percentage: avgChange };
  return { trend: 'stable', percentage: avgChange };
}

/**
 * Calculate risk level based on shelf life and market conditions
 */
function calculateRisk(
  daysUntilSpoilage: number,
  priceTrend: 'increasing' | 'decreasing' | 'stable',
  category: string
): { level: 'low' | 'medium' | 'high'; urgency: number } {
  let urgency = 5;
  
  // Adjust urgency based on shelf life
  if (daysUntilSpoilage <= 3) urgency = 10;
  else if (daysUntilSpoilage <= 7) urgency = 8;
  else if (daysUntilSpoilage <= 14) urgency = 6;
  else if (daysUntilSpoilage <= 30) urgency = 4;
  else urgency = 2;
  
  // Adjust based on price trend
  if (priceTrend === 'decreasing') urgency = Math.min(10, urgency + 2);
  else if (priceTrend === 'increasing' && daysUntilSpoilage > 7) urgency = Math.max(1, urgency - 2);
  
  // Determine risk level
  if (urgency >= 8) return { level: 'high', urgency };
  if (urgency >= 5) return { level: 'medium', urgency };
  return { level: 'low', urgency };
}

/**
 * Generate selling recommendation based on stock and market data
 */
export function generateSellingRecommendation(
  crop: string,
  quantity: number,
  currentPrice: number,
  historicalPrices: number[],
  predictedPrice?: number
): SellingRecommendation {
  const cropKey = crop.toLowerCase();
  const cropData = CROP_SHELF_LIFE[cropKey];
  
  if (!cropData) {
    // Default recommendation for unknown crops
    return {
      recommendation: 'sell_this_week',
      bestDay: 'Within 7 days',
      reasoning: ['Crop data not available. Sell soon to avoid risk.'],
      priceAnalysis: {
        trend: 'stable',
        trendPercentage: 0,
        currentPrice,
      },
      riskLevel: 'medium',
      urgency: 5
    };
  }
  
  const daysUntilSpoilage = cropData.shelfLifeDays;
  const priceAnalysis = analyzePriceTrend([currentPrice, ...historicalPrices]);
  const risk = calculateRisk(daysUntilSpoilage, priceAnalysis.trend, cropData.category);
  
  const reasoning: string[] = [];
  let recommendation: SellingRecommendation['recommendation'] = 'sell_this_week';
  let bestDay = 'Within 7 days';
  
  // Decision logic
  if (cropData.category === 'perishable') {
    if (daysUntilSpoilage <= 5) {
      recommendation = 'sell_immediately';
      bestDay = 'Today or tomorrow';
      reasoning.push(`⚠️ ${crop} is highly perishable (${daysUntilSpoilage} days shelf life)`);
      reasoning.push('Immediate sale recommended to avoid losses');
    } else {
      recommendation = 'sell_today';
      bestDay = 'Within 2-3 days';
      reasoning.push(`${crop} has limited shelf life (${daysUntilSpoilage} days)`);
    }
  } else if (cropData.category === 'semi-perishable') {
    if (priceAnalysis.trend === 'increasing' && daysUntilSpoilage > 14) {
      recommendation = 'wait_for_better_price';
      bestDay = 'Next 3-5 days';
      reasoning.push(`Prices are trending up (+${priceAnalysis.percentage.toFixed(1)}%)`);
      reasoning.push(`You have time (${daysUntilSpoilage} days shelf life)`);
      if (predictedPrice && predictedPrice > currentPrice) {
        reasoning.push(`Predicted price: ₹${Math.round(predictedPrice)} (current: ₹${currentPrice})`);
      }
    } else if (priceAnalysis.trend === 'decreasing') {
      recommendation = 'sell_today';
      bestDay = 'Within 2-3 days';
      reasoning.push(`⚠️ Prices are falling (${priceAnalysis.percentage.toFixed(1)}%)`);
      reasoning.push('Sell soon to minimize losses');
    } else {
      recommendation = 'sell_this_week';
      bestDay = 'Within 5-7 days';
      reasoning.push(`Stable market conditions`);
      reasoning.push(`${cropData.storageNotes}`);
    }
  } else { // storable
    if (priceAnalysis.trend === 'increasing') {
      recommendation = 'wait_for_better_price';
      bestDay = 'Next 7-14 days';
      reasoning.push(`📈 Prices trending upward (+${priceAnalysis.percentage.toFixed(1)}%)`);
      reasoning.push(`Long shelf life (${daysUntilSpoilage} days) - you can wait`);
      if (predictedPrice && predictedPrice > currentPrice) {
        const gain = ((predictedPrice - currentPrice) / currentPrice * 100);
        reasoning.push(`Potential gain: ${gain.toFixed(1)}% waiting for better price`);
      }
    } else if (priceAnalysis.trend === 'decreasing') {
      recommendation = 'sell_this_week';
      bestDay = 'Within 7 days';
      reasoning.push(`Prices declining (${priceAnalysis.percentage.toFixed(1)}%)`);
      reasoning.push('Consider selling before further drop');
    } else {
      recommendation = 'sell_this_week';
      bestDay = 'Within 7-10 days';
      reasoning.push('Stable prices - good time to sell');
      reasoning.push('Monitor market for next few days');
    }
  }
  
  // Add quantity-based reasoning
  if (quantity > 50) {
    reasoning.push(`💡 Large stock (${quantity} quintals) - consider selling in batches`);
  }
  
  return {
    recommendation,
    bestDay,
    reasoning,
    priceAnalysis: {
      trend: priceAnalysis.trend,
      trendPercentage: priceAnalysis.percentage,
      currentPrice,
      predictedPrice
    },
    riskLevel: risk.level,
    urgency: risk.urgency
  };
}

/**
 * Get crop shelf life info
 */
export function getCropShelfLife(crop: string): CropShelfLife | null {
  const cropKey = crop.toLowerCase();
  return CROP_SHELF_LIFE[cropKey] || null;
}
