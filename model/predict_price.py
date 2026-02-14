"""
Next-Day Commodity Price Prediction (Inference Only)
====================================================
Loads pre-trained models and predicts next-day price from user-provided
recent prices. No training, no model modification.
"""

from datetime import datetime, timedelta
from pathlib import Path
import numpy as np
import joblib
import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MODEL_DIR = Path(__file__).resolve().parent / "models"

# Feature names and order must match the trained models exactly
FEATURE_COLS = [
    "price_lag_1",
    "price_lag_2",
    "price_lag_3",
    "price_lag_7",
    "rolling_mean_3",
    "rolling_mean_7",
    "rolling_std_3",
    "day_of_week",
    "month",
]

# Use "Rs." for console compatibility; set to "₹" if your terminal supports UTF-8
CURRENCY_SYMBOL = "Rs."

SUPPORTED_COMMODITIES = [
    "Onion",
    "Potato",
    "Tomato",
    "Cucumber",
    "Wheat",
    "Bajra",
]


def _get_next_day_date_features():
    """Return day_of_week (0–6) and month (1–12) for tomorrow."""
    next_day = datetime.now() + timedelta(days=1)
    return next_day.weekday(), next_day.month


def _build_features(recent_prices: dict) -> pd.DataFrame:
    """
    Convert user input (lag1, lag2, lag3, lag7, optionally lag4, lag5, lag6)
    into the feature vector expected by the model.
    """
    lag1 = float(recent_prices["lag1"])
    lag2 = float(recent_prices["lag2"])
    lag3 = float(recent_prices["lag3"])
    lag7 = float(recent_prices["lag7"])

    rolling_mean_3 = np.mean([lag1, lag2, lag3])
    rolling_std_3 = float(np.std([lag1, lag2, lag3]))

    # rolling_mean_7: use 7 values if provided, else 4-point average
    if all(k in recent_prices for k in ("lag4", "lag5", "lag6")):
        rolling_mean_7 = np.mean([
            lag1, lag2, lag3,
            float(recent_prices["lag4"]),
            float(recent_prices["lag5"]),
            float(recent_prices["lag6"]),
            lag7,
        ])
    else:
        rolling_mean_7 = np.mean([lag1, lag2, lag3, lag7])

    day_of_week, month = _get_next_day_date_features()

    row = {
        "price_lag_1": lag1,
        "price_lag_2": lag2,
        "price_lag_3": lag3,
        "price_lag_7": lag7,
        "rolling_mean_3": rolling_mean_3,
        "rolling_mean_7": rolling_mean_7,
        "rolling_std_3": rolling_std_3,
        "day_of_week": day_of_week,
        "month": month,
    }
    return pd.DataFrame([row])[FEATURE_COLS]


def _load_model(commodity_name: str):
    """Load the joblib model for the given commodity. Returns None if not found."""
    name = commodity_name.strip()
    path = MODEL_DIR / f"{name.lower()}_model.pkl"
    if not path.exists():
        return None
    return joblib.load(path)


def predict_price(commodity_name: str, recent_prices_dict: dict) -> int | None:
    """
    Load the trained model for the commodity, build features from recent
    prices, and return the predicted next-day price (rounded integer).

    Parameters
    ----------
    commodity_name : str
        One of: Onion, Potato, Tomato, Cucumber, Wheat, Bajra
    recent_prices_dict : dict
        At least: {"lag1": p1, "lag2": p2, "lag3": p3, "lag7": p7}
        Optional for better rolling_mean_7: "lag4", "lag5", "lag6"

    Returns
    -------
    int or None
        Predicted price in Rs per quintal, or None if model missing / invalid input.
    """
    commodity_name = commodity_name.strip()
    if commodity_name not in SUPPORTED_COMMODITIES:
        return None
    required = ("lag1", "lag2", "lag3", "lag7")
    if not all(k in recent_prices_dict for k in required):
        return None

    model = _load_model(commodity_name)
    if model is None:
        return None

    X = _build_features(recent_prices_dict)
    pred = model.predict(X)[0]
    return int(round(pred))


def _get_user_input():
    """Prompt user for commodity and recent prices. Returns (commodity_name, recent_prices_dict)."""
    print("Supported commodities: Onion, Potato, Tomato, Cucumber, Wheat, Bajra")
    commodity = input("Commodity name: ").strip()
    if not commodity:
        return None, None

    print("\nEnter recent prices (Rs per quintal). Day -1 = most recent, Day -7 = 7 days ago.")
    try:
        lag1 = float(input("Day -1 (most recent): "))
        lag2 = float(input("Day -2: "))
        lag3 = float(input("Day -3: "))
        lag7 = float(input("Day -7: "))
    except ValueError:
        print("Invalid number. Please enter numeric values.")
        return None, None

    recent_prices = {"lag1": lag1, "lag2": lag2, "lag3": lag3, "lag7": lag7}

    optional = input("Optional: Enter Day -4, -5, -6 separated by spaces (or press Enter to skip): ").strip()
    if optional:
        parts = optional.split()
        if len(parts) >= 3:
            try:
                recent_prices["lag4"] = float(parts[0])
                recent_prices["lag5"] = float(parts[1])
                recent_prices["lag6"] = float(parts[2])
            except ValueError:
                pass
    return commodity, recent_prices


def main():
    """Take user input, predict next-day price, and print result."""
    print("=" * 50)
    print("Next-Day Commodity Price Prediction")
    print("=" * 50)
    commodity, recent_prices = _get_user_input()
    if commodity is None or recent_prices is None:
        return
    price = predict_price(commodity, recent_prices)
    if price is not None:
        print(f"\nPredicted next-day {commodity} price: {CURRENCY_SYMBOL}{price}")
    else:
        print(f"\nCould not predict (invalid commodity or model not found for '{commodity}').")


if __name__ == "__main__":
    main()
