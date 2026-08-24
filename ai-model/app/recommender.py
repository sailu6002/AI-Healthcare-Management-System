"""Rule-based medical test and specialist-category recommendations.

Consumes banded disease risks and reported symptoms; returns deduplicated,
priority-ordered recommendations. Specialists are CATEGORIES only - mapping
categories to concrete doctors is the backend's responsibility.
"""

from app.rules_engine import load_rules, matched_symptom_clusters
from app.schemas import RiskLevel


def recommend(disease_risks, symptoms: list[str]) -> tuple[list[str], list[str]]:
    """Return (recommended_tests, recommended_specialists).

    ``disease_risks``: DiseaseRisks instance from assessment.py.
    """
    rules = load_rules()
    tests: list[str] = []
    specialists: list[str] = []

    for disease, risk in disease_risks.model_dump().items():
        if risk["level"] == "Low":
            continue
        rule = rules["disease_rules"][disease]
        band = risk["level"] if risk["level"] == "High" else "Moderate"
        for t in rule["tests_by_band"].get(band, []):
            if t not in tests:
                tests.append(t)
        specialist = rule["specialist_high" if band == "High" else "specialist_moderate"]
        if specialist not in specialists:
            specialists.append(specialist)

    # Symptom-only routes apply regardless of model output (e.g., skin).
    clusters = matched_symptom_clusters(symptoms)
    for name, route in rules.get("symptom_only_routes", {}).items():
        if name in clusters:
            specialists.append(route["specialist"])

    if not tests:
        tests = list(rules["fallback"]["tests"])
    if not specialists:
        specialists = [rules["fallback"]["specialist"]]

    order = {s: i for i, s in enumerate(rules["specialist_priority_order"])}
    specialists = sorted(set(specialists), key=lambda s: order.get(s, len(order)))

    return tests, specialists
