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

# trained models are committed under artifacts/; to retrain from scratch:
python -m src.preprocess   # rebuild splits + preprocessors (needs data/raw/)
python -m src.train        # retrain models + metrics reports

# run the service
uvicorn app.main:app --reload --port 8000

# run the test suite (19 tests)
pytest tests/ -v
```

Interactive API docs: http://localhost:8000/docs

## Testing it (curl)

```bash
# liveness
curl http://localhost:8000/health

# full assessment
curl -X POST http://localhost:8000/api/v1/assess \
  -H "Content-Type: application/json" \
  -d '{"patient": {"age": 55, "gender": "Male", "height_cm": 170,
       "weight_kg": 95, "fasting_glucose": 190, "systolic_bp": 150,
       "diastolic_bp": 95, "hypertension": true, "has_diabetes": true,
       "symptoms": ["frequent_urination", "excessive_thirst"]}}'
```

Recognized symptoms (see `config/rules.yaml` for the full list):
`frequent_urination`, `excessive_thirst`, `blurred_vision`,
`slow_healing_wounds`, `tingling_hands_feet`, `chest_pain`,
`shortness_of_breath`, `palpitations`, `irregular_heartbeat`,
`dizziness_on_exertion`, `swollen_legs_or_ankles`, `foamy_urine`,
`blood_in_urine`, `decreased_urine_output`, `persistent_itching`,
`fatigue`, `unexplained_weight_loss`, `loss_of_appetite`, `night_sweats`,
plus dermatological routes (`rash`, `itching`, `acne`, `skin_discoloration`,
`hair_loss`). Unknown symptom strings are ignored safely.

## Backend integration (Spring Boot)

The backend only needs one call per assessment:

```
POST http://<ai-host>:8000/api/v1/assess
Body: {"patient": { ...PatientHealthProfile fields... }}
```

Use `RestTemplate`/`WebClient`; check `/health` before calling. The response's
`recommended_specialists` values are **categories** (e.g., `Cardiologist`) -
map them to your doctors' specialization field, then filter by availability.
Field-level validation errors return HTTP 422 with details.

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

## Known limitations

- **Case-mix bias (kidney):** the CKD dataset oversamples diseased patients
  (248/150), so a request with few clinical values lands near the model's
  ~0.5 balanced prior and may band Moderate, recommending a nephrologist
  check-up. This errs on the safe side for a screening tool but should be
  stated in any evaluation/demo.
- **Imputed inputs:** models were trained on complete clinical rows; requests
  missing values are median/mode-imputed inside the pipeline. Probabilities
  reflect "average clinic patient" for whatever was not supplied.
  `features_imputed` reports exactly what was inferred.
- **Probability saturation:** logistic regression outputs can approach 0/1
  for extreme profiles (e.g., typical-angina + ST depression); levels remain
  correct but probabilities should not be read as calibrated percentages.
- **Lifestyle flags** (`smoker`, family history) feed the rules layer and
  future extensions, not the current models - the source datasets contain no
  matching columns.

## Safety

All outputs are screening-level risk assessments, never diagnoses. Every
response carries an explicit disclaimer. Recommendations support - and never
replace - qualified healthcare professionals.

## Project status

| Phase | Status |
|---|---|
| Scaffold + API contract | done |
| Dataset acquisition (UCI CC BY 4.0) | done |
| Leakage-safe preprocessing (seed 42, stratified) | done |
| Model training & selection (LR vs RF, ROC-AUC primary) | done |
| Rules engine (bands, overall score, tests/specialists) | done |
| FastAPI integration + pytest suite (19 passing) | done |
| Docker / cloud deployment | future semester work |
| Additional diseases / symptom NLP model | future extension |

Model performance summary (held-out test sets): diabetes ROC-AUC 0.82
(Random Forest), heart 0.95 and kidney 0.98 (Logistic Regression). Full
metrics in `artifacts/*_metrics.json`.

## Datasets

| Disease | Dataset |
|---|---|
| Diabetes | Pima Indians Diabetes (Kaggle/UCI) |
| Heart disease | UCI Cleveland Heart Disease |
| Kidney disease | UCI Chronic Kidney Disease |

Sources are documented in `src/train.py` once wired in.
