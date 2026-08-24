"""Health risk assessment: banding, overall score, and risk areas.

Pure functions over model outputs + patient input; no I/O. Symptom boosts
are applied BEFORE banding so reported levels reflect both the statistical
model and the patient's reported symptoms.
"""

from app.rules_engine import apply_symptom_boosts, classify_band, load_rules, matched_symptom_clusters
from app.schemas import DiabetesRisk, DiseaseRisks, HeartRisk, KidneyRisk, OverallRisk, RiskLevel


def run_assessment(patient_symptoms: list[str],
                   model_probabilities: dict,
                   top_factors: dict) -> dict:
    """Produce banded disease risks, overall risk, and risk areas.

    ``model_probabilities``: {'diabetes': p, 'heart': p, 'kidney': p} raw
    model outputs in [0, 1]. ``top_factors``: per-disease contributing
    feature names for explainability.

    Overall score = sum(weights[disease] * adjusted_probability)
                    + weight_flags * (matched clusters / total clusters),
    clamped to [0, 1]. Assumes weights sum to ~1.0 (validated in rules.yaml).
    """
    rules = load_rules()
    adjusted, matched = apply_symptom_boosts(model_probabilities, patient_symptoms)

    risks = {
        "diabetes": DiabetesRisk(
            probability=round(adjusted["diabetes"], 4),
            level=classify_band(adjusted["diabetes"]),
            top_factors=top_factors.get("diabetes", []),
        ),
        "heart": HeartRisk(
            probability=round(adjusted["heart"], 4),
            level=classify_band(adjusted["heart"]),
            top_factors=top_factors.get("heart", []),
        ),
        "kidney": KidneyRisk(
            probability=round(adjusted["kidney"], 4),
            level=classify_band(adjusted["kidney"]),
            top_factors=top_factors.get("kidney", []),
        ),
    }

    weights = rules["overall_weights"]
    cluster_count = len(rules["symptom_clusters"])
    flag_score = len(matched_symptom_clusters(patient_symptoms)) / cluster_count if cluster_count else 0.0
    overall_score = min(
        weights["diabetes"] * adjusted["diabetes"]
        + weights["heart"] * adjusted["heart"]
        + weights["kidney"] * adjusted["kidney"]
        + weights["symptom_flags"] * flag_score,
        1.0,
    )

    # Dominant-risk floor: a plain weighted average can dilute one acute
    # risk (e.g., High cardiac) into a Low overall verdict, which would
    # understate danger. The overall LEVEL therefore never sits below the
    # strongest single-disease band; the SCORE keeps the raw weighted value.
    severity = {RiskLevel.LOW: 0, RiskLevel.MODERATE: 1, RiskLevel.HIGH: 2}
    banded = classify_band(overall_score)
    dominant = max((r.level for r in risks.values()), key=lambda lv: severity[lv])
    overall_level = dominant if severity[dominant] > severity[banded] else banded
    overall = OverallRisk(score=round(overall_score, 4), level=overall_level)

    return {
        "disease_risks": DiseaseRisks(**risks),
        "overall_risk": overall,
        "risk_areas": identify_risk_areas(patient_symptoms, risks),
        "adjusted_probabilities": adjusted,
    }


def identify_risk_areas(symptoms: list[str], risks: dict) -> list[str]:
    """Disease areas above Low + symptom-only routes (e.g., dermatological)."""
    rules = load_rules()
    areas = []
    for disease, risk in risks.items():
        if risk.level != "Low" and risk.probability >= rules["risk_bands"]["low_max"]:
            area = rules["disease_rules"][disease]["risk_area"]
            if area not in areas:
                areas.append(area)
    for route in rules.get("symptom_only_routes", {}).values():
        if any(s in route["symptoms"] for s in symptoms):
            if route["risk_area"] not in areas:
                areas.append(route["risk_area"])
    return areas
