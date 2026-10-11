import { useEffect, useState } from "react";
import {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
} from "../api/patients";

const EMPTY = {
  fullName: "",
  age: "",
  gender: "",
  phone: "",
  email: "",
  bloodGroup: "",
  address: "",
};

function Profile({ token, onNavigate }) {
  const [mode, setMode] = useState("loading");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const profile = await getMyProfile(token);
        if (cancelled) {
          return;
        }
        setForm({
          fullName: profile.fullName || "",
          age: profile.age != null ? String(profile.age) : "",
          gender: profile.gender || "",
          phone: profile.phone || "",
          email: profile.email || "",
          bloodGroup: profile.bloodGroup || "",
          address: profile.address || "",
        });
        setMode("edit");
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        if (
          requestError.code === "profile_required" ||
          requestError.status === 409
        ) {
          setMode("create");
        } else {
          setMode("error");
          setError(
            requestError.message || "Unable to load your profile. Try again."
          );
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
    setError("");
    setNotice("");
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) {
      next.fullName = "Full name is required.";
    }
    const age = Number(form.age);
    if (!form.age.toString().trim()) {
      next.age = "Age is required.";
    } else if (!Number.isInteger(age) || age < 1 || age > 120) {
      next.age = "Enter a whole-number age between 1 and 120.";
    }
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      age: Number.parseInt(form.age, 10),
      gender: form.gender || null,
      phone: form.phone || null,
      email: form.email || null,
      bloodGroup: form.bloodGroup || null,
      address: form.address || null,
    };

    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      const saved =
        mode === "create"
          ? await createMyProfile(payload, token)
          : await updateMyProfile(payload, token);

      setForm({
        fullName: saved.fullName || "",
        age: saved.age != null ? String(saved.age) : "",
        gender: saved.gender || "",
        phone: saved.phone || "",
        email: saved.email || "",
        bloodGroup: saved.bloodGroup || "",
        address: saved.address || "",
      });
      setMode("edit");
      setNotice("Profile saved.");
    } catch (requestError) {
      setError(
        requestError.message || "Unable to save your profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>My Profile</h1>

          <p>
            {mode === "create"
              ? "Complete your patient profile before booking."
              : "Keep your patient details up to date."}
          </p>
        </div>
      </div>

      {mode === "loading" && (
        <p style={{ color: "#6b7280" }}>Loading your profile…</p>
      )}

      {mode === "error" && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {(mode === "create" || mode === "edit") && (
        <section className="appointment-form-card">
          <h2>{mode === "create" ? "Patient Profile Setup" : "Patient Profile"}</h2>

          <p className="form-description">
            Fields marked * are required. Your profile is linked to your login
            account and is required before you can book appointments.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="appointment-form">

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <small style={{ color: "#dc2626", marginTop: "6px" }}>
                    {errors.fullName}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  min="1"
                  max="120"
                  step="1"
                  value={form.age}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.age && (
                  <small style={{ color: "#dc2626", marginTop: "6px" }}>
                    {errors.age}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Gender</label>
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
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <small style={{ color: "#6b7280", marginTop: "6px" }}>
                  Defaults to your account email if left blank.
                </small>
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <input
                  type="text"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

            </div>

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

            {notice && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginTop: "20px",
                  fontSize: "14px",
                }}
              >
                {notice}
              </div>
            )}

            <button
              type="submit"
              className="primary-button book-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Profile"
                  : "Save Changes"}
            </button>
          </form>
        </section>
      )}

    </div>
  );
}

export default Profile;
