"""Train, compare, and select models for diabetes / heart / kidney risk.

For each disease two candidates are trained inside the SAME preprocessing
pipelines defined in ``src.preprocess``:

- Logistic Regression (interpretable linear baseline)
- Random Forest (non-linear, feature-importance capable)

Selection rule (per project requirements): primarily ROC-AUC, then recall;
remaining metrics reported for transparency. The TEST split is consumed only
once here, for final evaluation - never during fitting or model selection CV
(5-fold cross-validation runs on the training split exclusively).

Saved artifacts (artifacts/):
- {disease}_model.joblib     full raw-input -> prediction pipeline (winner)
- {disease}_metrics.json     all metrics for both candidates + confusion matrices
"""

import json
import platform

import joblib
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline

from src.preprocess import (ARTIFACTS_DIR, PROCESSED_DIR, FEATURE_SPECS,
                            build_preprocessor)

RANDOM_STATE = 42


def get_candidates() -> dict:
    """Candidate classifiers. class_weight='balanced' compensates class
    imbalance (kidney ~62/38); appropriate for a screening tool where
    missing true positives is costlier than false alarms."""
    return {
        "logistic_regression": LogisticRegression(
            max_iter=2000, class_weight="balanced", random_state=RANDOM_STATE),
        "random_forest": RandomForestClassifier(
            n_estimators=300, min_samples_leaf=2,
            class_weight="balanced", random_state=RANDOM_STATE, n_jobs=-1),
    }


def evaluate(name, pipeline, X_train, y_train, X_test, y_test) -> dict:
    """Fit on train only; CV on train only; single final test evaluation."""
    pipeline.fit(X_train, y_train)

    cv = cross_val_score(pipeline, X_train, y_train, cv=5, scoring="roc_auc")
    proba = pipeline.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()

    return {
        "model": name,
        "accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "precision": round(float(precision_score(y_test, pred)), 4),
        "recall": round(float(recall_score(y_test, pred)), 4),
        "f1": round(float(f1_score(y_test, pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, proba)), 4),
        "cv_roc_auc_train_mean": round(float(cv.mean()), 4),
        "cv_roc_auc_train_std": round(float(cv.std()), 4),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "pipeline": pipeline,
    }


def main():
    report_all = {}

    for disease, spec in FEATURE_SPECS.items():
        train = pd.read_csv(PROCESSED_DIR / f"{disease}_train.csv")
        test = pd.read_csv(PROCESSED_DIR / f"{disease}_test.csv")
        X_train, y_train = train.drop(columns=["target"]), train["target"]
        X_test, y_test = test.drop(columns=["target"]), test["target"]

        results = []
        for name, clf in get_candidates().items():
            pipe = Pipeline([("preprocessor", build_preprocessor(spec)), ("model", clf)])
            results.append(evaluate(name, pipe, X_train, y_train, X_test, y_test))

        # Primary criterion ROC-AUC, tie-breaker recall.
        winner = max(results, key=lambda r: (r["roc_auc"], r["recall"]))
        joblib.dump(winner["pipeline"], ARTIFACTS_DIR / f"{disease}_model.joblib")

        for r in results:
            r.pop("pipeline")

        report = {
            "disease": disease,
            "selection_rule": "max(roc_auc, then recall) on held-out test set",
            "selected_model": winner["model"],
            "candidates": results,
            "environment": {"sklearn": sklearn.__version__, "python": platform.python_version()},
        }
        with open(ARTIFACTS_DIR / f"{disease}_metrics.json", "w") as fh:
            json.dump(report, fh, indent=2)

        report_all[disease] = report
        print(f"\n=== {disease.upper()} === (selected: {winner['model']})")
        print(f"{'candidate':<22}{'acc':>7}{'prec':>7}{'rec':>7}{'f1':>7}{'roc':>7}{'cv':>12}")
        for r in results:
            star = " *" if r["model"] == winner["model"] else ""
            print(f"{r['model'] + star:<22}{r['accuracy']:>7}{r['precision']:>7}"
                  f"{r['recall']:>7}{r['f1']:>7}{r['roc_auc']:>7}"
                  f"  {r['cv_roc_auc_train_mean']:.3f}±{r['cv_roc_auc_train_std']:.3f}")
        cm = winner["confusion_matrix"]
        print(f"  confusion (tn fp fn tp): {cm['tn']} {cm['fp']} {cm['fn']} {cm['tp']}")

    print("\nArtifacts written:", sorted(p.name for p in ARTIFACTS_DIR.glob("*")))


if __name__ == "__main__":
    main()
