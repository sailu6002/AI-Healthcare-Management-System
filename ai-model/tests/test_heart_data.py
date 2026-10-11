"""Regression tests for the heart dataset column mapping (Phase 2.1).

These guard a previously confirmed defect: ``load_heart`` read the raw
Cleveland CSV with a column order that did not match the file, silently
relabelling clinical measurements (real ``trestbps`` ended up in ``thalach``,
etc.). Inference then fed a real blood pressure into a 0/1 sex feature,
saturating P(heart) to 1.0 for healthy patients.
"""

import joblib
import pandas as pd

from app.predictor import heart_features
from app.schemas import PatientHealthProfile
from src.preprocess import (
    ARTIFACTS_DIR,
    FEATURE_SPECS,
    HEART_CATEGORICAL,
    HEART_COLUMNS,
    HEART_NUMERIC,
    PROCESSED_DIR,
    load_heart,
)

# First raw row of data/raw/cleveland_heart.csv in documented UCI order.
FIRST_ROW_UCI = {
    "age": 63.0, "sex": 1.0, "cp": 1.0, "trestbps": 145.0, "chol": 233.0,
    "fbs": 1.0, "restecg": 2.0, "thalach": 150.0, "exang": 0.0,
    "oldpeak": 2.3, "slope": 3.0, "ca": 0.0, "thal": 6.0, "target": 0,
}


def test_heart_raw_columns_declared_in_uci_order():
    assert HEART_COLUMNS == ["age", "sex", "cp", "trestbps", "chol", "fbs",
                             "restecg", "thalach", "exang", "oldpeak", "slope",
                             "ca", "thal", "num"]


def test_load_heart_first_row_semantics():
    row = load_heart().iloc[0].to_dict()
    for column, expected in FIRST_ROW_UCI.items():
        assert row[column] == expected, column


def test_load_heart_clinical_ranges_look_like_real_measurements():
    df = load_heart()
    assert df["trestbps"].between(80, 220).all()
    assert df["chol"].between(100, 600).all()
    assert df["thalach"].between(60, 220).all()
    assert set(df["fbs"].dropna().unique()) <= {0.0, 1.0}
    assert set(df["exang"].dropna().unique()) <= {0.0, 1.0}
    assert set(df["ca"].dropna().unique()) <= {0.0, 1.0, 2.0, 3.0}


def test_target_is_not_an_input_feature():
    features = HEART_NUMERIC + HEART_CATEGORICAL
    assert "target" not in features
    assert "num" not in features

    train = pd.read_csv(PROCESSED_DIR / "heart_train.csv")
    assert "target" in train.columns
    assert "target" not in [c for c in train.columns if c != "target"]

    preprocessor = joblib.load(ARTIFACTS_DIR / "heart_preprocessor.joblib")
    assert "target" not in list(preprocessor.feature_names_in_)


def test_training_and_inference_feature_names_match():
    train = pd.read_csv(PROCESSED_DIR / "heart_train.csv")
    training_features = [c for c in train.columns if c != "target"]

    preprocessor = joblib.load(ARTIFACTS_DIR / "heart_preprocessor.joblib")
    assert list(preprocessor.feature_names_in_) == training_features

    inference_features = list(heart_features(PatientHealthProfile(age=50, gender="Male")))
    assert set(inference_features) == set(training_features)
    assert set(training_features) == set(HEART_NUMERIC + HEART_CATEGORICAL)


def test_heart_probabilities_within_unit_interval(predictor):
    for profile in (dict(age=25, gender="Female"),
                    dict(age=60, gender="Male", systolic_bp=160,
                         cholesterol=300, chest_pain_type=4,
                         max_heart_rate=120, exercise_angina=True,
                         st_depression=2.5)):
        probability = predictor.predict(PatientHealthProfile(**profile))["probabilities"]["heart"]
        assert 0.0 <= probability <= 1.0


def test_elevated_profile_ranks_above_normal_profile(predictor):
    """Relative ordering guard: the exact bug made normal >= elevated."""
    normal = predictor.predict(PatientHealthProfile(
        age=25, gender="Female", systolic_bp=110, cholesterol=150,
        max_heart_rate=180, exercise_angina=False, st_depression=0,
        fasting_glucose=85, chest_pain_type=1))["probabilities"]["heart"]

    elevated = predictor.predict(PatientHealthProfile(
        age=60, gender="Male", systolic_bp=160, cholesterol=300,
        chest_pain_type=4, max_heart_rate=120, exercise_angina=True,
        st_depression=2.5))["probabilities"]["heart"]

    assert elevated > normal


def test_normal_vitals_do_not_saturate_heart_risk(predictor):
    """Regression guard for the scrambled-column bug, which drove a healthy
    profile to P(heart)=1.0. Normal vitals must not saturate the probability."""
    probability = predictor.predict(PatientHealthProfile(
        age=25, gender="Female", systolic_bp=110, cholesterol=150,
        max_heart_rate=180, exercise_angina=False, st_depression=0,
        fasting_glucose=85, chest_pain_type=1))["probabilities"]["heart"]
    assert probability < 0.9


def test_api_response_schema_unchanged(client):
    body = client.post("/api/v1/assess",
                       json={"patient": {"age": 45, "gender": "Male"}}).json()
    assert set(body) == {"overall_risk", "disease_risks", "risk_areas",
                         "recommended_tests", "recommended_specialists",
                         "features_imputed", "disclaimer"}
    assert set(body["disease_risks"]) == {"diabetes", "heart", "kidney"}
    assert set(body["disease_risks"]["heart"]) == {"probability", "level", "top_factors"}
