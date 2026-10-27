import { apiRequest } from "./client";

// Maps the Assistant form state to the exact schema expected by the backend
// (AiAssessmentRequest) and the FastAPI service (PatientHealthProfile).
//
// Only non-empty optional values are sent; omitted values are imputed by the
// AI model and reported back in `features_imputed`.

function numOrUndefined(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildPatientProfile(form) {
  const profile = {
    age: Number.parseInt(form.age, 10),
    gender: form.gender,
    smoker: form.smoker === "yes",
    hypertension: form.hypertension === "yes",
  };

  const optionalNumerics = {
    height_cm: form.heightCm,
    weight_kg: form.weightKg,
    systolic_bp: form.systolicBp,
    diastolic_bp: form.diastolicBp,
    fasting_glucose: form.fastingGlucose,
  };

  Object.entries(optionalNumerics).forEach(([key, raw]) => {
    const value = numOrUndefined(raw);
    if (value !== undefined) {
      profile[key] = value;
    }
  });

  const symptoms = (form.symptoms || "")
    .split(",")
    .map((symptom) => symptom.trim())
    .filter(Boolean);

  if (symptoms.length > 0) {
    profile.symptoms = symptoms;
  }

  return profile;
}

export function assessPatient(form, token) {
  return apiRequest("/api/ai/assess", {
    method: "POST",
    body: { patient: buildPatientProfile(form) },
    token,
  });
}
