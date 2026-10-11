import { useState } from "react";
import { assessPatient } from "../api/ai";
import { listDoctors } from "../api/doctors";
import { matchDoctorsBySpecialties } from "../api/specialtyMatch";

const INITIAL_FORM = {
  age: "",
  gender: "",
  heightCm: "",
  weightKg: "",
  systolicBp: "",
  diastolicBp: "",
  fastingGlucose: "",
  symptoms: "",
  smoker: "no",
  hypertension: "no",
};

const NUMERIC_FIELDS = [
  { name: "heightCm", label: "Height (cm)", min: 30, max: 260 },
  { name: "weightKg", label: "Weight (kg)", min: 1, max: 400 },
  { name: "systolicBp", label: "Systolic BP (mmHg)", min: 50, max: 300 },
  { name: "diastolicBp", label: "Diastolic BP (mmHg)", min: 30, max: 200 },
  { name: "fastingGlucose", label: "Fasting Glucose (mg/dL)", min: 20, max: 700 },
];

const DISEASE_LABELS = {
  diabetes: "Diabetes",
  heart: "Heart Disease",
  kidney: "Kidney Disease",
};

const LEVEL_STYLES = {
  Low: { color: "#166534", background: "#f0fdf4", border: "#bbf7d0" },
  Moderate: { color: "#92400e", background: "#fffbeb", border: "#fde68a" },
  High: { color: "#991b1b", background: "#fef2f2", border: "#fecaca" },
};

const FALLBACK_LEVEL_STYLE = {
  color: "#374151",
  background: "#f3f4f6",
  border: "#e5e7eb",
};

function percent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function LevelBadge({ level }) {
  const style = LEVEL_STYLES[level] || FALLBACK_LEVEL_STYLE;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        color: style.color,
        background: style.background,
        border: `1px solid ${style.border}`,
      }}
    >
      {level || "Unknown"}
    </span>
  );
}

function ResultList({ title, items, emptyText }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>{title}</h3>
      {items && items.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px" }}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          {emptyText}
        </p>
      )}
    </div>
  );
}

function RecommendedDoctors({ doctorsState, onRetry, onBook }) {
  const { status, matches, unmatched, message } = doctorsState;

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>Matching Doctors</h3>

      {status === "loading" && (
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          Looking for doctors matching the recommended specialties…
        </p>
      )}

      {status === "error" && (
        <div>
          <p style={{ fontSize: "14px", color: "#b91c1c", marginTop: 0 }}>
            {message}
          </p>
          <button type="button" className="back-button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          {matches.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {matches.map((doctor) => (
                <div
                  key={doctor.doctorId}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{doctor.fullName}</div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {doctor.specialization}
                  </div>

                  {doctor.experience != null && (
                    <div style={{ fontSize: "13px", marginTop: "6px" }}>
                      ⭐ {doctor.experience} years experience
                    </div>
                  )}
                  {doctor.address && (
                    <div style={{ fontSize: "13px" }}>🏥 {doctor.address}</div>
                  )}
                  {doctor.phone && (
                    <div style={{ fontSize: "13px" }}>📞 {doctor.phone}</div>
                  )}
                  {doctor.email && (
                    <div style={{ fontSize: "13px" }}>✉️ {doctor.email}</div>
                  )}

                  <button
                    type="button"
                    className="doctor-book-button"
                    style={{ marginTop: "12px" }}
                    onClick={() => onBook(doctor)}
                  >
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
              No doctors are currently registered for the recommended
              specialties.
            </p>
          )}

          {unmatched.length > 0 && (
            <p
              style={{
                fontSize: "13px",
                color: "#92400e",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "10px 12px",
                marginTop: "12px",
              }}
            >
              No doctors are currently registered for:{" "}
              <strong>{unmatched.join(", ")}</strong>. A General Physician is a
              good starting point.
            </p>
          )}

          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
            Doctors are from the hospital register. Real availability and
            booking are available on the Appointments page.
          </p>
        </>
      )}
    </div>
  );
}

