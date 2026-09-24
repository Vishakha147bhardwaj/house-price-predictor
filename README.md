# California House Price Predictor

ML API that predicts California house prices, trained on 20,640 homes.

**Stack:** FastAPI · scikit-learn (RandomForest) · Pydantic · Docker · GitHub Actions

## Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Status and model metrics |
| POST | `/predict` | Predict one house (JSON) |
| POST | `/predict-file` | Upload CSV, download predictions |

## Run locally
    cd backend
    python3 -m venv venv && source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload

Then open http://127.0.0.1:8000/docs
