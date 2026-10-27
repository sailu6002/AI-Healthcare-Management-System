import { useEffect, useState } from "react";

function DoctorPatients({ onNavigate }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Modals state
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Forms state
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
    patientName: "",
    doctorId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    appointmentTime: "10:00 AM",
    status: "Booked",
  });

  const [recordForm, setRecordForm] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    appointmentId: "",
    diagnosis: "",
    symptoms: "",
    treatment: "",
    prescription: "",
    testResults: "",
    visitDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  // Deduplicate patients list helper
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

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [patientsRes, appointmentsRes, doctorsRes] = await Promise.all([
        fetch("http://localhost:8080/api/patients", { headers }),
        fetch("http://localhost:8080/api/appointments", { headers }),
        fetch("http://localhost:8080/api/doctors", { headers }),
      ]);

      if (patientsRes.ok) {
        const patientData = await patientsRes.json();
        setPatients(deduplicatePatients(Array.isArray(patientData) ? patientData : []));
      }

      if (appointmentsRes.ok) {
        const appointmentData = await appointmentsRes.json();
        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      }

      if (doctorsRes.ok) {
        const doctorData = await doctorsRes.json();
        setDoctors(Array.isArray(doctorData) ? doctorData : []);
      }
    } catch (error) {
      console.error("Error loading doctor patients data:", error);
      showFeedback("error", "Unable to load patient information from backend.");
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4000);
  };

  const getMatchedDoctorId = () => {
    const matched = doctors.find(
      (d) =>
        (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
        (d.fullName && user.fullName && d.fullName.toLowerCase() === user.fullName.toLowerCase())
    );
    return user?.doctorId || matched?.doctorId || doctors[0]?.doctorId || "";
  };

  const getPatientAppointmentCount = (patientId) => {
    return appointments.filter(
      (appointment) => String(appointment.patientId) === String(patientId)
    ).length;
  };

  // =====================================================
  // ADD PATIENT
  // =====================================================
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    const nameTrim = patientForm.fullName.trim();
    const phoneTrim = patientForm.phone.trim();
    const emailTrim = patientForm.email.trim();

    if (!nameTrim || !phoneTrim) {
      alert("Please provide the Patient Full Name and Phone number.");
      return;
    }

    // Check for duplicate patient in existing list
    const existing = patients.find(
      (p) =>
        (emailTrim && p.email && p.email.toLowerCase() === emailTrim.toLowerCase()) ||
        (phoneTrim && p.phone && p.phone === phoneTrim) ||
        (nameTrim && p.fullName && p.fullName.trim().toLowerCase() === nameTrim.toLowerCase())
    );
    if (existing) {
      alert(`Patient "${nameTrim}" is already registered (Patient ID #${existing.patientId}). Duplicate not created.`);
      setShowAddPatientModal(false);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("http://localhost:8080/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: nameTrim,
          age: Number(patientForm.age) || 0,
          gender: patientForm.gender,
          phone: phoneTrim,
          email: emailTrim,
          bloodGroup: patientForm.bloodGroup,
          address: patientForm.address.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create patient.");
      }

      const savedPatient = await response.json();
      setPatients((prev) => deduplicatePatients([savedPatient, ...prev]));
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
      showFeedback("success", `Patient "${savedPatient.fullName}" added successfully!`);
    } catch (err) {
      console.error("Error creating patient:", err);
      alert(err.message || "Failed to add patient.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // SCHEDULE APPOINTMENT FOR PATIENT
  // =====================================================
  const openAppointmentModalForPatient = (patient) => {
    setAppointmentForm({
      patientId: patient.patientId,
      patientName: patient.fullName,
      doctorId: getMatchedDoctorId(),
      appointmentDate: new Date().toISOString().split("T")[0],
      appointmentTime: "10:00 AM",
      status: "Booked",
    });
    setShowAppointmentModal(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!appointmentForm.patientId || !appointmentForm.appointmentDate || !appointmentForm.appointmentTime) {
      alert("Please fill in all appointment fields.");
      return;
    }

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

    try {
      setSubmitting(true);
      const appointmentPayload = {
        patientId: Number(appointmentForm.patientId),
        doctorId: Number(appointmentForm.doctorId || getMatchedDoctorId()),
        appointmentDate: appointmentForm.appointmentDate,
        appointmentTime: convertTime(appointmentForm.appointmentTime),
        status: appointmentForm.status || "Booked",
      };

      const response = await fetch("http://localhost:8080/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appointmentPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to schedule appointment.");
      }

      const savedAppointment = await response.json();
      setAppointments((prev) => [savedAppointment, ...prev]);
      setShowAppointmentModal(false);
      showFeedback("success", `Appointment booked successfully for ${appointmentForm.patientName || "patient"}!`);
    } catch (err) {
      console.error("Error booking appointment:", err);
      alert(err.message || "Failed to schedule appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // ADD MEDICAL RECORD FOR PATIENT
  // =====================================================
  const openRecordModalForPatient = (patient) => {
    setRecordForm({
      patientId: patient.patientId,
      patientName: patient.fullName,
      doctorId: getMatchedDoctorId(),
      appointmentId: "",
      diagnosis: "",
      symptoms: "",
      treatment: "",
      prescription: "",
      testResults: "",
      visitDate: new Date().toISOString().split("T")[0],
    });
    setShowRecordModal(true);
  };

  const handleCreateMedicalRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.patientId || !recordForm.diagnosis.trim()) {
      alert("Patient and Diagnosis are required.");
      return;
    }

    try {
      setSubmitting(true);
      const recordPayload = {
        patientId: Number(recordForm.patientId),
        doctorId: Number(recordForm.doctorId || getMatchedDoctorId()),
        appointmentId: recordForm.appointmentId ? Number(recordForm.appointmentId) : null,
        diagnosis: recordForm.diagnosis.trim(),
        symptoms: recordForm.symptoms.trim(),
        treatment: recordForm.treatment.trim(),
        prescription: recordForm.prescription.trim(),
        testResults: recordForm.testResults.trim(),
        visitDate: recordForm.visitDate || new Date().toISOString().split("T")[0],
      };

      const response = await fetch("http://localhost:8080/api/medical-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(recordPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create medical record.");
      }

      setShowRecordModal(false);
      showFeedback("success", `Medical record created successfully for ${recordForm.patientName || "patient"}!`);
    } catch (err) {
      console.error("Error creating medical record:", err);
      alert(err.message || "Failed to create medical record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered patients
  const searchLower = searchTerm.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) => {
    const text = `${patient.fullName || ""} ${patient.phone || ""} ${patient.email || ""} ${patient.patientId || ""}`.toLowerCase();
    return text.includes(searchLower);
  });

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
      <div style={styles.header}>
        <div>
          <button
            style={styles.backButton}
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1 style={styles.title}>👥 Doctor Patient Management</h1>

          <p style={styles.subtitle}>
            Register patients, view medical records, and schedule appointments.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.primaryAddBtn}
            onClick={() => setShowAddPatientModal(true)}
          >
            ➕ Add New Patient
          </button>

          <div style={styles.countBox}>
            <span style={styles.countIcon}>👥</span>
            <div>
              <strong style={styles.countNumber}>{patients.length}</strong>
              <small style={styles.countLabel}>Total Patients</small>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div style={styles.searchBarContainer}>
        <input
          type="search"
          placeholder="🔍 Search patients by name, phone, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        {searchTerm && (
          <button
            style={styles.clearSearchBtn}
            onClick={() => setSearchTerm("")}
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && <div style={styles.message}>Loading patients...</div>}

      {/* No Patients */}
      {!loading && filteredPatients.length === 0 && (
        <div style={styles.message}>
          {patients.length === 0 ? (
            <div>
              <p style={{ fontSize: "16px", marginBottom: "15px" }}>
                No patients found in the system yet.
              </p>
              <button
                style={styles.primaryAddBtn}
                onClick={() => setShowAddPatientModal(true)}
              >
                ➕ Add Your First Patient
              </button>
            </div>
          ) : (
            "No patients matched your search."
          )}
        </div>
      )}

      {/* Patient Cards Grid */}
      {!loading && filteredPatients.length > 0 && (
        <div style={styles.patientGrid}>
          {filteredPatients.map((patient) => (
            <div key={patient.patientId} style={styles.patientCard}>
              {/* Patient Header */}
              <div style={styles.patientTop}>
                <div style={styles.patientIcon}>👤</div>

                <div style={{ flex: 1 }}>
                  <h2 style={styles.patientName}>{patient.fullName}</h2>
                  <p style={styles.patientId}>Patient #{patient.patientId}</p>
                </div>

                <span style={styles.bloodBadge}>
                  🩸 {patient.bloodGroup || "N/A"}
                </span>
              </div>

              {/* Patient Details */}
              <div style={styles.details}>
                <div style={styles.detail}>
                  <span>🎂</span>
                  <div>
                    <small style={styles.detailLabel}>Age</small>
                    <strong>{patient.age || "N/A"}</strong>
                  </div>
                </div>

                <div style={styles.detail}>
                  <span>⚧</span>
                  <div>
                    <small style={styles.detailLabel}>Gender</small>
                    <strong>{patient.gender || "N/A"}</strong>
                  </div>
                </div>

                <div style={styles.detail}>
                  <span>📞</span>
                  <div>
                    <small style={styles.detailLabel}>Phone</small>
                    <strong>{patient.phone || "N/A"}</strong>
                  </div>
                </div>

                <div style={styles.detail}>
                  <span>✉️</span>
                  <div>
                    <small style={styles.detailLabel}>Email</small>
                    <strong style={{ fontSize: "12px", overflowWrap: "anywhere" }}>
                      {patient.email || "N/A"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Address */}
              {patient.address && (
                <div style={styles.addressBox}>
                  <small style={styles.detailLabel}>📍 Address</small>
                  <p style={{ margin: "3px 0 0", fontSize: "13px" }}>
                    {patient.address}
                  </p>
                </div>
              )}

              {/* Appointment summary */}
              <div style={styles.appointmentInfoBar}>
                <span>
                  📅 {getPatientAppointmentCount(patient.patientId)} appointment(s)
                </span>
              </div>

              {/* Action Buttons for Doctor */}
              <div style={styles.cardActions}>
                <button
                  style={styles.scheduleActionBtn}
                  onClick={() => openAppointmentModalForPatient(patient)}
                  title="Schedule Appointment for this patient"
                >
                  📅 Schedule
                </button>

                <button
                  style={styles.recordActionBtn}
                  onClick={() => openRecordModalForPatient(patient)}
                  title="Add Medical Record for this patient"
                >
                  📝 Add Record
                </button>

                <button
                  style={styles.viewRecordsBtn}
                  onClick={() => onNavigate("medical-records")}
                  title="View All Medical Records"
                >
                  📋 Records
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          ADD PATIENT MODAL
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

            <form onSubmit={handleCreatePatient}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
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
                    placeholder="e.g. 35"
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
                    placeholder="e.g. patient@example.com"
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
                  placeholder="Street, City, State, ZIP code"
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
                  {submitting ? "Saving Patient..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          SCHEDULE APPOINTMENT MODAL
      ===================================================== */}
      {showAppointmentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                📅 Schedule Appointment for {appointmentForm.patientName}
              </h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowAppointmentModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Patient</label>
                <input
                  type="text"
                  disabled
                  value={`${appointmentForm.patientName} (ID: #${appointmentForm.patientId})`}
                  style={{ ...styles.input, backgroundColor: "#f1f5f9" }}
                />
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
                  {doctors.map((doc) => (
                    <option key={doc.doctorId} value={doc.doctorId}>
                      Dr. {doc.fullName} ({doc.specialization || "General"})
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
                  <label style={styles.label}>Preferred Time Slot *</label>
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

              <div style={styles.formGroup}>
                <label style={styles.label}>Initial Status</label>
                <select
                  value={appointmentForm.status}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      status: e.target.value,
                    })
                  }
                  style={styles.input}
                >
                  <option value="Booked">Booked</option>
                  <option value="Confirmed">Confirmed</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowAppointmentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={styles.submitBtn}
                >
                  {submitting ? "Booking..." : "Book Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD MEDICAL RECORD MODAL
      ===================================================== */}
      {showRecordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                📝 Add Medical Record for {recordForm.patientName}
              </h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowRecordModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicalRecord}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Patient</label>
                  <input
                    type="text"
                    disabled
                    value={`${recordForm.patientName} (ID: #${recordForm.patientId})`}
                    style={{ ...styles.input, backgroundColor: "#f1f5f9" }}
                  />
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
                  placeholder="e.g. Acute Pharyngitis, Type 2 Diabetes, Hypertension"
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
                <label style={styles.label}>Symptoms Reported</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Fever, sore throat, fatigue for 3 days"
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
                <label style={styles.label}>Treatment & Recommended Care</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Rest, hydration, saline gargle, follow-up in 5 days"
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
                  placeholder="e.g. Amoxicillin 500mg TID for 7 days, Paracetamol 650mg SOS"
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
                <label style={styles.label}>Test Results / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. BP 120/80, SpO2 98%, Temp 100.4 F, Blood panel normal"
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
                  {submitting ? "Saving Record..." : "Save Medical Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f8fb",
    padding: "35px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  header: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "25px 30px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  primaryAddBtn: {
    backgroundColor: "#087b9c",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(8, 123, 156, 0.25)",
    transition: "background-color 0.2s",
  },
  backButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#087b9c",
    cursor: "pointer",
    fontWeight: "600",
    marginBottom: "10px",
    padding: 0,
    fontSize: "14px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
  },
  subtitle: {
    margin: "7px 0 0",
    color: "#7b8794",
  },
  countBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#e8f6fa",
    padding: "12px 18px",
    borderRadius: "12px",
  },
  countIcon: {
    fontSize: "24px",
  },
  countNumber: {
    display: "block",
    fontSize: "20px",
    color: "#087b9c",
  },
  countLabel: {
    display: "block",
    color: "#68737d",
    marginTop: "2px",
    fontSize: "12px",
  },
  searchBarContainer: {
    marginBottom: "22px",
    display: "flex",
    gap: "10px",
  },
  searchInput: {
    flex: 1,
    padding: "14px 18px",
    border: "1px solid #dbe2ea",
    borderRadius: "10px",
    fontSize: "15px",
    backgroundColor: "#ffffff",
    outline: "none",
  },
  clearSearchBtn: {
    padding: "0 18px",
    border: "1px solid #dbe2ea",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#6b7280",
  },
  feedbackBanner: {
    padding: "14px 20px",
    borderRadius: "10px",
    marginBottom: "20px",
    border: "1px solid",
    fontWeight: "500",
  },
  message: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "35px",
    textAlign: "center",
    color: "#7b8794",
  },
  patientGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "20px",
  },
  patientCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "22px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  patientTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    paddingBottom: "16px",
    borderBottom: "1px solid #edf0f2",
  },
  patientIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#e8f6fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },
  patientName: {
    margin: 0,
    fontSize: "18px",
    color: "#172033",
  },
  patientId: {
    margin: "3px 0 0",
    color: "#8993a0",
    fontSize: "12px",
  },
  bloodBadge: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  details: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    padding: "16px 0",
  },
  detail: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },
  detailLabel: {
    display: "block",
    color: "#8993a0",
    fontSize: "11px",
    marginBottom: "2px",
  },
  addressBox: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "14px",
  },
  appointmentInfoBar: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "14px",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  scheduleActionBtn: {
    flex: 1,
    border: "none",
    backgroundColor: "#087b9c",
    color: "#ffffff",
    padding: "9px 8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  recordActionBtn: {
    flex: 1,
    border: "none",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    padding: "9px 8px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  viewRecordsBtn: {
    border: "1px solid #dbe2ea",
    backgroundColor: "#f8fafc",
    color: "#475569",
    padding: "9px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
  },
  // Modal Styles
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
    maxWidth: "600px",
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

export default DoctorPatients;