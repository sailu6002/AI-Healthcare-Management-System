"""Model inference: loads trained pipelines and maps API input to features.

The saved pipelines (see src/train.py) consume RAW feature rows - imputation,
scaling, and encoding happen inside them. This module therefore only
translates ``PatientHealthProfile`` fields into each model's expected feature
names, records which values had to be imputed, and extracts static
per-model "top factors" for explainability.

Model assumptions documented here:
- Male patients report 0 pregnancies (biological default).
- gender Other is not representable in the heart dataset -> left for
  categorical imputation.
- BMI is computed from height/weight when not supplied directly.
- smoker/lifestyle flags are used by the rules layer, not by the models
  (the training datasets contain no matching columns) - intentional.
"""

import joblib
import numpy as np
import pandas as pd

from app.schemas import PatientHealthProfile
from src.preprocess import ARTIFACTS_DIR

DISEASES = ("diabetes", "heart", "kidney")


def _bmi(patient: PatientHealthProfile):
    if patient.bmi is not None:
        return patient.bmi
    if patient.height_cm and patient.weight_kg:
        return round(patient.weight_kg / (patient.height_cm / 100) ** 2, 1)
    return None


def diabetes_features(p: PatientHealthProfile) -> dict:
    return {
        "pregnancies": 0 if p.gender == "Male" else p.pregnancies,
        "glucose": p.fasting_glucose,
        "bp": p.diastolic_bp,
        "skin_thickness": None,
        "insulin": None,
        "bmi": _bmi(p),
        "dpf": None,
        "age": float(p.age),
    }


def heart_features(p: PatientHealthProfile) -> dict:
    return {
        "age": float(p.age),
        "sex": {"Male": 1, "Female": 0}.get(str(p.gender.value)),
        "cp": p.chest_pain_type,
        "trestbps": p.systolic_bp,
        "chol": p.cholesterol,
        "fbs": None if p.fasting_glucose is None else int(p.fasting_glucose > 120),
        "restecg": None,
        "thalach": p.max_heart_rate,
        "exang": None if p.exercise_angina is None else int(p.exercise_angina),
        "oldpeak": p.st_depression,
        "slope": None,
        "ca": None,
        "thal": None,
    }


def kidney_features(p: PatientHealthProfile) -> dict:
    return {
        "age": float(p.age),
        "bp": p.diastolic_bp,
        "sg": p.urine_specific_gravity,
        "al": p.urine_albumin,
        "su": p.urine_sugar,
        "bgr": p.fasting_glucose,
        "bu": p.blood_urea,
        "sc": p.serum_creatinine,
        "hemo": p.hemoglobin,
        "htn": None if p.hypertension is None else str(p.hypertension).lower(),
        "dm": None if p.has_diabetes is None else str(p.has_diabetes).lower(),
    }


MAPPERS = {"diabetes": diabetes_features, "heart": heart_features, "kidney": kidney_features}

# Model-internal feature names -> API field names, so reported "top factors"
# use the same vocabulary as the request payload.
API_NAMES = {
    "sex": "gender", "cp": "chest_pain_type", "trestbps": "systolic_bp",
    "chol": "cholesterol", "fbs": "fasting_glucose", "thalach": "max_heart_rate",
    "exang": "exercise_angina", "oldpeak": "st_depression",
    "bp": "diastolic_bp", "bgr": "fasting_glucose", "bu": "blood_urea",
    "sc": "serum_creatinine", "hemo": "hemoglobin",
    "sg": "urine_specific_gravity", "al": "urine_albumin", "su": "urine_sugar",
    "htn": "hypertension", "dm": "has_diabetes",
    "dpf": "family_history_diabetes",
}


def _to_frame(row: dict) -> pd.DataFrame:
    """Build a one-row frame whose dtypes match training data.

    Columns that are entirely None would arrive as object dtype, which makes
    sklearn treat ``None`` as a category instead of missing - silently
    bypassing imputation (verified to distort probabilities severely). All-
    missing columns are therefore forced to float64 NaN, mirroring read_csv.
    """
    frame = pd.DataFrame([row])
    for col in frame.columns[frame.isna().all()]:
        frame[col] = np.nan
    return frame


class RiskPredictor:
    """Loads the three disease pipelines once and produces raw probabilities."""

    def __init__(self):
        self.models = {d: joblib.load(ARTIFACTS_DIR / f"{d}_model.joblib") for d in DISEASES}
        self._global_ranking = {d: self._extract_top_factors(self.models[d]) for d in DISEASES}

    @staticmethod
    def _extract_top_factors(pipeline, k=3) -> list[str]:
        """Rank ORIGINAL input features by aggregated importance.

        Random Forest exposes feature_importances_, Logistic Regression the
        absolute coefficients; one-hot columns are folded back onto their
        source feature so factor names match what a patient/doctor sees.
        """
        pre = pipeline.named_steps["preprocessor"]
        model = pipeline.named_steps["model"]
        out_names = [n.split("__", 1)[1] for n in pre.get_feature_names_out()]

        scores = model.feature_importances_ if hasattr(model, "feature_importances_") else np.abs(model.coef_[0])

        agg: dict[str, float] = {}
        for name, score in zip(out_names, scores):
            # fold one-hot variants (e.g. 'cp_2') back to their source column
            src = next((c for c in pre.feature_names_in_ if name == c or name.startswith(f"{c}_")), name)
            agg[src] = agg.get(src, 0.0) + float(score)

        ranked = sorted(agg.items(), key=lambda kv: kv[1], reverse=True)[:k]
        return [name for name, _ in ranked]

    def _top_factors_for(self, disease: str, provided: set) -> list[str]:
        """Global importance ranking restricted to features THIS patient
        actually supplied - listing imputed values as drivers of a risk
        score would be misleading."""
        factors = [f for f in self._global_ranking[disease] if f in provided]
        return [API_NAMES.get(f, f) for f in factors]

    def predict(self, patient: PatientHealthProfile) -> dict:
        probabilities: dict[str, float] = {}
        top_factors: dict[str, list[str]] = {}
        imputed: set[str] = set()

        for disease, mapper in MAPPERS.items():
            row = mapper(patient)
            provided = {k for k, v in row.items() if v is not None}
            imputed.update(set(row) - provided)
            probabilities[disease] = float(
                self.models[disease].predict_proba(_to_frame(row))[0][1])
            top_factors[disease] = self._top_factors_for(disease, provided)

        return {
            "probabilities": probabilities,
            "top_factors": top_factors,
            "features_imputed": sorted(API_NAMES.get(f, f) for f in imputed),
        }
