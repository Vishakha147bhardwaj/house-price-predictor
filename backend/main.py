import io
import json
import os
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent  # works no matter where uvicorn is started from
MAX_FILE_SIZE_MB = 5
MAX_ROWS = 10_000

# ---------------------------------------------------------------------------
# Load model, feature list and training metrics once at startup
# ---------------------------------------------------------------------------
model = joblib.load(BASE_DIR / "house_model.joblib")
features: list[str] = joblib.load(BASE_DIR / "house_features.joblib")

metrics_path = BASE_DIR / "metrics.json"
metrics: dict = json.loads(metrics_path.read_text()) if metrics_path.exists() else {}
# Mean absolute error in USD, written by train.py. Fallback until you retrain.
MAE_USD: float = float(metrics.get("mae_usd", 39000))

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="California House Price API",
    version="1.0.0",
    description=(
        "Predicts median house values for California neighbourhoods using a "
        "RandomForestRegressor trained on the California Housing dataset (20,640 rows)."
    ),
)

# Comma-separated list, e.g. "http://localhost:3000,https://your-app.vercel.app"
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class HouseFeatures(BaseModel):
    MedInc: float = Field(gt=0, description="Median household income in the neighbourhood, in tens of thousands of USD.")
    HouseAge: float = Field(gt=0, description="Median house age in the neighbourhood, in years.")
    AveRooms: float = Field(gt=0, description="Average number of rooms per household.")
    AveBedrms: float = Field(gt=0, description="Average number of bedrooms per household.")
    Population: float = Field(gt=0, description="Total population of the neighbourhood.")
    AveOccup: float = Field(gt=0, description="Average number of household members.")
    Latitude: float = Field(ge=32, le=42, description="Latitude of the neighbourhood (California).")
    Longitude: float = Field(ge=-125, le=-114, description="Longitude of the neighbourhood (California).")

    # Pre-fills Swagger's "Try it out" with a real example
    model_config = {
        "json_schema_extra": {
            "examples": [{
                "MedInc": 8.3252, "HouseAge": 41, "AveRooms": 6.98, "AveBedrms": 1.02,
                "Population": 322, "AveOccup": 2.56, "Latitude": 37.88, "Longitude": -122.23,
            }]
        }
    }


class PredictionResponse(BaseModel):
    predicted_price_usd: float = Field(description="Predicted median house value in USD.")
    range_low_usd: float = Field(description="Prediction minus the model's mean absolute error.")
    range_high_usd: float = Field(description="Prediction plus the model's mean absolute error.")
    predicted_price_formatted: str = Field(description="Human-readable price, e.g. '$452,600'.")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def home():
    return {
        "message": "California House Price Prediction API",
        "docs": "/docs",
        "endpoints": ["/health", "/predict", "/predict-file"],
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": metrics.get("model", "RandomForestRegressor"),
        "features": features,
        "mae_usd": MAE_USD,
        "r2": metrics.get("r2"),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(house: HouseFeatures):
    try:
        input_data = pd.DataFrame([house.model_dump()])[features]
        predicted = float(model.predict(input_data)[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    # California Housing target is in units of $100,000
    price_usd = round(predicted * 100_000)
    return PredictionResponse(
        predicted_price_usd=price_usd,
        range_low_usd=max(0, round(price_usd - MAE_USD)),
        range_high_usd=round(price_usd + MAE_USD),
        predicted_price_formatted=f"${price_usd:,.0f}",
    )


@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...)):
    # --- 1. File type and size -------------------------------------------
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file only.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File is too large. Maximum size is {MAX_FILE_SIZE_MB} MB.")

    # --- 2. Parse CSV -----------------------------------------------------
    try:
        df = pd.read_csv(io.BytesIO(contents))
        df.columns = df.columns.str.replace("\ufeff", "", regex=False).str.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read the CSV file: {e}")

    # --- 3. Validate structure ---------------------------------------------
    missing_columns = [col for col in features if col not in df.columns]
    if missing_columns:
        raise HTTPException(status_code=400, detail=f"These columns are missing from your file: {missing_columns}")

    if df.empty:
        raise HTTPException(status_code=400, detail="The uploaded file has no data rows.")

    if len(df) > MAX_ROWS:
        raise HTTPException(status_code=400, detail=f"Too many rows. Maximum is {MAX_ROWS:,}.")

    # --- 4. Validate values (user errors -> 400, not 500) ------------------
    try:
        input_data = df[features].apply(pd.to_numeric, errors="raise")
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="All feature columns must contain numbers only.")

    empty_cols = input_data.columns[input_data.isna().any()].tolist()
    if empty_cols:
        raise HTTPException(status_code=400, detail=f"Missing values found in columns: {empty_cols}")

    # --- 5. Predict ----------------------------------------------------------
    try:
        predictions = model.predict(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    # Keep the column numeric so it can be sorted/summed in Excel
    df["predicted_price_usd"] = (predictions * 100_000).round(0).astype(int)

    return Response(
        content=df.to_csv(index=False),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=predictions.csv"},
    )