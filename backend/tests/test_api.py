import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

VALID = {
    "MedInc": 8.3252, "HouseAge": 41, "AveRooms": 6.98, "AveBedrms": 1.02,
    "Population": 322, "AveOccup": 2.56, "Latitude": 37.88, "Longitude": -122.23,
}
HEADER = ",".join(VALID.keys())
ROW = ",".join(str(v) for v in VALID.values())


def test_home():
    assert client.get("/").status_code == 200


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert len(r.json()["features"]) == 8


def test_predict_valid():
    r = client.post("/predict", json=VALID)
    assert r.status_code == 200
    body = r.json()
    assert body["predicted_price_usd"] > 0
    assert body["range_low_usd"] <= body["predicted_price_usd"] <= body["range_high_usd"]


def test_predict_rejects_out_of_california():
    r = client.post("/predict", json={**VALID, "Latitude": 50})
    assert r.status_code == 422


def test_predict_file_valid():
    csv = f"{HEADER}\n{ROW}\n{ROW}\n"
    r = client.post("/predict-file", files={"file": ("h.csv", csv, "text/csv")})
    assert r.status_code == 200
    assert "predicted_price_usd" in r.text
    assert len(r.text.strip().splitlines()) == 3


def test_predict_file_rejects_non_csv():
    r = client.post("/predict-file", files={"file": ("h.txt", "hello", "text/plain")})
    assert r.status_code == 400


def test_predict_file_missing_columns():
    r = client.post("/predict-file", files={"file": ("h.csv", "MedInc\n1\n", "text/csv")})
    assert r.status_code == 400


def test_predict_file_non_numeric():
    csv = f"{HEADER}\n{ROW.replace('8.3252', 'abc')}\n"
    r = client.post("/predict-file", files={"file": ("h.csv", csv, "text/csv")})
    assert r.status_code == 400
