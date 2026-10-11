import { useEffect, useMemo, useState } from "react";
import { listDoctors } from "../api/doctors";

function Doctors({ onNavigate, token }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [doctors, setDoctors] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      setError("");
      try {
        const data = await listDoctors(token);
        if (!cancelled) {
          setDoctors(Array.isArray(data) ? data : []);
          setState("ready");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Unable to load doctors.");
          setState("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const departments = useMemo(() => {
    const set = new Set(
      doctors
        .map((doctor) => (doctor.specialization || "").trim())
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [doctors]);

  const filteredDoctors = doctors.filter((doctor) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (doctor.fullName || "").toLowerCase().includes(term) ||
      (doctor.specialization || "").toLowerCase().includes(term);

    const matchesDepartment =
      department === "All" || doctor.specialization === department;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="doctors-page">

      <div className="doctors-header">
        <div>
          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>Doctors</h1>
          <p>Find and connect with healthcare professionals</p>
        </div>
      </div>

      <div className="doctor-search-section">

        <div className="doctor-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search doctor or specialization..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="doctor-filter"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        >
          <option value="All">All Specializations</option>
          {departments.map((specialization) => (
            <option key={specialization} value={specialization}>
              {specialization}
            </option>
          ))}
        </select>

      </div>

      {state === "loading" && (
        <p style={{ color: "#6b7280" }}>Loading doctors…</p>
      )}

      {state === "error" && (
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

      {state === "ready" && (
        <>
          <div className="doctor-results">
            <h2>Available Doctors</h2>
            <span>{filteredDoctors.length} doctors found</span>
          </div>

          <div className="doctors-grid">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <div className="doctor-card" key={doctor.doctorId}>
                  <div className="doctor-card-top">
                    <div className="doctor-avatar">🩺</div>
                  </div>

                  <div className="doctor-card-info">
                    <h3>{doctor.fullName}</h3>

                    {doctor.specialization && (
                      <p className="doctor-specialization">
                        {doctor.specialization}
                      </p>
                    )}

                    {doctor.address && (
                      <p className="doctor-department">🏥 {doctor.address}</p>
                    )}

                    {doctor.experience != null && (
                      <p className="doctor-experience">
                        ⭐ {doctor.experience} years experience
                      </p>
                    )}

                    {doctor.phone && (
                      <p className="doctor-department">📞 {doctor.phone}</p>
                    )}
                  </div>

                  <button
                    className="doctor-book-button"
                    onClick={() =>
                      onNavigate("appointments", {
                        doctorId: doctor.doctorId,
                      })
                    }
                  >
                    Book Appointment
                  </button>
                </div>
              ))
            ) : (
              <div className="no-doctors">
                <div>🔍</div>
                <h3>No doctors found</h3>
                <p>Try changing your search or specialization filter.</p>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}

export default Doctors;
