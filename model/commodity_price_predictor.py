"""
Commodity Price Next-Day Prediction System
==========================================
Time-series ML pipeline for predicting next-day Modal_Price_RS_per_Quintal
for multiple commodities. One XGBoost (or RandomForest) model per commodity.
No shuffling, no future leakage, production-quality code.
"""

import os
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

warnings.filterwarnings("ignore")

# Try XGBoost; fallback to RandomForest if unavailable
try:
    import xgboost as xgb
    USE_XGBOOST = True
except ImportError:
    USE_XGBOOST = False

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DATA_PATH = Path(__file__).resolve().parent / "pune_multi_crop_prices_ml_ready.csv"
MODEL_DIR = Path(__file__).resolve().parent / "models"
COMMODITIES = ["Onion", "Potato", "Tomato", "Cucumber", "Wheat", "Bajra"]
TARGET_COL = "Modal_Price_RS_per_Quintal"
DATE_COL = "Date"

# Model hyperparameters
N_ESTIMATORS = 300
MAX_DEPTH = 6
LEARNING_RATE = 0.05
TRAIN_RATIO = 0.9  # First 90% train, last 10% test

# Feature names used by model (must match training)
FEATURE_COLS = [
    "price_lag_1", "price_lag_2", "price_lag_3", "price_lag_7",
    "rolling_mean_3", "rolling_mean_7", "rolling_std_3",
    "day_of_week", "month",
]


# ---------------------------------------------------------------------------
# STEP 1: Load and Clean Data
# ---------------------------------------------------------------------------
def load_and_clean_data(path: Path) -> pd.DataFrame:
    """Load CSV, parse dates, sort by Commodity then Date, handle missing values."""
    df = pd.read_csv(path)
    df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors="coerce")
    df = df.sort_values(by=["Commodity", DATE_COL]).reset_index(drop=True)

    # Handle missing values
    if df[TARGET_COL].isna().any():
        df[TARGET_COL] = df.groupby("Commodity")[TARGET_COL].ffill().bfill()
    if df[DATE_COL].isna().any():
        df = df.dropna(subset=[DATE_COL])

    # Drop duplicate (Commodity, Date) if any
    df = df.drop_duplicates(subset=["Commodity", DATE_COL], keep="first")
    return df


# ---------------------------------------------------------------------------
# STEP 2: Feature Engineering (per commodity)
# ---------------------------------------------------------------------------
def add_features_for_commodity(series: pd.Series, dates: pd.Series) -> pd.DataFrame:
    """
    Build lag, rolling, and date features for a single commodity's price series.
    No future leakage: lags and rolling use only past/current values.
    """
    out = pd.DataFrame(index=series.index)
    # Lag features (past prices only)
    out["price_lag_1"] = series.shift(1)
    out["price_lag_2"] = series.shift(2)
    out["price_lag_3"] = series.shift(3)
    out["price_lag_7"] = series.shift(7)
    # Rolling: past only — at t use t-3..t-1 for window 3, t-7..t-1 for window 7
    out["rolling_mean_3"] = series.shift(1).rolling(window=3, min_periods=3).mean()
    out["rolling_mean_7"] = series.shift(1).rolling(window=7, min_periods=7).mean()
    out["rolling_std_3"] = series.shift(1).rolling(window=3, min_periods=3).std()
    # Date features
    out["day_of_week"] = dates.dt.dayofweek
    out["month"] = dates.dt.month
    return out


def build_featured_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """For each commodity, add features then stack. Drops rows with NaN in features/target."""
    frames = []
    for commodity in COMMODITIES:
        subset = df[df["Commodity"] == commodity].copy()
        if len(subset) == 0:
            continue
        subset = subset.sort_values(DATE_COL).reset_index(drop=True)
        prices = subset[TARGET_COL]
        dates = subset[DATE_COL]
        feats = add_features_for_commodity(prices, dates)
        feats[TARGET_COL] = subset[TARGET_COL].values
        feats["Commodity"] = commodity
        feats[DATE_COL] = dates.values
        frames.append(feats)
    combined = pd.concat(frames, ignore_index=True)
    # Drop rows where any feature or target is NaN (e.g. first 7 rows per commodity)
    combined = combined.dropna(subset=FEATURE_COLS + [TARGET_COL])
    return combined


