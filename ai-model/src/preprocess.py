"""Dataset loading, cleaning, splitting, and preprocessing pipelines.

Two stages, deliberately separated to prevent data leakage:

1. Cleaning (``load_*``): deterministic, rule-based repair of known dataset
   quirks (sentinel zeros, stray tabs, wrong dtypes). Learns no statistics,
   so it may legitimately run before the train/test split.

2. Statistical preprocessing (``build_preprocessor``): imputation, scaling,
   and encoding wrapped in sklearn ``Pipeline``s. These MUST be fitted on the
   training split only (done in ``main()``); the fitted transformers are then
   reused to transform the test split and, later, live API traffic.

Split policy: stratified 80/20, ``random_state=42``, shuffled - identical
class ratios in train and test, fully reproducible.
"""

import json
import io
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.model_selection import train_test_split

AI_MODEL_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = AI_MODEL_DIR / "data" / "raw"
PROCESSED_DIR = AI_MODEL_DIR / "data" / "processed"
ARTIFACTS_DIR = AI_MODEL_DIR / "artifacts"

RANDOM_STATE = 42
TEST_SIZE = 0.20

PIMA_SENTINEL_ZERO_COLS = ["glucose", "bp", "skin_thickness", "insulin", "bmi"]

# Feature selection per disease. Chosen so every model input is either
# supplied by the patient (API fields in app/schemas.py) or an optional
# clinical/lab value a clinic can enter; anything else would be permanently
# imputed at inference and add noise rather than signal.
DIABETES_NUMERIC = ["pregnancies", "glucose", "bp", "skin_thickness",
                    "insulin", "bmi", "dpf", "age"]
HEART_NUMERIC = ["age", "trestbps", "chol", "thalach", "oldpeak"]
HEART_CATEGORICAL = ["sex", "cp", "fbs", "restecg", "exang", "slope", "ca", "thal"]
KIDNEY_NUMERIC = ["age", "bp", "sg", "al", "su", "bgr", "bu", "sc", "hemo"]
KIDNEY_CATEGORICAL = ["htn", "dm"]

FEATURE_SPECS = {
    "diabetes": {"numeric": DIABETES_NUMERIC, "categorical": [], "target": "outcome"},
    "heart": {"numeric": HEART_NUMERIC, "categorical": HEART_CATEGORICAL, "target": "target"},
    "kidney": {"numeric": KIDNEY_NUMERIC, "categorical": KIDNEY_CATEGORICAL, "target": "target"},
}


def load_diabetes() -> pd.DataFrame:
    """Pima Indians Diabetes. Sentinel zeros encode missing values."""
    cols = DIABETES_NUMERIC + ["outcome"]
    df = pd.read_csv(RAW_DIR / "pima_diabetes.csv", names=cols)
    # np.nan (not pd.NA) so columns stay float64 for sklearn imputers
    df[PIMA_SENTINEL_ZERO_COLS] = df[PIMA_SENTINEL_ZERO_COLS].replace(0, np.nan)
    df["target"] = df.pop("outcome")
    return df


def load_heart() -> pd.DataFrame:
    """UCI Cleveland heart. Multi-class severity collapsed to binary."""
    cols = HEART_NUMERIC + HEART_CATEGORICAL + ["num"]
    df = pd.read_csv(RAW_DIR / "cleveland_heart.csv", names=cols, na_values="?")
    df["target"] = (df.pop("num") > 0).astype(int)
    return df


