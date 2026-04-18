"""
FlowZone — Wait Time Prediction API

FastAPI server for serving wait time predictions.

Usage:
  uvicorn predict:app --host 0.0.0.0 --port 8000
"""

import os
import json
import pickle
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="FlowZone Prediction API",
    description="Wait time and congestion prediction for venue zones",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
MODEL_DIR = os.environ.get("MODEL_DIR", "model")
model = None
metadata = None


@app.on_event("startup")
def load_model():
    global model, metadata

    model_path = Path(MODEL_DIR) / "wait_time_model.pkl"
    meta_path = Path(MODEL_DIR) / "metadata.json"

    if model_path.exists():
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        print(f"✅ Model loaded from {model_path}")
    else:
        print(f"⚠️ No model found at {model_path}. Using fallback predictions.")

    if meta_path.exists():
        with open(meta_path) as f:
            metadata = json.load(f)
        print(f"   Version: {metadata.get('version', 'unknown')}")


class PredictionRequest(BaseModel):
    zone_id: str
    hour: int  # 0-23
    day_of_week: int  # 0-6 (0=Monday)
    crowd_density: int = 50  # 0-100


class BatchPredictionRequest(BaseModel):
    zones: list[PredictionRequest]


class PredictionResponse(BaseModel):
    zone_id: str
    predicted_wait_minutes: float
    confidence_interval: tuple[float, float]
    model_version: str


def make_prediction(req: PredictionRequest) -> PredictionResponse:
    """Generate a prediction for a single zone."""
    hour = req.hour
    day = req.day_of_week
    density = req.crowd_density

    # Engineer features (same as training)
    features = np.array([[
        np.sin(2 * np.pi * hour / 24),  # hour_sin
        np.cos(2 * np.pi * hour / 24),  # hour_cos
        np.sin(2 * np.pi * day / 7),    # day_sin
        np.cos(2 * np.pi * day / 7),    # day_cos
        density,                          # crowd_density
        int(11 <= hour <= 14 or 17 <= hour <= 20),  # is_peak
        int(day >= 5),                    # is_weekend
    ]])

    if model is not None:
        # Use tree predictions for confidence intervals
        tree_predictions = np.array([tree.predict(features)[0] for tree in model.estimators_])
        predicted = float(np.mean(tree_predictions))
        std = float(np.std(tree_predictions))

        ci_low = max(0, round(predicted - 1.96 * std, 1))
        ci_high = round(predicted + 1.96 * std, 1)
        version = metadata.get("version", "unknown") if metadata else "unknown"
    else:
        # Fallback: heuristic prediction
        base = 5
        peak_bonus = 8 if (11 <= hour <= 14 or 17 <= hour <= 20) else 0
        weekend_bonus = 4 if day >= 5 else 0
        density_factor = density * 0.2

        predicted = base + peak_bonus + weekend_bonus + density_factor
        std = 3.0
        ci_low = max(0, round(predicted - std, 1))
        ci_high = round(predicted + std, 1)
        version = "heuristic_v1"

    return PredictionResponse(
        zone_id=req.zone_id,
        predicted_wait_minutes=round(predicted, 1),
        confidence_interval=(ci_low, ci_high),
        model_version=version,
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "version": metadata.get("version", "unknown") if metadata else "no_model",
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    return make_prediction(req)


@app.post("/predict/batch", response_model=dict)
def predict_batch(req: BatchPredictionRequest):
    if len(req.zones) > 100:
        raise HTTPException(status_code=400, detail="Max 100 zones per batch")

    predictions = [make_prediction(z).dict() for z in req.zones]
    return {"predictions": predictions}
