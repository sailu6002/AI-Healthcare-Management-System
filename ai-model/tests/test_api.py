"""Integration tests for the assessment API (app/main.py)."""

FULL_PATIENT = {
    "age": 55,
    "gender": "Male",
    "height_cm": 170,
    "weight_kg": 95,
    "systolic_bp": 150,
    "diastolic_bp": 95,
    "fasting_glucose": 190,
    "serum_creatinine": 2.1,
    "blood_urea": 60,
    "hemoglobin": 10.5,
    "hypertension": True,
    "has_diabetes": True,
    "smoker": True,
    "symptoms": ["frequent_urination", "excessive_thirst"],
}


def test_health_reports_loaded_models(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    assert body["models_loaded"] is True


def test_full_assessment_contract(client):
    response = client.post("/api/v1/assess",
                           json={"patient": FULL_PATIENT})
    assert response.status_code == 200
    body = response.json()

    assert set(body) == {"overall_risk", "disease_risks", "risk_areas",
                         "recommended_tests", "recommended_specialists",
                         "features_imputed", "disclaimer"}
    for disease in ("diabetes", "heart", "kidney"):
        risk = body["disease_risks"][disease]
        assert 0.0 <= risk["probability"] <= 1.0
        assert risk["level"] in ("Low", "Moderate", "High")
    assert body["overall_risk"]["level"] in ("Low", "Moderate", "High")
    assert body["disclaimer"].startswith("This is a screening-level")


def test_high_risk_patient_gets_tests_and_specialists(client):
    body = client.post("/api/v1/assess",
                       json={"patient": FULL_PATIENT}).json()

    high_bands = [d for d, r in body["disease_risks"].items()
                  if r["level"] in ("Moderate", "High")]
    if high_bands:
        assert body["recommended_tests"]
        assert body["recommended_specialists"]
        assert "General Physician" not in body["recommended_specialists"][:1]


def test_cardiac_profile_recommends_cardiologist(client):
    body = client.post("/api/v1/assess", json={"patient": {
        **FULL_PATIENT, "chest_pain_type": 4, "exercise_angina": True,
        "st_depression": 2.5, "cholesterol": 280,
        "symptoms": ["chest_pain", "shortness_of_breath"]}}).json()
    assert "Cardiologist" in body["recommended_specialists"]


def test_skin_symptoms_route_to_dermatologist(client):
    body = client.post("/api/v1/assess", json={"patient": {
        "age": 30, "gender": "Female", "symptoms": ["rash", "itching"]}}).json()
    assert "Dermatologist" in body["recommended_specialists"]
    assert "dermatological" in body["risk_areas"]


def test_minimal_payload_uses_fallbacks(client):
    body = client.post("/api/v1/assess",
                       json={"patient": {"age": 22, "gender": "Female"}}).json()
    assert isinstance(body["recommended_tests"], list)
    assert isinstance(body["features_imputed"], list)


def test_invalid_age_rejected(client):
    assert client.post("/api/v1/assess",
                       json={"patient": {"age": 500, "gender": "Female"}}
                       ).status_code == 422


def test_missing_age_rejected(client):
    assert client.post("/api/v1/assess",
                       json={"patient": {"gender": "Female"}}
                       ).status_code == 422