def load_kidney() -> pd.DataFrame:
    """UCI chronic kidney disease (OpenML ARFF mirror of UCI id 336).

    Quirks repaired here: stray-tab labels ('ckd\\t'), string-typed numeric
    columns caused by '\\t?' values, and an irrelevant row id.
    """
    lines = (RAW_DIR / "chronic_kidney_disease.arff").read_text().splitlines()
    names = [ln.split()[1] for ln in lines if ln.lower().startswith("@attribute")]
    data_start = next(i for i, ln in enumerate(lines) if ln.strip().lower() == "@data")
    df = pd.read_csv(io.StringIO("\n".join(lines[data_start + 1:])),
                     names=names, na_values="?")

    df = df.drop(columns=["id"])
    obj_cols = df.select_dtypes(include="object").columns
    df[obj_cols] = df[obj_cols].apply(lambda s: s.astype(str).str.strip().str.lower())
    df["classification"] = df["classification"].replace({"ckd\t": "ckd"})
    for col in ("pcv", "wc", "rc"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["target"] = (df.pop("classification") == "ckd").astype(int)

    keep = KIDNEY_NUMERIC + KIDNEY_CATEGORICAL + ["target"]
    return df[keep]


def build_preprocessor(spec: dict) -> ColumnTransformer:
    """Stage-2 preprocessing; must be fitted on the TRAINING split only.

    Numeric: median imputation + standard scaling (keeps logistic regression
    well-conditioned; harmless for trees). Categorical: most-frequent
    imputation + one-hot encoding tolerant of unseen categories.
    """
    num = Pipeline([("impute", SimpleImputer(strategy="median")),
                    ("scale", StandardScaler())])
    cat = Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                    ("onehot", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer(
        [("num", num, spec["numeric"]), ("cat", cat, spec["categorical"])])


def validate_split(name: str, X_train, y_train, X_test, y_test, spec) -> dict:
    """Sanity checks + summary stats for one disease split."""
    assert not y_train.isna().any() and not y_test.isna().any(), f"{name}: NaN targets"
    assert list(X_train.columns) == list(X_test.columns), f"{name}: column mismatch"
    assert set(y_train.unique()) <= {0, 1} and set(y_test.unique()) <= {0, 1}, \
        f"{name}: non-binary target"

    return {
        "disease": name,
        "features": spec["numeric"] + spec["categorical"],
        "n_features": len(spec["numeric"]) + len(spec["categorical"]),
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "missing_cells_train": int(X_train.isna().sum().sum()),
        "missing_cells_test": int(X_test.isna().sum().sum()),
        "class_distribution_train": {int(k): int(v) for k, v in y_train.value_counts().sort_index().items()},
        "class_distribution_test": {int(k): int(v) for k, v in y_test.value_counts().sort_index().items()},
        "positive_rate_train": round(float(y_train.mean()), 4),
        "positive_rate_test": round(float(y_test.mean()), 4),
        "missing_per_feature_train": {
            col: int(n) for col, n in X_train[spec["numeric"] + spec["categorical"]].isna().sum().items() if n
        },
    }


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    loaders = {"diabetes": load_diabetes, "heart": load_heart, "kidney": load_kidney}
    summaries = []

    for name, loader in loaders.items():
        spec = FEATURE_SPECS[name]
        df = loader()
        X, y = df.drop(columns=["target"]), df["target"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y)

        summary = validate_split(name, X_train, y_train, X_test, y_test, spec)
        summaries.append(summary)

        pd.concat([X_train, y_train], axis=1).to_csv(PROCESSED_DIR / f"{name}_train.csv", index=False)
        pd.concat([X_test, y_test], axis=1).to_csv(PROCESSED_DIR / f"{name}_test.csv", index=False)

        preprocessor = build_preprocessor(spec)
        preprocessor.fit(X_train, y_train)  # TRAIN SPLIT ONLY - leakage prevention
        joblib.dump(preprocessor, ARTIFACTS_DIR / f"{name}_preprocessor.joblib")

        with open(PROCESSED_DIR / f"{name}_meta.json", "w") as fh:
            json.dump(summary, fh, indent=2)

        print(f"[{name}] train={summary['train_size']} test={summary['test_size']} "
              f"pos_rate={summary['positive_rate_train']}/{summary['positive_rate_test']} "
              f"missing(train)={summary['missing_cells_train']} "
              f"saved: {name}_train.csv, {name}_test.csv, {name}_preprocessor.joblib")

    with open(PROCESSED_DIR / "all_datasets_summary.json", "w") as fh:
        json.dump(summaries, fh, indent=2)


if __name__ == "__main__":
    main()
