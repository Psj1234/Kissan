/**
 * POST /chatbot/predict – calls Python predict.py and returns prediction reply.
 * GET /chatbot/prices/last/:commodity – returns last 4 prices for chatbot auto-fetch.
 * POST /chatbot/prices – admin sync: { crop, lastThreePrices } to store last 4 per crop.
 * POST /chatbot/recommend – returns selling recommendation based on stock and market data.
 */

const { spawn } = require("child_process");
const path = require("path");

// predict.py and models live in Hackathon (parent of Pixel_Perfect_Hackathon)
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const PREDICT_SCRIPT = path.join(PROJECT_ROOT, "predict.py");

// In-memory store for last 4 prices per crop (synced from admin panel for chatbot auto-fetch)
const lastPricesByCrop = {};

function runPredict(commodity, prices) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(prices) || prices.length < 4) {
      return reject(new Error("prices must be an array of at least 4 numbers"));
    }
    const [lag1, lag2, lag3, lag7] = prices.map(Number);
    if ([lag1, lag2, lag3, lag7].some((n) => Number.isNaN(n))) {
      return reject(new Error("prices must be valid numbers"));
    }
    const args = [
      PREDICT_SCRIPT,
      String(commodity).trim().toLowerCase(),
      String(lag1),
      String(lag2),
      String(lag3),
      String(lag7),
    ];
    const py = spawn("python", args, {
      cwd: PROJECT_ROOT,
      shell: true,
    });
    let stdout = "";
    let stderr = "";
    py.stdout.on("data", (d) => { stdout += d; });
    py.stderr.on("data", (d) => { stderr += d; });
    py.on("error", (err) => reject(err));
    py.on("close", (code) => {
      if (code !== 0) {
        try {
          const errObj = JSON.parse(stderr.trim());
          return reject(new Error(errObj.error || stderr || "Prediction failed"));
        } catch {
          return reject(new Error(stderr || "Prediction failed"));
        }
      }
      try {
        const out = JSON.parse(stdout.trim());
        resolve(out);
      } catch {
        reject(new Error("Invalid output from predict.py"));
      }
    });
  });
}

// Crop shelf life data
const CROP_SHELF_LIFE = {
  onion: { shelfLifeDays: 30, category: 'semi-perishable' },
  potato: { shelfLifeDays: 45, category: 'semi-perishable' },
  tomato: { shelfLifeDays: 7, category: 'perishable' },
  cucumber: { shelfLifeDays: 5, category: 'perishable' },
  wheat: { shelfLifeDays: 180, category: 'storable' },
  rice: { shelfLifeDays: 180, category: 'storable' },
  bajra: { shelfLifeDays: 120, category: 'storable' },
  soybean: { shelfLifeDays: 90, category: 'storable' }
};

function analyzePriceTrend(prices) {
  if (prices.length < 2) return { trend: 'stable', percentage: 0 };
  
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

function calculateRisk(daysUntilSpoilage, priceTrend) {
  let urgency = 5;
  
  if (daysUntilSpoilage <= 3) urgency = 10;
  else if (daysUntilSpoilage <= 7) urgency = 8;
  else if (daysUntilSpoilage <= 14) urgency = 6;
  else if (daysUntilSpoilage <= 30) urgency = 4;
  else urgency = 2;
  
  if (priceTrend === 'decreasing') urgency = Math.min(10, urgency + 2);
  else if (priceTrend === 'increasing' && daysUntilSpoilage > 7) urgency = Math.max(1, urgency - 2);
  
  if (urgency >= 8) return { level: 'high', urgency };
  if (urgency >= 5) return { level: 'medium', urgency };
  return { level: 'low', urgency };
}

function generateRecommendation(crop, quantity, currentPrice, historicalPrices, predictedPrice) {
  const cropKey = crop.toLowerCase();
  const cropData = CROP_SHELF_LIFE[cropKey];
  
  if (!cropData) {
    return {
      recommendation: 'sell_this_week',
      bestDay: 'Within 7 days',
      reasoning: ['Crop data not available. Sell soon to avoid risk.'],
      priceAnalysis: { trend: 'stable', trendPercentage: 0, currentPrice },
      riskLevel: 'medium',
      urgency: 5
    };
  }
  
  const daysUntilSpoilage = cropData.shelfLifeDays;
  const priceAnalysis = analyzePriceTrend([currentPrice, ...historicalPrices]);
  const risk = calculateRisk(daysUntilSpoilage, priceAnalysis.trend);
  
  const reasoning = [];
  let recommendation = 'sell_this_week';
  let bestDay = 'Within 7 days';
  
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
      reasoning.push('Stable market conditions');
    }
  } else {
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
    }
  }
  
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

