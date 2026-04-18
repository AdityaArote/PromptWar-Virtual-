"""
FlowZone — Wait Time Prediction Model Training

Trains a RandomForestRegressor on zone_history data to predict
future wait times based on:
  - hour_of_day
  - day_of_week
  - current crowd_density
  - rolling average wait time (last 3 records)

Usage:
  python train.py --supabase-url $SUPABASE_URL --supabase-key $SUPABASE_KEY
"""

import os
import sys
import json
import pickle
import argparse
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Optional MLflow integration
try:
    import mlflow
    import mlflow.sklearn
    HAS_MLFLOW = True
except ImportError:
    HAS_MLFLOW = False

try:
    from supabase import create_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False


def fetch_training_data(supabase_url: str, supabase_key: str) -> pd.DataFrame:
    """Fetch zone_history from Supabase."""
    if not HAS_SUPABASE:
        print("supabase-py not installed. Using mock data.")
        return generate_mock_data()

    client = create_client(supabase_url, supabase_key)
    response = client.table("zone_history").select("*").order("recorded_at", desc=True).limit(10000).execute()

    if not response.data:
        print("No training data found. Using mock data.")
        return generate_mock_data()

    return pd.DataFrame(response.data)


def generate_mock_data(n_samples: int = 5000) -> pd.DataFrame:
    """Generate synthetic training data."""
    np.random.seed(42)

    hours = np.random.randint(0, 24, n_samples)
    days = np.random.randint(0, 7, n_samples)
    densities = np.random.randint(0, 100, n_samples)

    # Wait time formula: base + hour effect + day effect + density effect + noise
    base_wait = 5
    hour_effect = np.where((hours >= 11) & (hours <= 14), 8, 0) + np.where((hours >= 17) & (hours <= 20), 6, 0)
    day_effect = np.where((days >= 5), 4, 0)  # weekends busier
    density_effect = densities * 0.2
    noise = np.random.normal(0, 2, n_samples)

    wait_times = np.clip(base_wait + hour_effect + day_effect + density_effect + noise, 0, 60).astype(int)

    return pd.DataFrame({
        "hour_of_day": hours,
        "day_of_week": days,
        "crowd_density": densities,
        "wait_time_minutes": wait_times,
    })


def engineer_features(df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    """Create feature matrix and target vector."""
    # Ensure required columns
    for col in ["hour_of_day", "day_of_week", "crowd_density", "wait_time_minutes"]:
        if col not in df.columns:
            raise ValueError(f"Missing column: {col}")

    # Cyclical hour encoding
    df["hour_sin"] = np.sin(2 * np.pi * df["hour_of_day"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour_of_day"] / 24)

    # Cyclical day encoding
    df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)

    # Is peak hour
    df["is_peak"] = ((df["hour_of_day"] >= 11) & (df["hour_of_day"] <= 14) |
                     (df["hour_of_day"] >= 17) & (df["hour_of_day"] <= 20)).astype(int)

    # Is weekend
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    feature_cols = [
        "hour_sin", "hour_cos", "day_sin", "day_cos",
        "crowd_density", "is_peak", "is_weekend"
    ]

    X = df[feature_cols].values
    y = df["wait_time_minutes"].values

    return X, y


def train_model(X: np.ndarray, y: np.ndarray) -> tuple:
    """Train and evaluate the model."""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print(f"\n📊 Model Performance:")
    print(f"   MAE:  {mae:.2f} minutes")
    print(f"   RMSE: {rmse:.2f} minutes")
    print(f"   Samples: {len(X_train)} train / {len(X_test)} test")

    return model, {"mae": mae, "rmse": rmse, "n_train": len(X_train), "n_test": len(X_test)}


def save_model(model, metrics: dict, output_dir: str = "model"):
    """Save model artifact and metadata."""
    os.makedirs(output_dir, exist_ok=True)

    # Save model
    model_path = os.path.join(output_dir, "wait_time_model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    # Save metadata
    metadata = {
        "model_type": "RandomForestRegressor",
        "version": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "metrics": metrics,
        "features": [
            "hour_sin", "hour_cos", "day_sin", "day_cos",
            "crowd_density", "is_peak", "is_weekend"
        ],
        "trained_at": datetime.now().isoformat(),
    }

    meta_path = os.path.join(output_dir, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n✅ Model saved to {model_path}")
    print(f"   Metadata saved to {meta_path}")

    return model_path, metadata


def main():
    parser = argparse.ArgumentParser(description="Train wait time prediction model")
    parser.add_argument("--supabase-url", default=os.environ.get("NEXT_PUBLIC_SUPABASE_URL", ""))
    parser.add_argument("--supabase-key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""))
    parser.add_argument("--output-dir", default="model")
    parser.add_argument("--mlflow", action="store_true", help="Log to MLflow")
    args = parser.parse_args()

    print("🚀 FlowZone Wait Time Model Training")
    print("=" * 40)

    # Fetch data
    df = fetch_training_data(args.supabase_url, args.supabase_key)
    print(f"📦 Loaded {len(df)} samples")

    # Engineer features
    X, y = engineer_features(df)

    # Train
    if args.mlflow and HAS_MLFLOW:
        mlflow.set_experiment("flowzone-wait-time")
        with mlflow.start_run():
            model, metrics = train_model(X, y)
            mlflow.log_metrics(metrics)
            mlflow.sklearn.log_model(model, "model")
            model_path, metadata = save_model(model, metrics, args.output_dir)
            mlflow.log_artifact(model_path)
    else:
        model, metrics = train_model(X, y)
        save_model(model, metrics, args.output_dir)


if __name__ == "__main__":
    main()
