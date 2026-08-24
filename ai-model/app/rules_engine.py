"""Rule configuration loading and shared banding / symptom-boost logic.

All clinical tunables live in config/rules.yaml; this module only applies
them. ``load_rules`` is cached - edit rules.yaml and restart the service to
apply changes.
"""

from functools import lru_cache
from pathlib import Path

import yaml

from app.schemas import RiskLevel

RULES_PATH = Path(__file__).resolve().parent.parent / "config" / "rules.yaml"


@lru_cache(maxsize=1)
def load_rules() -> dict:
    with open(RULES_PATH) as fh:
        return yaml.safe_load(fh)


def classify_band(probability: float) -> RiskLevel:
    """Map a probability to Low/Moderate/High using configured thresholds."""
    bands = load_rules()["risk_bands"]
    if probability < bands["low_max"]:
        return RiskLevel.LOW
    if probability < bands["moderate_max"]:
        return RiskLevel.MODERATE
    return RiskLevel.HIGH


def apply_symptom_boosts(probabilities: dict, symptoms: list[str]) -> tuple[dict, list[str]]:
    """Adjust disease probabilities upward for matched symptom clusters.

    Boosts are additive per cluster but each disease's total boost is capped
    at ``max_symptom_boost``. Returns (adjusted probabilities, matched
    symptom names). Unknown symptom strings are ignored.
    """
    rules = load_rules()
    known: set[str] = set()
    boosts = dict.fromkeys(probabilities, 0.0)

    for cluster in rules["symptom_clusters"].values():
        matched = [s for s in symptoms if s in cluster["symptoms"]]
        if not matched:
            continue
        known.update(matched)
        for disease in cluster["diseases"]:
            if disease in boosts:
                boosts[disease] += cluster["boost"]

    # Each disease's accumulated boost is capped; result stays within [0, 1].
    cap = rules["max_symptom_boost"]
    adjusted = {d: min(p + min(boosts.get(d, 0.0), cap), 1.0)
                for d, p in probabilities.items()}
    return adjusted, sorted(known)


def matched_symptom_clusters(symptoms: list[str]) -> list[str]:
    """Names of clusters containing at least one reported symptom."""
    rules = load_rules()
    names = []
    for name, cluster in rules["symptom_clusters"].items():
        if any(s in cluster["symptoms"] for s in symptoms):
            names.append(name)
    for name, route in rules.get("symptom_only_routes", {}).items():
        if any(s in route["symptoms"] for s in symptoms):
            names.append(name)
    return names