function formatRecommendationReply(crop, quantity, rec) {
  const quantityStr = quantity ? `${quantity} quintals of ` : '';
  let reply = `📊 **Selling Recommendation for ${quantityStr}${crop}**\n\n`;
  
  // Recommendation header
  const riskEmoji = rec.riskLevel === 'high' ? '🔴' : rec.riskLevel === 'medium' ? '🟡' : '🟢';
  reply += `${riskEmoji} **Risk Level:** ${rec.riskLevel.toUpperCase()} | **Urgency:** ${rec.urgency}/10\n\n`;
  
  // Best day to sell
  reply += `📅 **Best Time to Sell:** ${rec.bestDay}\n\n`;
  
  // Price analysis
  const trendEmoji = rec.priceAnalysis.trend === 'increasing' ? '📈' : rec.priceAnalysis.trend === 'decreasing' ? '📉' : '➡️';
  reply += `${trendEmoji} **Price Trend:** ${rec.priceAnalysis.trend} (${rec.priceAnalysis.trendPercentage.toFixed(1)}%)\n`;
  reply += `💰 **Current Price:** ₹${rec.priceAnalysis.currentPrice}/quintal\n`;
  if (rec.priceAnalysis.predictedPrice) {
    reply += `🔮 **Predicted Price:** ₹${Math.round(rec.priceAnalysis.predictedPrice)}/quintal\n`;
  }
  reply += '\n';
  
  // Reasoning
  reply += '**Why this recommendation?**\n';
  rec.reasoning.forEach(reason => {
    reply += `• ${reason}\n`;
  });
  
  return reply;
}

module.exports = function chatbotRouter(router) {
  router.post("/predict", async (req, res) => {
    try {
      const { commodity, prices } = req.body || {};
      if (!commodity || !prices) {
        return res.status(400).json({
          error: "Missing commodity or prices",
          reply: "Please send commodity and prices array (e.g. [1142, 1100, 1080, 1050]).",
        });
      }
      const result = await runPredict(commodity, prices);
      return res.json({ reply: result.reply, prediction: result.prediction });
    } catch (err) {
      return res.status(500).json({
        error: err.message,
        reply: `Sorry, prediction failed: ${err.message}`,
      });
    }
  });

  /** GET last 4 prices for a commodity (for chatbot auto-fetch so farmer doesn't type manually) */
  router.get("/prices/last/:commodity", (req, res) => {
    const commodity = (req.params.commodity || "").trim().toLowerCase();
    if (!commodity) return res.status(400).json({ prices: [] });
    const prices = lastPricesByCrop[commodity] || [];
    return res.json({ prices: Array.isArray(prices) ? prices.slice(0, 4) : [] });
  });

  /** POST to sync last 4 prices from admin panel (called when admin saves a price) */
  router.post("/prices", (req, res) => {
    const { crop, lastThreePrices } = req.body || {};
    const key = (crop || "").trim().toLowerCase();
    if (!key) return res.status(400).json({ ok: false });
    const arr = Array.isArray(lastThreePrices)
      ? lastThreePrices.map(Number).filter((n) => !Number.isNaN(n))
      : [];
    lastPricesByCrop[key] = arr.slice(0, 4);
    return res.json({ ok: true });
  });

  /** POST to get selling recommendation based on stock */
  router.post("/recommend", async (req, res) => {
    try {
      const { commodity, quantity } = req.body || {};
      if (!commodity) {
        return res.status(400).json({ error: "Missing commodity" });
      }

      const cropKey = commodity.toLowerCase();
      const prices = lastPricesByCrop[cropKey] || [];
      
      if (prices.length < 2) {
        return res.status(400).json({
          error: "Insufficient price data",
          reply: `Sorry, I don't have enough price history for ${commodity} to make a recommendation. Please contact the admin to update market prices.`
        });
      }

      const currentPrice = prices[0];
      const historicalPrices = prices.slice(1);
      
      // Try to get prediction for better recommendation
      let predictedPrice = null;
      if (prices.length >= 4) {
        try {
          const result = await runPredict(commodity, prices);
          predictedPrice = result.prediction;
        } catch (_) {
          // Prediction failed, continue without it
        }
      }

      // Generate recommendation
      const recommendation = generateRecommendation(
        commodity,
        quantity || 0,
        currentPrice,
        historicalPrices,
        predictedPrice
      );

      return res.json({
        success: true,
        recommendation,
        reply: formatRecommendationReply(commodity, quantity, recommendation)
      });
    } catch (err) {
      return res.status(500).json({
        error: err.message,
        reply: `Sorry, I couldn't generate a recommendation: ${err.message}`
      });
    }
  });
};
