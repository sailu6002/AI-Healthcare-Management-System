# AI/ML Module — Health Risk Prediction & Recommendation

Part of the **AI-Based Smart Healthcare Management System**. This module is a
standalone Python microservice that accepts patient health information and
symptoms, predicts disease risk levels, and returns recommended medical tests
and specialist categories.

> **Safety notice:** All outputs are *screening-level risk assessments*, not
> medical diagnoses. Recommendations support — and never replace — a qualified
> healthcare professional.

## Responsibilities

- Diabetes, heart disease, and kidney disease risk prediction (Low / Moderate / High)
- Symptom analysis and overall health risk assessment
- Medical test recommendations and specialist-category recommendations
  (e.g., diabetes risk → Endocrinologist; heart → Cardiologist; kidney → Nephrologist)

Out of scope: doctor records, availability, and appointment booking — those belong
to the backend/database modules.

## Structure

```
config/       rules.yaml — thresholds, symptom mappings, tests & specialists
data/
  raw/        original downloaded datasets (gitignored)
  processed/  cleaned train/test CSVs (committed for reproducibility)
src/          offline training pipeline: preprocess.py, train.py, evaluate.py
artifacts/    trained models + fitted preprocessors (joblib)
app/          FastAPI inference service: main.py, schemas.py, predictor.py,
              assessment.py, recommender.py
tests/        pytest suite
notebooks/    EDA experiments
```

Training (`src/`) never runs in production; the API (`app/`) only loads saved
artifacts. Prediction, assessment, and recommendation are separate layers.

## Setup

```bash
cd ai-model
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# train models (after datasets are placed in data/raw/)
python -m src.train

# run the service
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

## API contract

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check for the Spring Boot backend |
| POST | `/api/v1/assess` | Full risk assessment (see `/docs` for schema) |

Example response shape:

```json
{
  "overall_risk": {"level": "Moderate", "score": 0.55},
  "disease_risks": {
    "diabetes": {"probability": 0.62, "level": "Moderate", "top_factors": ["glucose", "BMI"]},
    "heart":    {"probability": 0.31, "level": "Low"},
    "kidney":   {"probability": 0.18, "level": "Low"}
  },
  "risk_areas": ["metabolic"],
  "recommended_tests": ["Fasting Blood Sugar", "HbA1c"],
  "recommended_specialists": ["General Physician"],
  "features_imputed": [],
  "disclaimer": "This is a screening-level risk assessment, not a medical diagnosis."
}
```

The Spring Boot backend calls this service over HTTP and maps the returned
specialist categories to actual doctors and appointment slots.

## Datasets

| Disease | Dataset |
|---|---|
| Diabetes | Pima Indians Diabetes (Kaggle/UCI) |
| Heart disease | UCI Cleveland Heart Disease |
| Kidney disease | UCI Chronic Kidney Disease |

Sources are documented in `src/train.py` once wired in.
