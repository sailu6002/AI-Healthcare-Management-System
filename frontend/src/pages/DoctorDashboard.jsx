import React, { useEffect, useState } from "react";

function DoctorDashboard({ onNavigate }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Modal states
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Forms
  const [patientForm, setPatientForm] = useState({
    fullName: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    bloodGroup: "O+",
    address: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    doctorId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTime: "10:00 AM",
    status: "Booked",
  });

  const [recordForm, setRecordForm] = useState({
    patientId: "",
    doctorId: "",
    appointmentId: "",
    diagnosis: "",
    symptoms: "",
    treatment: "",
    prescription: "",
    testResults: "",
    visitDate: new Date().toISOString().split("T")[0],
  });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 4500);
  };

  // Deduplication Helpers
  const deduplicatePatients = (list) => {
    const seen = new Set();
    return list.filter((p) => {
      const id = p.patientId ? `id_${p.patientId}` : null;
      const key = `${(p.fullName || "").trim().toLowerCase()}_${(p.email || "").trim().toLowerCase()}`;
      if (id && seen.has(id)) return false;
      if (seen.has(key)) return false;
      if (id) seen.add(id);
      if (key !== "_") seen.add(key);
      return true;
    });
  };

  const deduplicateDoctors = (list) => {
    const seen = new Set();
    return list.filter((d) => {
      const id = d.doctorId ? `id_${d.doctorId}` : null;
      const key = `${(d.fullName || "").trim().toLowerCase()}_${(d.specialization || "").trim().toLowerCase()}`;
      if (id && seen.has(id)) return false;
      if (seen.has(key)) return false;
      if (id) seen.add(id);
      if (key !== "_") seen.add(key);
      return true;
    });
  };

  const deduplicateAppointments = (list) => {
    const seen = new Set();
    return list.filter((apt) => {
      const id = apt.appointmentId ? `id_${apt.appointmentId}` : null;
      const key = `${apt.patientId}_${apt.doctorId}_${apt.appointmentDate}_${apt.appointmentTime}`;
      if (id && seen.has(id)) return false;
      if (seen.has(key)) return false;
      if (id) seen.add(id);
      seen.add(key);
      return true;
    });
  };

  const deduplicateRecords = (list) => {
    const seen = new Set();
    return list.filter((r) => {
      if (r.recordId && seen.has(r.recordId)) return false;
      if (r.recordId) seen.add(r.recordId);
      return true;
    });
  };

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!token) {
        if (active) {
          setError("Your login token is missing. Please log in again.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [patientsResponse, appointmentsResponse, recordsResponse, doctorsResponse] =
          await Promise.all([
            fetch("http://localhost:8080/api/patients", { headers }),
            fetch("http://localhost:8080/api/appointments", { headers }),
            fetch("http://localhost:8080/api/medical-records", { headers }),
            fetch("http://localhost:8080/api/doctors", { headers }),
          ]);

        const failed = [
          ["Patients", patientsResponse],
          ["Appointments", appointmentsResponse],
          ["Medical records", recordsResponse],
        ].filter(([, response]) => !response.ok);

        if (failed.length) {
          throw new Error(
            failed
              .map(([name, response]) => `${name}: HTTP ${response.status}`)
              .join(" | ")
          );
        }

        const [patientsData, appointmentsData, recordsData] =
          await Promise.all([
            patientsResponse.json(),
            appointmentsResponse.json(),
            recordsResponse.json(),
          ]);

        let doctorsData = [];
        if (doctorsResponse.ok) {
          doctorsData = await doctorsResponse.json();
        }

        if (active) {
          setPatients(deduplicatePatients(Array.isArray(patientsData) ? patientsData : []));
          setAppointments(deduplicateAppointments(Array.isArray(appointmentsData) ? appointmentsData : []));
          setRecords(deduplicateRecords(Array.isArray(recordsData) ? recordsData : []));
          setDoctors(deduplicateDoctors(Array.isArray(doctorsData) ? doctorsData : []));
        }
      } catch (err) {
        console.error("Doctor dashboard loading failed:", err);
        if (active) {
          setError(err.message || "Unable to load dashboard information.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [token]);

  const getMatchedDoctorId = () => {
    const matched = doctors.find(
      (d) =>
        (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
        (d.fullName && user.fullName && d.fullName.toLowerCase() === user.fullName.toLowerCase())
    );
    return user?.doctorId || matched?.doctorId || doctors[0]?.doctorId || "";
  };

  const convertTime = (timeValue) => {
    if (!timeValue) return "10:00:00";
    const parts = timeValue.split(" ");
    if (parts.length === 2) {
      const [timePart, period] = parts;
      let [hours, minutes] = timePart.split(":");
      hours = Number(hours);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${minutes}:00`;
    }
    return timeValue;
  };

  // =====================================================
  // QUICK CREATE: PATIENT (WITH DUPLICATE CHECK)
  // =====================================================
  const handleQuickAddPatient = async (e) => {
    e.preventDefault();
    const nameTrimmed = patientForm.fullName.trim();
    const phoneTrimmed = patientForm.phone.trim();
    const emailTrimmed = patientForm.email.trim();

    if (!nameTrimmed || !phoneTrimmed) {
      alert("Please provide Full Name and Phone number.");
      return;
    }

    // Frontend duplicate check
    const existing = patients.find(
      (p) =>
        (emailTrimmed && p.email && p.email.toLowerCase() === emailTrimmed.toLowerCase()) ||
        (phoneTrimmed && p.phone && p.phone === phoneTrimmed) ||
        (nameTrimmed && p.fullName && p.fullName.trim().toLowerCase() === nameTrimmed.toLowerCase())
    );
    if (existing) {
      alert(`Patient "${nameTrimmed}" is already registered (Patient ID #${existing.patientId}). Duplicate not created.`);
      setShowAddPatientModal(false);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("http://localhost:8080/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: nameTrimmed,
          age: Number(patientForm.age) || 0,
          gender: patientForm.gender,
          phone: phoneTrimmed,
          email: emailTrimmed,
          bloodGroup: patientForm.bloodGroup,
          address: patientForm.address.trim(),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create patient.");
      }

      const created = await res.json();
      setPatients((prev) => deduplicatePatients([created, ...prev]));
      setShowAddPatientModal(false);
      setPatientForm({
        fullName: "",
        age: "",
        gender: "Male",
        phone: "",
        email: "",
        bloodGroup: "O+",
        address: "",
      });
      showFeedback("success", `Patient "${created.fullName}" successfully added!`);
    } catch (err) {
      console.error("Error creating patient:", err);
      alert(err.message || "Failed to add patient.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // QUICK CREATE: APPOINTMENT
  // =====================================================
  const handleQuickScheduleAppointment = async (e) => {
    e.preventDefault();
    if (!appointmentForm.patientId) {
      alert("Please select a Patient.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        patientId: Number(appointmentForm.patientId),
        doctorId: Number(appointmentForm.doctorId || getMatchedDoctorId()),
        appointmentDate: appointmentForm.appointmentDate,
        appointmentTime: convertTime(appointmentForm.appointmentTime),
        status: appointmentForm.status || "Booked",
      };

      const res = await fetch("http://localhost:8080/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to schedule appointment.");
      }

      const created = await res.json();
      setAppointments((prev) => deduplicateAppointments([created, ...prev]));
      setShowScheduleModal(false);
      showFeedback("success", "Appointment successfully scheduled!");
    } catch (err) {
      console.error("Error scheduling appointment:", err);
      alert(err.message || "Failed to schedule appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // QUICK CREATE: MEDICAL RECORD
  // =====================================================
  const handleQuickAddRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.patientId || !recordForm.diagnosis.trim()) {
      alert("Please select a Patient and provide Diagnosis.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        patientId: Number(recordForm.patientId),
        doctorId: Number(recordForm.doctorId || getMatchedDoctorId()),
        appointmentId: recordForm.appointmentId ? Number(recordForm.appointmentId) : null,
        diagnosis: recordForm.diagnosis.trim(),
        symptoms: recordForm.symptoms.trim(),
        treatment: recordForm.treatment.trim(),
        prescription: recordForm.prescription.trim(),
        testResults: recordForm.testResults.trim(),
        visitDate: recordForm.visitDate,
      };

      const res = await fetch("http://localhost:8080/api/medical-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create medical record.");
      }

      const created = await res.json();
      setRecords((prev) => deduplicateRecords([created, ...prev]));
      setShowRecordModal(false);
      showFeedback("success", `Medical record #${created.recordId || ""} successfully saved!`);
    } catch (err) {
      console.error("Error saving medical record:", err);
      alert(err.message || "Failed to save medical record.");
    } finally {
      setSubmitting(false);
    }
  };

  const menuItems = [
    {
      icon: "📅",
      title: "Appointments Management",
      description: "Review, schedule, and update status of all patient consultation appointments.",
      badge: `${appointments.length} Consultations`,
      page: "appointments",
    },
    {
      icon: "👥",
      title: "Patient Registry & Profiles",
      description: "Manage registered patients, demographics, contact details, and appointment counts.",
      badge: `${patients.length} Registered Patients`,
      page: "patients",
    },
    {
      icon: "📋",
      title: "Medical Records & Diagnoses",
      description: "Access complete clinical history, consultation reports, symptoms, and test results.",
      badge: `${records.length} Clinical Records`,
      page: "medical-records",
    },
    {
      icon: "💊",
      title: "Prescription Management",
      description: "Review, issue, and manage medication prescriptions and treatment instructions.",
      badge: "Pharmacy & Rx",
      page: "prescriptions",
    },
    {
      icon: "🤖",
      title: "AI Disease Risk Assistant",
      description: "Screen patient risk factors for Type 2 Diabetes and cardiometabolic conditions with validated ML models.",
      badge: "Clinical AI",
      page: "assistant",
    },
    {
      icon: "🧪",
      title: "Medicine Directory & Interactions",
      description: "Search verified drug monographs, warnings, contraindications, and multi-drug interaction safety.",
      badge: "Drug Safety",
      page: "medicines",
    },
    {
      icon: "📍",
      title: "Nearby Pharmacy Suggestions",
      description: "Find local licensed pharmacies with real-time stock confirmation and contact details.",
      badge: "Pharmacy Finder",
      page: "pharmacies",
    },
    {
      icon: "👤",
      title: "Doctor Profile Settings",
      description: "View and verify your registered credentials, specialty, email, and user account details.",
      badge: "Account Details",
      page: "profile",
    },
  ];

  const handleNavigation = (page) => {
    if (typeof onNavigate === "function") {
      onNavigate(page);
    } else {
      console.error("Navigation handler is missing.");
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.reload();
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter(
    (appointment) => appointment.appointmentDate === today
  ).length;

  const pendingAppointments = appointments.filter((appointment) =>
    ["booked", "pending", "scheduled"].includes(
      String(appointment.status || "").toLowerCase()
    )
  ).length;

  const getPatientName = (patientId) => {
    const p = patients.find((item) => String(item.patientId) === String(patientId));
    return p ? p.fullName : `Patient #${patientId}`;
  };

  return (
    <div style={styles.page}>
      {/* Toast Feedback */}
      {feedback.message && (
        <div
          style={{
            ...styles.feedbackBanner,
            backgroundColor: feedback.type === "error" ? "#fee2e2" : "#dcfce7",
            color: feedback.type === "error" ? "#991b1b" : "#166534",
            borderColor: feedback.type === "error" ? "#f87171" : "#86efac",
          }}
        >
          {feedback.type === "error" ? "⚠️ " : "✅ "}
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>🏥 AI Healthcare Management System</div>
          <h1 style={styles.heading}>🏠 Doctor Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome back, {user.fullName || "Doctor"}! Manage your clinical workflow, appointments, and patient records from one unified workspace.
          </p>
          <p style={styles.email}>{user.email || ""}</p>
        </div>

        <div style={styles.roleBadge}>
          👨‍⚕️ {user.fullName || "Doctor"}
        </div>
      </header>

      {/* Welcome Card & Doctor Quick Actions */}
      <section style={styles.welcomeCard}>
        <div>
          <h2 style={styles.welcomeTitle}>
            Welcome, Dr. {user.fullName || "Doctor"}!
          </h2>
          <p style={styles.welcomeText}>
            Quickly add patients, schedule appointments, or create medical records using the action buttons below.
          </p>

          <div style={styles.quickActionsContainer}>
            <button
              style={styles.quickActionBtnPrimary}
              onClick={() => setShowAddPatientModal(true)}
            >
              ➕ Add Patient
            </button>

            <button
              style={styles.quickActionBtnSecondary}
              onClick={() => {
                setAppointmentForm((prev) => ({
                  ...prev,
                  patientId: patients.length > 0 ? String(patients[0].patientId) : "",
                  doctorId: String(getMatchedDoctorId()),
                }));
                setShowScheduleModal(true);
              }}
            >
              📅 Schedule Appointment
            </button>

            <button
              style={styles.quickActionBtnSecondary}
              onClick={() => {
                setRecordForm((prev) => ({
                  ...prev,
                  patientId: patients.length > 0 ? String(patients[0].patientId) : "",
                  doctorId: String(getMatchedDoctorId()),
                  visitDate: new Date().toISOString().split("T")[0],
                }));
                setShowRecordModal(true);
              }}
            >
              📝 Add Medical Record
            </button>
          </div>
        </div>

        <div style={styles.welcomeIcon}>🩺</div>
      </section>

      {/* Loading message */}
      {loading && (
        <div style={styles.infoMessage}>Loading dashboard information...</div>
      )}

      {/* Error message */}
      {!loading && error && (
        <div style={styles.errorMessage}>
          <strong>Some dashboard data could not be loaded.</strong>
          <p>{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <section style={styles.statsGrid}>
        <StatCard
          icon="👥"
          label="Unique Patients"
          value={loading ? "…" : patients.length}
        />
        <StatCard
          icon="📅"
          label="Today's Appointments"
          value={loading ? "…" : todayAppointments}
        />
        <StatCard
          icon="⏳"
          label="Pending / Booked"
          value={loading ? "…" : pendingAppointments}
        />
        <StatCard
          icon="📋"
          label="Medical Records"
          value={loading ? "…" : records.length}
        />
      </section>

      {/* =====================================================
          DOCTOR MANAGEMENT SERVICES (VERTICAL LAYOUT)
      ===================================================== */}
      <section style={styles.section}>
        <div style={styles.servicesHeader}>
          <h2 style={styles.sectionTitle}>🛠️ Doctor Management Services</h2>
          <p style={styles.sectionSubtitle}>
            Full clinical and administrative services organized in an intuitive vertical workspace.
          </p>
        </div>

        {/* Vertical Services Stack */}
        <div style={styles.verticalServicesList}>
          {menuItems.map((item) => (
            <button
              key={item.page}
              type="button"
              style={styles.verticalServiceCard}
              onClick={() => handleNavigation(item.page)}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = "translateX(5px)";
                event.currentTarget.style.borderColor = "#087b9c";
                event.currentTarget.style.boxShadow =
                  "0 6px 18px rgba(8, 123, 156, 0.12)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = "translateX(0)";
                event.currentTarget.style.borderColor = "#e5edf3";
                event.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0, 0, 0, 0.04)";
              }}
            >
              <div style={styles.verticalCardLeft}>
                <div style={styles.verticalIconBox}>{item.icon}</div>
                <div>
                  <div style={styles.titleWithBadge}>
                    <h3 style={styles.verticalCardTitle}>{item.title}</h3>
                    <span style={styles.verticalBadge}>{item.badge}</span>
                  </div>
                  <p style={styles.verticalCardDesc}>{item.description}</p>
                </div>
              </div>

              <div style={styles.verticalCardRight}>
                <span style={styles.verticalOpenBtn}>
                  Open Service <span>→</span>
                </span>
              </div>
            </button>
          ))}

          {/* Vertical Logout Button */}
          <button
            type="button"
            style={styles.verticalLogoutCard}
            onClick={handleLogout}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "translateX(5px)";
              event.currentTarget.style.borderColor = "#f87171";
              event.currentTarget.style.boxShadow =
                "0 6px 18px rgba(239, 68, 68, 0.12)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "translateX(0)";
              event.currentTarget.style.borderColor = "#fecaca";
              event.currentTarget.style.boxShadow =
                "0 2px 8px rgba(0, 0, 0, 0.04)";
            }}
          >
            <div style={styles.verticalCardLeft}>
              <div style={styles.verticalLogoutIconBox}>🚪</div>
              <div>
                <h3 style={styles.verticalLogoutTitle}>Logout Session</h3>
                <p style={styles.verticalCardDesc}>
                  Securely exit your doctor session and log out of the platform.
                </p>
              </div>
            </div>

            <div style={styles.verticalCardRight}>
              <span style={styles.verticalLogoutBtn}>
                Sign Out <span>→</span>
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Medical Records Table */}
      {!loading && (
        <section style={styles.recentSection}>
          <div style={styles.recentHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Recent Medical Records</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
                Latest clinical consultations and diagnoses from the database.
              </p>
            </div>

            <button
              style={styles.tableAddBtn}
              onClick={() => {
                setRecordForm((prev) => ({
                  ...prev,
                  patientId: patients.length > 0 ? String(patients[0].patientId) : "",
                  doctorId: String(getMatchedDoctorId()),
                  visitDate: new Date().toISOString().split("T")[0],
                }));
                setShowRecordModal(true);
              }}
            >
              ➕ Add Medical Record
            </button>
          </div>

          {records.length === 0 ? (
            <div style={{ ...styles.infoMessage, textAlign: "center", marginTop: "15px" }}>
              No medical records recorded yet.
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Record ID</th>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>Diagnosis</th>
                    <th style={styles.th}>Prescription</th>
                    <th style={styles.th}>Visit Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 6).map((record) => (
                    <tr key={record.recordId}>
                      <td style={styles.td}>#{record.recordId}</td>
                      <td style={{ ...styles.td, fontWeight: "600" }}>
                        {getPatientName(record.patientId)}
                      </td>
                      <td style={{ ...styles.td, color: "#087b9c", fontWeight: "600" }}>
                        {record.diagnosis || "Not provided"}
                      </td>
                      <td style={styles.td}>
                        {record.prescription || "None recorded"}
                      </td>
                      <td style={styles.td}>
                        {record.visitDate || "Not provided"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          MODAL: ADD PATIENT
      ===================================================== */}
      {showAddPatientModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>➕ Add New Patient</h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowAddPatientModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddPatient}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={patientForm.fullName}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, fullName: e.target.value })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Age *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="125"
                    placeholder="e.g. 29"
                    value={patientForm.age}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, age: e.target.value })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Gender *</label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, gender: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Blood Group</label>
                  <select
                    value={patientForm.bloodGroup}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, bloodGroup: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={patientForm.phone}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, phone: e.target.value })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. sarah@example.com"
                    value={patientForm.email}
                    onChange={(e) =>
                      setPatientForm({ ...patientForm, email: e.target.value })
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Home Address</label>
                <textarea
                  rows="2"
                  placeholder="Street, City, State"
                  value={patientForm.address}
                  onChange={(e) =>
                    setPatientForm({ ...patientForm, address: e.target.value })
                  }
                  style={styles.textarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowAddPatientModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={styles.submitBtn}
                >
                  {submitting ? "Saving..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: SCHEDULE APPOINTMENT
      ===================================================== */}
      {showScheduleModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📅 Schedule Patient Appointment</h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowScheduleModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickScheduleAppointment}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Patient *</label>
                {patients.length > 0 ? (
                  <select
                    required
                    value={appointmentForm.patientId}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        patientId: e.target.value,
                      })
                    }
                    style={styles.input}
                  >
                    <option value="">Select Patient</option>
                    {patients.map((p) => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.fullName} (ID: #{p.patientId} | {p.phone || "No phone"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{ color: "#b91c1c", fontSize: "13px" }}>
                    No patients exist yet. Please add a patient first.
                  </p>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Doctor</label>
                <select
                  value={appointmentForm.doctorId}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      doctorId: e.target.value,
                    })
                  }
                  style={styles.input}
                >
                  {doctors.map((d) => (
                    <option key={d.doctorId} value={d.doctorId}>
                      Dr. {d.fullName} ({d.specialization || "General"})
                    </option>
                  ))}
                  {doctors.length === 0 && (
                    <option value={user?.userId || ""}>
                      Dr. {user?.fullName || "Current Doctor"}
                    </option>
                  )}
                </select>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Appointment Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={appointmentForm.appointmentDate}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        appointmentDate: e.target.value,
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Preferred Time *</label>
                  <select
                    value={appointmentForm.appointmentTime}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        appointmentTime: e.target.value,
                      })
                    }
                    style={styles.input}
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || patients.length === 0}
                  style={styles.submitBtn}
                >
                  {submitting ? "Booking..." : "Schedule Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: ADD MEDICAL RECORD
      ===================================================== */}
      {showRecordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📝 Add New Medical Record</h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowRecordModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddRecord}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Patient *</label>
                  {patients.length > 0 ? (
                    <select
                      required
                      value={recordForm.patientId}
                      onChange={(e) =>
                        setRecordForm({
                          ...recordForm,
                          patientId: e.target.value,
                        })
                      }
                      style={styles.input}
                    >
                      <option value="">Select Patient</option>
                      {patients.map((p) => (
                        <option key={p.patientId} value={p.patientId}>
                          {p.fullName} (ID: #{p.patientId})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      required
                      placeholder="Patient ID"
                      value={recordForm.patientId}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, patientId: e.target.value })
                      }
                      style={styles.input}
                    />
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Visit Date *</label>
                  <input
                    type="date"
                    required
                    value={recordForm.visitDate}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        visitDate: e.target.value,
                      })
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hypertension Stage 1, Influenza A, Bronchitis"
                  value={recordForm.diagnosis}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      diagnosis: e.target.value,
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Symptoms</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Headache, dizziness, fatigue, high BP readings"
                  value={recordForm.symptoms}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      symptoms: e.target.value,
                    })
                  }
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Treatment & Clinical Plan</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Low sodium diet, 30 min daily walk, monitor BP"
                  value={recordForm.treatment}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      treatment: e.target.value,
                    })
                  }
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Prescription / Medications</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Amlodipine 5mg once daily in morning"
                  value={recordForm.prescription}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      prescription: e.target.value,
                    })
                  }
                  style={styles.textarea}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Test Results / Vital Signs</label>
                <input
                  type="text"
                  placeholder="e.g. BP 142/90 mmHg, Pulse 74 bpm"
                  value={recordForm.testResults}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      testResults: e.target.value,
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowRecordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={styles.submitBtn}
                >
                  {submitting ? "Saving..." : "Save Medical Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} AI Healthcare Management System</p>
        <p>Your healthcare workspace</p>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f8fc",
    padding: "30px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  header: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "26px 30px",
    marginBottom: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    boxShadow: "0 3px 14px rgba(0,0,0,0.04)",
  },
  brand: {
    color: "#087b9c",
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  heading: { margin: 0, fontSize: "28px", color: "#172033" },
  subtitle: {
    margin: "10px 0 0",
    color: "#718096",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  email: { margin: "6px 0 0", color: "#087b9c", fontSize: "13px" },
  roleBadge: {
    backgroundColor: "#e5f6fa",
    color: "#087b9c",
    padding: "12px 18px",
    borderRadius: "30px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  welcomeCard: {
    background: "linear-gradient(120deg, #087b9c, #159bb3)",
    borderRadius: "16px",
    padding: "28px 30px",
    marginBottom: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    color: "#fff",
    flexWrap: "wrap",
  },
  welcomeTitle: { margin: "0 0 8px", fontSize: "22px" },
  welcomeText: { margin: "0 0 16px", fontSize: "14px", lineHeight: 1.6, maxWidth: "600px" },
  welcomeIcon: { fontSize: "55px" },
  quickActionsContainer: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  quickActionBtnPrimary: {
    backgroundColor: "#ffffff",
    color: "#087b9c",
    border: "none",
    borderRadius: "9px",
    padding: "11px 18px",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  quickActionBtnSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    borderRadius: "9px",
    padding: "11px 18px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backdropFilter: "blur(4px)",
  },
  feedbackBanner: {
    padding: "14px 20px",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid",
    fontWeight: "600",
  },
  infoMessage: {
    background: "#e8f6fa",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  errorMessage: {
    background: "#fff1f0",
    color: "#a12622",
    padding: "18px",
    borderRadius: "10px",
    marginBottom: "20px",
    overflowWrap: "anywhere",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "18px",
    marginBottom: "35px",
  },
  statCard: {
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  statIcon: { fontSize: "30px" },
  statValue: { fontSize: "25px", fontWeight: "bold", color: "#087b9c" },
  statLabel: { fontSize: "13px", color: "#718096", marginTop: "4px" },
  section: { marginBottom: "35px" },
  servicesHeader: {
    marginBottom: "18px",
  },
  sectionTitle: { fontSize: "22px", margin: "0 0 6px", color: "#172033" },
  sectionSubtitle: {
    color: "#718096",
    fontSize: "14px",
    margin: 0,
  },
  // VERTICAL SERVICES STACK
  verticalServicesList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  verticalServiceCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    border: "1px solid #e5edf3",
    borderRadius: "14px",
    padding: "18px 24px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
  },
  verticalCardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flex: 1,
  },
  verticalIconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    backgroundColor: "#e8f6fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    flexShrink: 0,
  },
  titleWithBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "4px",
  },
  verticalCardTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#172033",
    fontWeight: "bold",
  },
  verticalBadge: {
    backgroundColor: "#f1f5f9",
    color: "#087b9c",
    padding: "3px 9px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },
  verticalCardDesc: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
    lineHeight: 1.5,
  },
  verticalCardRight: {
    marginLeft: "20px",
    flexShrink: 0,
  },
  verticalOpenBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#f0f9ff",
    color: "#087b9c",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "bold",
    border: "1px solid #bae6fd",
  },
  verticalLogoutCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    border: "1px solid #fee2e2",
    borderRadius: "14px",
    padding: "18px 24px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
  },
  verticalLogoutIconBox: {
    width: "52px",
    height: "52px",
    borderRadius: "12px",
    backgroundColor: "#fff1f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    flexShrink: 0,
  },
  verticalLogoutTitle: {
    margin: "0 0 4px",
    fontSize: "17px",
    color: "#b91c1c",
    fontWeight: "bold",
  },
  verticalLogoutBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#fff1f2",
    color: "#b91c1c",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "bold",
    border: "1px solid #fecdd3",
  },
  recentSection: { marginBottom: "35px" },
  recentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
  },
  tableAddBtn: {
    backgroundColor: "#087b9c",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
  },
  tableWrapper: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: "12px",
    marginTop: "15px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  th: {
    padding: "14px 18px",
    background: "#e8f6fa",
    color: "#087b9c",
    fontSize: "13px",
  },
  td: {
    padding: "14px 18px",
    borderTop: "1px solid #edf0f4",
    fontSize: "13px",
  },
  footer: {
    borderTop: "1px solid #e5edf3",
    paddingTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
    color: "#718096",
    fontSize: "12px",
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    maxWidth: "620px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "28px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #edf0f4",
    paddingBottom: "12px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#172033",
  },
  closeBtn: {
    border: "none",
    backgroundColor: "transparent",
    fontSize: "18px",
    cursor: "pointer",
    color: "#6b7280",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  formGroup: {
    marginBottom: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    fontFamily: "Arial, sans-serif",
    resize: "vertical",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px",
    borderTop: "1px solid #edf0f4",
    paddingTop: "16px",
  },
  cancelBtn: {
    padding: "10px 18px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#374151",
  },
  submitBtn: {
    padding: "10px 22px",
    border: "none",
    backgroundColor: "#087b9c",
    color: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default DoctorDashboard;