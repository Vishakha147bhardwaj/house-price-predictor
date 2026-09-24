import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent

print("Loading dataset...")
data = fetch_california_housing()
x = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target
print(f"Total records: {x.shape[0]:,}")

x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
print(f"Training on {len(x_train):,} rows, testing on {len(x_test):,} rows")

model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(x_train, y_train)

y_pred = model.predict(x_test)
mae_usd = mean_absolute_error(y_test, y_pred) * 100_000  # target is in $100k units
r2 = r2_score(y_test, y_pred)

print(f"Mean absolute error: ${mae_usd:,.0f}")
print(f"R² score: {r2:.3f}")

# compress=3 shrinks the file a lot (RandomForest files can exceed GitHub's 100 MB limit)
joblib.dump(model, BASE_DIR / "house_model.joblib", compress=3)
joblib.dump(list(x.columns), BASE_DIR / "house_features.joblib")

# Saved so the API reports real numbers instead of hard-coded ones
metrics = {
    "model": "RandomForestRegressor",
    "mae_usd": round(mae_usd),
    "r2": round(r2, 4),
    "train_rows": len(x_train),
    "test_rows": len(x_test),
}
(BASE_DIR / "metrics.json").write_text(json.dumps(metrics, indent=2))
print("Saved house_model.joblib, house_features.joblib and metrics.json")