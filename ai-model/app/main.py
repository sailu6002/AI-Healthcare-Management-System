"""FastAPI entrypoint for the AI health risk assessment service.

Loads the three trained disease pipelines at startup (fail-fast if
artifacts are missing - run ``python -m src.train`` first), then serves
full assessments: model probabilities -> rules engine -> tests/specialists.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.assessment import run_assessment
from app.predictor import RiskPredictor
from app.recommender import recommend
from app.schemas import DISCLAIMER, AssessmentRequest, AssessmentResponse

predictor: RiskPredictor


@asynccontextmanager
async def lifespan(application: FastAPI):
    global predictor
    predictor = RiskPredictor()
    application.state.models_loaded = True
    yield


app = FastAPI(
    title="AI Health Risk Assessment Service",
    description=(
        "Screening-level risk assessments for diabetes, heart disease, and "
        "kidney disease, with test and specialist-category recommendations. "
        "Outputs are risk assessments, not medical diagnoses."
    ),
    version="0.2.0",
    lifespan=lifespan,
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "ai-model",
        "models_loaded": getattr(app.state, "models_loaded", False),
    }


@app.post("/api/v1/assess", response_model=AssessmentResponse)
def assess(request: AssessmentRequest) -> AssessmentResponse:
    patient = request.patient
    prediction = predictor.predict(patient)

    result = run_assessment(
        patient_symptoms=patient.symptoms,
        model_probabilities=prediction["probabilities"],
        top_factors=prediction["top_factors"],
    )
    tests, specialists = recommend(result["disease_risks"], patient.symptoms)

    return AssessmentResponse(
        overall_risk=result["overall_risk"],
        disease_risks=result["disease_risks"],
        risk_areas=result["risk_areas"],
        recommended_tests=tests,
        recommended_specialists=specialists,
        features_imputed=prediction["features_imputed"],
        disclaimer=DISCLAIMER,
    )
