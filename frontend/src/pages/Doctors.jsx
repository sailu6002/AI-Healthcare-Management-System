<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useEffect, useMemo, useState } from "react";
import { listDoctors } from "../api/doctors";
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1

function Doctors({ onNavigate, token }) {
  const [search, setSearch] = useState("");
<<<<<<< HEAD
  const [specialization, setSpecialization] = useState("All");

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
=======
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
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1

  const token = localStorage.getItem("token");

  // Helper for resilient fetch
  const fetchDoctors = async () => {
    setLoading(true);
    setError("");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      let res;
      try {
        res = await fetch("/api/doctors", { headers });
      } catch {
        res = await fetch("http://localhost:8080/api/doctors", { headers });
      }

      if (!res || !res.ok) {
        res = await fetch("http://localhost:8080/api/doctors", { headers });
      }

      if (!res.ok) {
        throw new Error("Failed to fetch doctors list from backend");
      }

      const data = await res.json();

      const deduplicateDoctors = (list) => {
        const seen = new Set();
        return list.filter((doc) => {
          const idKey = doc.doctorId ? `id_${doc.doctorId}` : null;
          const key = `${(doc.fullName || "").trim().toLowerCase()}_${(doc.specialization || "").trim().toLowerCase()}`;
          if (idKey && seen.has(idKey)) return false;
          if (seen.has(key)) return false;
          if (idKey) seen.add(idKey);
          if (key !== "_") seen.add(key);
          return true;
        });
      };

      setDoctors(deduplicateDoctors(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError("Unable to connect to the doctors database. Please ensure backend is running.");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Unique specializations list
  const specializations = Array.from(
    new Set(
      doctors
        .map((doctor) => doctor.specialization)
        .filter((spec) => spec && spec.trim() !== "")
    )
  ).sort((a, b) => a.localeCompare(b));

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
<<<<<<< HEAD
    const searchValue = search.toLowerCase().trim();

    const matchesSearch =
      !searchValue ||
      (doctor.fullName && doctor.fullName.toLowerCase().includes(searchValue)) ||
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchValue)) ||
      (doctor.address && doctor.address.toLowerCase().includes(searchValue));

    const matchesSpecialization =
      specialization === "All" ||
      (doctor.specialization && doctor.specialization.toLowerCase() === specialization.toLowerCase());
=======
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (doctor.fullName || "").toLowerCase().includes(term) ||
      (doctor.specialization || "").toLowerCase().includes(term);

    const matchesDepartment =
      department === "All" || doctor.specialization === department;
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1

    return matchesSearch && matchesSpecialization;
  });

  return (
    <div className="doctors-page">
<<<<<<< HEAD
      {/* HEADER */}
=======

>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
      <div className="doctors-header">
        <div>
          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>
          <h1>👨‍⚕️ Available Doctors & Specialists</h1>
          <p>
            Find and connect with certified healthcare professionals across clinical departments
          </p>
        </div>
      </div>

<<<<<<< HEAD
      {/* SEARCH AND FILTER */}
=======
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
      <div className="doctor-search-section">
        <div className="doctor-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search doctor name, specialization, or clinic location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="doctor-filter"
<<<<<<< HEAD
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          disabled={loading}
        >
          <option value="All">All Specializations ({specializations.length})</option>
          {specializations.map((item) => (
            <option key={item} value={item}>
              {item}
=======
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        >
          <option value="All">All Specializations</option>
          {departments.map((specialization) => (
            <option key={specialization} value={specialization}>
              {specialization}
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
            </option>
          ))}
        </select>
      </div>

<<<<<<< HEAD
      {/* DOCTOR COUNT & REFRESH */}
      <div className="doctor-results" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Available Doctors</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span>
            {loading ? "Loading doctors..." : `${filteredDoctors.length} doctors found`}
          </span>
          <button
            onClick={fetchDoctors}
            disabled={loading}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              color: "#0284c7",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div
          style={{
            padding: "14px 20px",
            backgroundColor: "#fee2e2",
            border: "1px solid #f87171",
            borderRadius: "10px",
            color: "#991b1b",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* DOCTORS GRID */}
      <div className="doctors-grid">
        {loading ? (
          <div className="no-doctors">
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
            <h3>Loading doctors...</h3>
            <p>Please wait while we load verified specialists from the server.</p>
          </div>
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <div className="doctor-card" key={doctor.doctorId}>
              {/* Doctor Top */}
              <div className="doctor-card-top">
                <div className="doctor-avatar">👨‍⚕️</div>
                <span className="doctor-status">● Available Today</span>
              </div>

              {/* Doctor Information */}
              <div className="doctor-card-info">
                <h3>{doctor.fullName}</h3>
                <p className="doctor-specialization">
                  🏥 {doctor.specialization || "General Medicine"}
                </p>
                <p className="doctor-experience">
                  ⭐ {doctor.experience != null ? `${doctor.experience} Years Experience` : "Experienced Consultant"}
                </p>
                {doctor.address && (
                  <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0" }}>
                    📍 {doctor.address}
                  </p>
                )}
                {doctor.phone && (
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
                    📞 {doctor.phone}
                  </p>
                )}
              </div>

              {/* Availability */}
              <div className="doctor-availability">
                <span>📅</span>
                <span>Consultation Slots Available</span>
              </div>

              {/* Book Appointment */}
              <button
                className="doctor-book-button"
                onClick={() => onNavigate("appointments")}
              >
                Book Appointment →
              </button>
            </div>
          ))
        ) : (
          <div className="no-doctors">
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
            <h3>No doctors found</h3>
            <p>
              {doctors.length === 0
                ? "No doctor profiles found in the database. Ensure backend data seed has initialized."
                : "No doctors match your search or specialization filter. Try changing your search keywords."}
            </p>
          </div>
        )}
      </div>
=======
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

>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
    </div>
  );
}

export default Doctors;