# ---------------------------------------------------------------------------
# STEP 3: Time-series Train/Test Split
# ---------------------------------------------------------------------------
def time_train_test_split(df: pd.DataFrame, ratio: float = TRAIN_RATIO):
    """
    Split by time: first `ratio` of rows = train, last (1-ratio) = test.
    Returns (X_train, X_test, y_train, y_test) per commodity in a dict,
    and the full featured dataframe for later use.
    """
    featured = build_featured_dataset(df)
    splits = {}
    for commodity in COMMODITIES:
        sub = featured[featured["Commodity"] == commodity].sort_values(DATE_COL).reset_index(drop=True)
        if len(sub) < 10:
            continue
        n = len(sub)
        n_train = max(1, int(n * ratio))
        train_df = sub.iloc[:n_train]
        test_df = sub.iloc[n_train:]
        if len(test_df) == 0:
            continue
        X_train = train_df[FEATURE_COLS]
        y_train = train_df[TARGET_COL]
        X_test = test_df[FEATURE_COLS]
        y_test = test_df[TARGET_COL]
        splits[commodity] = {
            "X_train": X_train, "y_train": y_train,
            "X_test": X_test, "y_test": y_test,
            "train_df": train_df, "test_df": test_df,
            "full_df": sub,
        }
    return splits, featured


# ---------------------------------------------------------------------------
# STEP 4 & 5: Model training (one per commodity)
# ---------------------------------------------------------------------------
def create_model():
    """Create regressor: XGBoost if available, else RandomForest."""
    if USE_XGBOOST:
        return xgb.XGBRegressor(
            n_estimators=N_ESTIMATORS,
            max_depth=MAX_DEPTH,
            learning_rate=LEARNING_RATE,
            random_state=42,
            objective="reg:squarederror",
        )
    return RandomForestRegressor(
        n_estimators=N_ESTIMATORS,
        max_depth=MAX_DEPTH,
        random_state=42,
    )


def train_models(df: pd.DataFrame):
    """Train one model per commodity; return dict of fitted models and splits."""
    splits, featured = time_train_test_split(df)
    models = {}
    for commodity in COMMODITIES:
        if commodity not in splits:
            continue
        s = splits[commodity]
        model = create_model()
        model.fit(s["X_train"], s["y_train"])
        models[commodity] = {"model": model, "splits": s, "featured_df": s["full_df"]}
    return models, featured


# ---------------------------------------------------------------------------
# STEP 6: Evaluation (RMSE, MAE)
# ---------------------------------------------------------------------------
def evaluate_models(models: dict) -> None:
    """Print RMSE and MAE for each commodity."""
    print("\n" + "=" * 60)
    print("MODEL EVALUATION (Test Set)")
    print("=" * 60)
    for commodity in COMMODITIES:
        if commodity not in models:
            print(f"{commodity}: No model trained (insufficient data).")
            continue
        s = models[commodity]["splits"]
        y_true = s["y_test"]
        y_pred = models[commodity]["model"].predict(s["X_test"])
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        mae = mean_absolute_error(y_true, y_pred)
        print(f"\n{commodity}:")
        print(f"  RMSE: {rmse:.2f} Rs/quintal")
        print(f"  MAE:  {mae:.2f} Rs/quintal")
    print("\n" + "=" * 60)


# ---------------------------------------------------------------------------
# STEP 7: Next-day prediction from latest data
# ---------------------------------------------------------------------------
def build_next_day_features(commodity: str, raw_df: pd.DataFrame, featured_df: pd.DataFrame) -> pd.DataFrame:
    """
    Use latest available data for this commodity to build one row of features
    as of "next day" (so we use last 7 prices for lags/rolling and last date for day/month).
    """
    sub = raw_df[raw_df["Commodity"] == commodity].sort_values(DATE_COL).reset_index(drop=True)
    if len(sub) < 8:
        return None
    prices = sub[TARGET_COL].iloc[-7:].values  # last 7 prices (need 7 for lag_7 and rolling_7)
    last_date = sub[DATE_COL].iloc[-1]
    next_date = last_date + pd.Timedelta(days=1)

    # Lag-1 = last known price, lag-2 = second-to-last, ... lag-7 = 7th from end
    row = {
        "price_lag_1": prices[-1],
        "price_lag_2": prices[-2],
        "price_lag_3": prices[-3],
        "price_lag_7": prices[-7],
        "rolling_mean_3": float(np.mean(prices[-3:])),
        "rolling_mean_7": float(np.mean(prices[-7:])),
        "rolling_std_3": float(np.std(prices[-3:])) if len(prices) >= 3 else 0.0,
        "day_of_week": next_date.dayofweek,
        "month": next_date.month,
    }
    return pd.DataFrame([row])