function AssessmentResults({ result, doctorsState, onRetryDoctors, onBookDoctor }) {
  const diseaseRisks = result.disease_risks || {};

  return (
    <section className="appointment-form-card" style={{ marginTop: "24px" }}>
      <h2>AI Screening Results</h2>

      <p className="form-description">
        These are screening-level risk indications from an AI model, not a
        medical diagnosis. Discuss any concerns with a qualified clinician.
      </p>

      {/* Overall risk */}
      {result.overall_risk && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              Overall health-risk score
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700 }}>
              {percent(result.overall_risk.score)}
            </div>
          </div>
          <LevelBadge level={result.overall_risk.level} />
        </div>
      )}

      {/* Per-disease cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {Object.entries(DISEASE_LABELS).map(([key, label]) => {
          const risk = diseaseRisks[key];
          if (!risk) {
            return null;
          }

          return (
            <div
              key={key}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280" }}>{label}</div>
              <div style={{ fontSize: "22px", fontWeight: 700, margin: "4px 0" }}>
                {percent(risk.probability)}
              </div>
              <LevelBadge level={risk.level} />

              {risk.top_factors && risk.top_factors.length > 0 && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
                  Top factors: {risk.top_factors.join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ResultList
        title="Risk Areas"
        items={result.risk_areas}
        emptyText="No specific risk areas were highlighted."
      />

      <ResultList
        title="Recommended Specialists"
        items={result.recommended_specialists}
        emptyText="No specialist referral suggested at this time. A General Physician is a good starting point."
      />

      <RecommendedDoctors
        doctorsState={doctorsState}
        onRetry={onRetryDoctors}
        onBook={onBookDoctor}
      />

      <ResultList
        title="Suggested Tests to Discuss with a Clinician"
        items={result.recommended_tests}
        emptyText="No additional tests suggested based on the information provided."
      />

      {result.features_imputed && result.features_imputed.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>
            Estimated (Imputed) Values
          </h3>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: 0 }}>
            You did not provide these measurements, so the model used typical
            population values. Providing them would make the screening more
            accurate.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {result.features_imputed.map((feature) => (
              <span
                key={feature}
                style={{
                  fontSize: "12px",
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "999px",
                  padding: "2px 10px",
                }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.disclaimer && (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            borderRadius: "8px",
            padding: "12px 16px",
            marginTop: "20px",
            fontSize: "13px",
          }}
        >
          {result.disclaimer}
        </div>
      )}
    </section>
  );
}

function Assistant({ onNavigate, token }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [doctorsState, setDoctorsState] = useState({
    status: "idle",
    matches: [],
    unmatched: [],
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
    setError("");
  };

  const validate = () => {
    const nextErrors = {};

    const age = Number(form.age);
    if (!form.age.trim()) {
      nextErrors.age = "Age is required.";
    } else if (!Number.isInteger(age) || age < 1 || age > 120) {
      nextErrors.age = "Enter a valid whole-number age between 1 and 120.";
    }

    if (!form.gender) {
      nextErrors.gender = "Please select a gender.";
    }

    NUMERIC_FIELDS.forEach(({ name, label, min, max }) => {
      const raw = form[name].trim();
      if (!raw) {
        return;
      }

      const value = Number(raw);
      if (!Number.isFinite(value) || value < min || value > max) {
        nextErrors[name] = `${label} must be between ${min} and ${max}.`;
      }
    });

    return nextErrors;
  };

  const loadMatchingDoctors = async (specialties) => {
    setDoctorsState({ status: "loading", matches: [], unmatched: [], message: "" });

    try {
      const allDoctors = await listDoctors(token);
      const { matches, unmatched } = matchDoctorsBySpecialties(
        allDoctors,
        specialties
      );
      setDoctorsState({ status: "ready", matches, unmatched, message: "" });
    } catch (requestError) {
      setDoctorsState({
        status: "error",
        matches: [],
        unmatched: [],
        message:
          requestError.message ||
          "Unable to load doctors. Please try again.",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("");
      return;
    }

    if (!token) {
      setError("You are not signed in. Please log in to run an assessment.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const data = await assessPatient(form, token);
      setResult(data);
      void loadMatchingDoctors(data.recommended_specialists || []);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError.message ||
          "The AI assessment could not be completed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setError("");
    setResult(null);
    setDoctorsState({ status: "idle", matches: [], unmatched: [], message: "" });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="page-container">

      {/* Page Header */}
      <div className="page-header">

        <div>
          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>AI Assistant</h1>

          <p>
            Enter your health information and symptoms for an AI-assisted
            risk screening.
          </p>
        </div>

      </div>


      {/* Safety Notice */}
      <div
        style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          color: "#9a3412",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "20px",
          fontSize: "14px",
        }}
      >
        This tool provides screening-level risk indications only. It is not a
        medical diagnosis and does not replace a qualified healthcare
        professional.
      </div>


      {/* Health Information Form */}
      <section className="appointment-form-card">

        <h2>Patient Health Information</h2>

        <p className="form-description">
          Fields marked * are required. All clinical measurements are optional.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="appointment-form">

            {/* Age */}
            <div className="form-group">
              <label>Age *</label>

              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="e.g. 45"
                min="1"
                max="120"
                step="1"
                disabled={isSubmitting}
              />

              {errors.age && (
                <small style={{ color: "#dc2626", marginTop: "6px" }}>
                  {errors.age}
                </small>
              )}
            </div>


            {/* Gender */}
            <div className="form-group">
              <label>Gender *</label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              {errors.gender && (
                <small style={{ color: "#dc2626", marginTop: "6px" }}>
                  {errors.gender}
                </small>
              )}
            </div>


            {/* Optional clinical measurements */}
            {NUMERIC_FIELDS.map(({ name, label }) => (
              <div className="form-group" key={name}>
                <label>{label}</label>

                <input
                  type="number"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder="Optional"
                  disabled={isSubmitting}
                />

                {errors[name] && (
                  <small style={{ color: "#dc2626", marginTop: "6px" }}>
                    {errors[name]}
                  </small>
                )}
              </div>
            ))}


            {/* Symptoms */}
            <div className="form-group">
              <label>Symptoms</label>

              <input
                type="text"
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                placeholder="e.g. frequent_urination, chest_pain"
                disabled={isSubmitting}
              />

              <small style={{ color: "#6b7280", marginTop: "6px" }}>
                Separate multiple symptoms with commas (optional).
              </small>
            </div>


            {/* Smoker */}
            <div className="form-group">
              <label>Smoker</label>

              <select
                name="smoker"
                value={form.smoker}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>


            {/* Hypertension */}
            <div className="form-group">
              <label>Hypertension</label>

              <select
                name="hypertension"
                value={form.hypertension}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

          </div>


          {/* Error summary */}
          {hasErrors && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "8px",
                padding: "12px 16px",
                marginTop: "20px",
                fontSize: "14px",
              }}
            >
              Please correct the highlighted fields before continuing.
            </div>
          )}


          {/* Request error (network, timeout, auth, service unavailable) */}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "8px",
                padding: "12px 16px",
                marginTop: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}


          <button
            type="submit"
            className="primary-button book-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Running assessment..." : "Run AI Assessment"}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={handleReset}
            disabled={isSubmitting}
            style={{ marginLeft: "12px" }}
          >
            Reset
          </button>

        </form>

      </section>


      {/* Results */}
      {result && (
        <AssessmentResults
          result={result}
          doctorsState={doctorsState}
          onRetryDoctors={() =>
            loadMatchingDoctors(result.recommended_specialists || [])
          }
          onBookDoctor={(doctor) =>
            onNavigate("appointments", { doctorId: doctor.doctorId })
          }
        />
      )}

    </div>
  );
}

export default Assistant;
