"""FastAPI entrypoint for the AI health risk assessment service.

Phase 2 (current): /api/v1/assess returns a mocked response so the backend
team can integrate against the final contract before model training lands.
Models are wired in during the integration phase; until then ``models_loaded``
is False in /health.
"""

from fastapi import FastAPI

from app.schemas import (
    DISCLAIMER,
    AssessmentRequest,
    AssessmentResponse,
    DiabetesRisk,
    DiseaseRisks,
    HeartRisk,
    KidneyRisk,
    OverallRisk,
    RiskLevel,
)

app = FastAPI(
    title="AI Health Risk Assessment Service",
    description=(
        "Screening-level risk assessments for diabetes, heart disease, and "
        "kidney disease, with test and specialist-category recommendations. "
        "Outputs are risk assessments, not medical diagnoses."
    ),
    version="0.1.0",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ai-model", "models_loaded": False}


@app.post("/api/v1/assess", response_model=AssessmentResponse)
def assess(request: AssessmentRequest) -> AssessmentResponse:
    """Return the full assessment for one patient.

    Mocked with deterministic sample values until trained artifacts are
    integrated (integration phase).
    """
    patient = request.patient
    _ = patient  # consumed by predictor.py once models are loaded

    return AssessmentResponse(
        overall_risk=OverallRisk(score=0.42, level=RiskLevel.MODERATE),
        disease_risks=DiseaseRisks(
            diabetes=DiabetesRisk(
                probability=0.55, level=RiskLevel.MODERATE,
                top_factors=["fasting_glucose", "BMI"],
            ),
            heart=HeartRisk(
                probability=0.28, level=RiskLevel.LOW,
                top_factors=["age"],
            ),
            kidney=KidneyRisk(
                probability=0.15, level=RiskLevel.LOW,
                top_factors=["blood_pressure"],
            ),
        ),
        risk_areas=["metabolic"],
        recommended_tests=["Fasting Blood Sugar", "HbA1c"],
        recommended_specialists=["General Physician"],
        features_imputed=[],
        disclaimer=DISCLAIMER,
    )