def predict_next_day_price(commodity_name: str, models: dict, raw_df: pd.DataFrame) -> float | None:
    """
    Predict next-day price for given commodity using latest data and stored model.
    Returns predicted price (rounded integer) or None if not available.
    """
    commodity_name = commodity_name.strip()
    if commodity_name not in models:
        return None
    X_next = build_next_day_features(commodity_name, raw_df, models[commodity_name]["featured_df"])
    if X_next is None or X_next.isna().any().any():
        return None
    X_next = X_next[FEATURE_COLS]
    pred = models[commodity_name]["model"].predict(X_next)[0]
    return int(round(pred))


# ---------------------------------------------------------------------------
# STEP 8: Save / Load models with joblib
# ---------------------------------------------------------------------------
def save_models(models: dict) -> None:
    """Save each commodity model and its metadata to MODEL_DIR."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for commodity in models:
        fname = f"{commodity.lower()}_model.pkl"
        path = MODEL_DIR / fname
        joblib.dump(models[commodity]["model"], path)
        print(f"Saved: {path}")
    # Save commodity list and feature names for loading
    meta = {"commodities": list(models.keys()), "feature_cols": FEATURE_COLS}
    joblib.dump(meta, MODEL_DIR / "meta.pkl")


def load_models(raw_df: pd.DataFrame) -> dict:
    """Load models from disk; return same structure as train_models for prediction."""
    meta_path = MODEL_DIR / "meta.pkl"
    if not meta_path.exists():
        return {}
    meta = joblib.load(meta_path)
    models = {}
    for commodity in meta["commodities"]:
        path = MODEL_DIR / f"{commodity.lower()}_model.pkl"
        if not path.exists():
            continue
        model = joblib.load(path)
        # Rebuild featured_df from raw for predict_next_day_price
        featured = build_featured_dataset(raw_df)
        sub = featured[featured["Commodity"] == commodity].sort_values(DATE_COL).reset_index(drop=True)
        models[commodity] = {"model": model, "splits": {}, "featured_df": sub}
    return models


# ---------------------------------------------------------------------------
# Main: run pipeline
# ---------------------------------------------------------------------------
def main():
    print("Commodity Next-Day Price Prediction Pipeline")
    print("============================================\n")

    # STEP 1
    print("STEP 1: Loading and cleaning data...")
    df = load_and_clean_data(DATA_PATH)
    print(f"Loaded {len(df)} rows. Date range: {df[DATE_COL].min()} to {df[DATE_COL].max()}")

    # STEP 2–5: Feature engineering is inside time_train_test_split and train_models
    print("\nSTEP 2–5: Building features and training models (no shuffle, time-ordered split)...")
    models, featured = train_models(df)
    print(f"Trained {len(models)} commodity models.")

    # STEP 6
    evaluate_models(models)

    # STEP 7: Example prediction
    print("\nSTEP 7: Next-day price predictions (example)")
    print("-" * 40)
    for comm in COMMODITIES:
        pred = predict_next_day_price(comm, models, df)
        if pred is not None:
            print(f"Predicted next day {comm} price: {pred}")
        else:
            print(f"Predicted next day {comm} price: (insufficient data)")

    # STEP 8
    print("\nSTEP 8: Saving models...")
    save_models(models)
    print("Done.")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        # CLI: python commodity_price_predictor.py Onion  -> predict and print
        commodity_name = " ".join(sys.argv[1:]).strip()
        df = load_and_clean_data(DATA_PATH)
        models = load_models(df)
        if not models:
            models, _ = train_models(df)
            save_models(models)
        pred = predict_next_day_price(commodity_name, models, df)
        if pred is not None:
            print(f"Predicted next day {commodity_name} price: {pred}")
        else:
            print(f"Cannot predict for '{commodity_name}' (unknown commodity or insufficient data).")
        sys.exit(0 if pred is not None else 1)
    main()
