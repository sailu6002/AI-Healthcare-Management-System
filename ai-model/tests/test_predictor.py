"""Unit tests for model loading and feature mapping (app/predictor.py)."""

import math

import pandas as pd

from app.predictor import DISEASES, MAPPERS, _to_frame, diabetes_features


def test_all_models_loaded(predictor):
    assert set(predictor.models) == set(DISEASES)


def test_probabilities_within_bounds(predictor):
    from app.schemas import PatientHealthProfile

    result = predictor.predict(PatientHealthProfile(age=40, gender="Male"))
    for disease, prob in result["probabilities"].items():
        assert 0.0 <= prob <= 1.0, disease


def test_sparse_input_does_not_inflate_heart_risk(predictor):
    """Regression guard: all-None columns previously arrived as object dtype,
    bypassed imputation, and inflated P(heart) to ~0.75 (correct ~0.11)."""
    from app.schemas import PatientHealthProfile

    result = predictor.predict(PatientHealthProfile(age=22, gender="Female"))
    assert result["probabilities"]["heart"] < 0.30


def test_male_pregnancies_default_to_zero():
    from app.schemas import Gender, PatientHealthProfile

    p = PatientHealthProfile(age=30, gender=Gender.MALE, pregnancies=None)
    assert diabetes_features(p)["pregnancies"] == 0


def test_bmi_computed_from_height_weight_when_missing():
    from app.schemas import PatientHealthProfile

    p = PatientHealthProfile(age=30, gender="Female",
                             height_cm=170, weight_kg=70)
    assert diabetes_features(p)["bmi"] == round(70 / 1.7 ** 2, 1)


def test_bmi_prefers_explicit_value():
    from app.schemas import PatientHealthProfile

    p = PatientHealthProfile(age=30, gender="Female", height_cm=170,
                             weight_kg=70, bmi=25.5)
    assert diabetes_features(p)["bmi"] == 25.5


def test_to_frame_forces_float64_on_all_missing_columns():
    row = {c: None for c in ["a", "b"]}
    frame = _to_frame(row)
    assert not any(frame[c].dtype == object for c in frame.columns)
    assert pd.isna(frame.iloc[0]).all()


def test_features_imputed_reported_and_sorted(predictor):
    from app.schemas import PatientHealthProfile

    result = predictor.predict(PatientHealthProfile(age=22, gender="Female"))
    imputed = result["features_imputed"]
    assert imputed == sorted(imputed)
    assert len(imputed) > 10


def test_top_factors_only_reference_supplied_features(predictor):
    from app.schemas import PatientHealthProfile

    p = PatientHealthProfile(age=55, gender="Male", fasting_glucose=190, bmi=32.9)
    result = predictor.predict(p)
    factors = result["top_factors"]["diabetes"]
    supplied = {"age", "glucose", "bmi"}
    assert factors and set(factors) <= supplied


def test_unknown_symptom_boost_is_noop():
    from app.rules_engine import apply_symptom_boosts

    base = {"diabetes": 0.2, "heart": 0.2, "kidney": 0.2}
    adjusted, matched = apply_symptom_boosts(base, ["made_up_symptom"])
    assert adjusted == base and matched == []


def test_symptom_boost_is_capped():
    from app.rules_engine import apply_symptom_boosts

    adjusted, _ = apply_symptom_boosts(
        {"diabetes": 0.60, "heart": 0.05, "kidney": 0.05},
        ["frequent_urination", "excessive_thirst", "blurred_vision",
         "tingling_hands_feet", "chest_pain", "palpitations"])
    assert adjusted["diabetes"] <= 0.60 + 0.15 + 1e-9
    assert math.isfinite(adjusted["diabetes"])
