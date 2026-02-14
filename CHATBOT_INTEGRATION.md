# KISAN AI Assistant – Integration Instructions

This document describes how to run the **KISAN AI Assistant** chatbot (floating widget) and its backend.

## What Was Added (no existing pages modified)

- **Frontend:** `src/components/KisanChatbot.jsx` + `src/components/KisanChatbot.css`  
  - Floating button (bottom-right), glassmorphism chat window, typing/loading animations, voice button UI.
  - **Farmers only** – chatbot automatically fetches prices from admin panel (no manual entry required).
  - **NEW:** Selling recommendations based on stock quantity, shelf life, and price trends.
- **App:** `KisanChatbot` component rendered via `FarmersOnlyChatbot` in `App.tsx` (visible only on farmer routes, hidden on admin routes).
- **Backend:** `backend/server.js` and `backend/routes/chatbot.js`  
  - `POST /chatbot/predict` – calls Python script and returns prediction.
  - `GET /chatbot/prices/last/:commodity` – returns last 4 prices for auto-fetch.
  - `POST /chatbot/prices` – admin sync endpoint to store last 4 prices per crop.
  - **NEW:** `POST /chatbot/recommend` – generates selling recommendations based on stock and market analysis.
- **Python:** `predict.py` in the **Hackathon** folder (parent of Pixel_Perfect_Hackathon).  
  - Uses existing `predict_price.py` and trained models in `Hackathon/models/`.
- **Admin Panel:** `src/pages/AdminDashboard.tsx` and `src/pages/AdminPriceControl.tsx`  
  - Admin can add/edit crop prices and view last price before update.
  - Stores and displays last 4 prices for each crop (used for chatbot predictions).
- **Crop Data:** `src/lib/cropData.ts` – shelf life data and recommendation logic for all supported crops.
- **Vite:** Proxy `/chatbot` → `http://localhost:3001` so the frontend can call the backend.

---

## Prerequisites

1. **Node.js** (v18+).
2. **Python 3** with: `pandas`, `numpy`, `joblib`, `scikit-learn` (and `xgboost` if models were trained with it).
3. **Trained models** in `Hackathon/models/`:  
   `onion_model.pkl`, `potato_model.pkl`, `tomato_model.pkl`, `cucumber_model.pkl`, `wheat_model.pkl`, `bajra_model.pkl`.  
   If missing, run the training script in `Hackathon` first to generate them.

---

## 1. Backend (Node.js)

From the **Pixel_Perfect_Hackathon** folder:

```bash
cd backend
npm install
npm start
```

Backend runs at **http://localhost:3001**.  
`POST /chatbot/predict` expects:

```json
{ "commodity": "onion", "prices": [1142, 1100, 1080, 1050] }
```

and returns:

```json
{ "reply": "Predicted Onion price for tomorrow is ₹XXXX", "prediction": XXXX }
```

---

## 2. Python script and models

- **predict.py** must be in the **Hackathon** folder (parent of Pixel_Perfect_Hackathon).
- **Models** must be in **Hackathon/models/**.
- Backend starts the script with working directory = `Hackathon`, so `predict.py` can import `predict_price` and load models from `models/`.

To test Python directly (from `Hackathon`):

```bash
cd path/to/Hackathon
python predict.py onion 1142 1100 1080 1050
```

Expected stdout (JSON): `{"reply": "Predicted Onion price for tomorrow is ₹...", "prediction": ...}`

---

## 3. Frontend (Vite)

From **Pixel_Perfect_Hackathon**:

```bash
npm run dev
```

App runs at **http://localhost:8080**.  
Vite proxies `/chatbot/*` to the backend at port 3001, so the chatbot uses `POST /chatbot/predict` without CORS issues.

---

## 4. Using the chatbot

### For Farmers:
1. Open the app (e.g. http://localhost:8080) and navigate to any farmer page (dashboard, prices, calculator, etc.).
2. Click the floating **KISAN AI** button (bottom-right).
3. **Price Predictions:**
   - User: `Predict onion price`
   - Bot: `Predicted Onion price for tomorrow is ₹XXXX`

4. **Selling Recommendations (NEW):**
   - User: `Should I sell my 30 quintals of tomato?`
   - Bot provides detailed recommendation including:
     - Best day to sell
     - Risk level (Low/Medium/High)
     - Price trend analysis
     - Urgency score (1-10)
     - Reasoning based on shelf life and market conditions

The chatbot automatically fetches the last 4 prices from the admin panel - no manual entry needed!

### For Admins:
1. Navigate to Admin Dashboard (`/admin`) or Admin Price Control (`/admin/prices`).
2. Add or edit crop prices in the table.
3. Click **Save** to update prices - these will automatically sync to the chatbot.
4. The chatbot is **not visible** in admin pages (farmers only).

**Note:** The chatbot needs at least 3-4 recent prices per crop to make predictions and recommendations. If prices aren't available, it will ask farmers to contact the admin.

---

## 5. Selling Recommendations Feature

The chatbot now provides intelligent selling recommendations based on:

### Factors Considered:
1. **Shelf Life**: Each crop has a specific shelf life (e.g., tomato: 7 days, wheat: 180 days)
2. **Price Trends**: Analyzes last 4 prices to detect increasing, decreasing, or stable trends
3. **Risk Assessment**: Combines shelf life urgency with market movement
4. **Predicted Prices**: Uses ML predictions when available for better recommendations

### Crop Categories:
- **Perishable** (tomato, cucumber): Short shelf life (5-7 days) - urgent selling recommended
- **Semi-Perishable** (onion, potato): Medium shelf life (30-45 days) - balanced approach
- **Storable** (wheat, rice, bajra, soybean): Long shelf life (90-180 days) - can wait for better prices

### Recommendation Output:
- Best day to sell (e.g., "Today or tomorrow", "Within 7 days")
- Risk level: Low 🟢 / Medium 🟡 / High 🔴
- Urgency score: 1-10 scale
- Price trend analysis with percentage change
- Detailed reasoning explaining the recommendation
- Predicted future price (when available)

### Example Queries:
- "Should I sell my 30 quintals of onion?"
- "When to sell tomato?"
- "I have 50 qt of wheat, should I sell now?"

---

## 6. File structure (reference)

```
Hackathon/
  predict.py              # CLI for backend (calls predict_price)
  predict_price.py       # Shared prediction logic
  models/
    onion_model.pkl
    potato_model.pkl
    ...
Pixel_Perfect_Hackathon/
  src/
    App.tsx               # KisanChatbot added here
    components/
      KisanChatbot.jsx    # Chatbot UI with predictions & recommendations
      KisanChatbot.css
    lib/
      cropData.ts         # Crop shelf life data and recommendation logic
  backend/
    server.js             # Express, port 3001
    package.json
    routes/
      chatbot.js          # POST /chatbot/predict, /recommend, /prices
  vite.config.ts          # proxy /chatbot -> localhost:3001
  CHATBOT_INTEGRATION.md   # this file
```

---

## 7. Troubleshooting

- **"Prediction failed"**  
  - Backend and Python path: ensure `backend/routes/chatbot.js` resolves `PROJECT_ROOT` to the **Hackathon** folder (parent of Pixel_Perfect_Hackathon).  
  - Run `python predict.py onion 1142 1100 1080 1050` from `Hackathon`; if it fails, fix Python/env/models first.
- **CORS / network**  
  - Use the Vite proxy (request `/chatbot/predict` from the frontend, no full URL).  
  - Ensure the backend is running on port 3001.
- **Models not found**  
  - Ensure `Hackathon/models/*.pkl` exist; if not, run the training pipeline in `Hackathon` that creates them.
