# 🌾 Smart Selling Recommendations - KISAN AI

## Overview

The KISAN AI Assistant now provides intelligent selling recommendations to help farmers decide the best time to sell their crops, minimizing losses and maximizing profits.

## How It Works

### Input Required:
1. **Crop Type** (e.g., onion, potato, tomato)
2. **Quantity** (in quintals)

### Analysis Performed:
1. **Shelf Life Assessment**: Each crop has a specific shelf life
   - Perishable (5-7 days): Tomato, Cucumber
   - Semi-Perishable (30-45 days): Onion, Potato
   - Storable (90-180 days): Wheat, Rice, Bajra, Soybean

2. **Price Trend Analysis**: Last 4 prices from admin panel
   - Increasing: Prices going up (>2% average change)
   - Decreasing: Prices falling (<-2% average change)
   - Stable: Minimal price movement

3. **Risk Calculation**: Combines shelf life urgency with market trends
   - Days until spoilage
   - Market volatility
   - Price direction

4. **ML Predictions**: Uses predicted prices (when available) for better recommendations

## Recommendation Output

The chatbot provides:

✅ **Best Day to Sell**: Specific timeframe (e.g., "Today or tomorrow", "Within 7 days")

🎯 **Risk Level**: 
- 🟢 Low: Safe to wait for better prices
- 🟡 Medium: Monitor market, moderate urgency
- 🔴 High: Sell immediately to avoid losses

📊 **Urgency Score**: 1-10 scale indicating how urgent the sale is

📈 **Price Analysis**:
- Current market price
- Trend direction and percentage change
- Predicted future price (when available)

💡 **Reasoning**: Clear explanations for the recommendation

## Example Use Cases

### Scenario 1: Perishable Crop with Stable Prices
**Input**: "Should I sell my 20 quintals of tomato?"

**Analysis**:
- Shelf life: 7 days (highly perishable)
- Price trend: Stable (0.5% change)
- Risk: High (due to short shelf life)

**Recommendation**: 
- 🔴 Sell within 2-3 days
- Urgency: 8/10
- Reasoning: Limited shelf life, sell before spoilage

### Scenario 2: Semi-Perishable with Rising Prices
**Input**: "I have 50 quintals of onion, when to sell?"

**Analysis**:
- Shelf life: 30 days
- Price trend: Increasing (+3.2%)
- Predicted: ₹1220 (current: ₹1150)

**Recommendation**:
- 🟡 Wait 3-5 days for better price
- Urgency: 4/10
- Potential gain: 6.1% by waiting

### Scenario 3: Storable Crop with Falling Prices
**Input**: "Should I sell my 100 quintals of wheat?"

**Analysis**:
- Shelf life: 180 days
- Price trend: Decreasing (-2.5%)
- Risk: Medium

**Recommendation**:
- 🟡 Sell within 7 days
- Urgency: 5/10
- Reasoning: Prices declining, sell before further drop

### Scenario 4: Large Stock Warning
**Input**: "I have 80 quintals of potato"

**Additional Insight**:
- 💡 Large stock detected
- Recommendation: Consider selling in batches to:
  - Test market response
  - Reduce storage burden
  - Minimize risk exposure

## How to Use

### In the Chatbot:
Simply ask natural questions like:
- "Should I sell my [quantity] quintals of [crop]?"
- "When to sell [crop]?"
- "I have [quantity] qt of [crop], should I sell now?"

If you don't mention quantity, the chatbot will ask for it.

### Example Conversation:

**Farmer**: "Should I sell my tomatoes?"

**KISAN AI**: "How many quintals of tomato do you have?"

**Farmer**: "25 quintals"

**KISAN AI**: "📊 **Selling Recommendation for 25 quintals of Tomato**

🔴 **Risk Level:** HIGH | **Urgency:** 9/10

📅 **Best Time to Sell:** Today or tomorrow

📉 **Price Trend:** decreasing (-1.8%)
💰 **Current Price:** ₹1050/quintal

**Why this recommendation?**
• ⚠️ Tomato is highly perishable (7 days shelf life)
• Immediate sale recommended to avoid losses
• ⚠️ Prices are falling (-1.8%)
• Sell soon to minimize losses"

## Technical Details

### Data Sources:
- Admin panel price updates (last 4 prices)
- Crop shelf life database
- ML price predictions (when available)

### Algorithm:
1. Fetch historical prices from admin panel
2. Calculate price trend (increasing/decreasing/stable)
3. Assess shelf life urgency
4. Generate ML prediction (optional)
5. Calculate risk level and urgency score
6. Formulate recommendation with reasoning
7. Format user-friendly response

### Supported Crops:
- Onion (30 days shelf life)
- Potato (45 days)
- Tomato (7 days)
- Cucumber (5 days)
- Wheat (180 days)
- Rice (180 days)
- Bajra (120 days)
- Soybean (90 days)

## Benefits for Farmers

✅ **Data-Driven Decisions**: No guesswork, clear recommendations based on market data

✅ **Loss Prevention**: Avoid spoilage losses with timely selling alerts

✅ **Profit Optimization**: Wait for better prices when safe to do so

✅ **Risk Management**: Clear risk indicators help make informed choices

✅ **Easy to Use**: Natural language - just ask questions

✅ **Always Available**: 24/7 access to recommendations

## Administrator Role

Admins must keep prices updated in the Admin Dashboard for accurate recommendations:

1. Navigate to `/admin` or `/admin/prices`
2. Update crop prices regularly
3. Prices automatically sync to chatbot
4. Farmers get real-time market-based recommendations

**Minimum Requirement**: At least 3-4 recent prices per crop for accurate analysis

## Privacy & Security

- All calculations happen on your server
- No external API calls for recommendations
- Farmer data stays private
- Admin controls all market data

---

**Need Help?**
Contact your system administrator or refer to `CHATBOT_INTEGRATION.md` for technical details.
