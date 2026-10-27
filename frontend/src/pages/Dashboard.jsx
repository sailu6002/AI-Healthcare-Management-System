import { useEffect, useState } from "react";
<<<<<<< HEAD

function Dashboard({ onNavigate }) {
  // Get logged-in user details from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // State
  const [patientDetails, setPatientDetails] = useState(null);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [medicalRecordCount, setMedicalRecordCount] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch patient profile, appointments, medical records, and doctors
  useEffect(() => {
    let isMounted = true;

    const fetchAllPatientData = async () => {
      try {
        setLoading(true);
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // 1. Fetch Patients & Doctors
        const [patientsRes, doctorsRes] = await Promise.all([
          fetch("http://localhost:8080/api/patients", { headers }),
          fetch("http://localhost:8080/api/doctors", { headers }),
        ]);

        let matchedPatient = null;
        let allDoctors = [];

        if (doctorsRes.ok) {
          allDoctors = await doctorsRes.json();
          if (isMounted) setDoctors(Array.isArray(allDoctors) ? allDoctors : []);
        }

        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          const patientList = Array.isArray(patientsData) ? patientsData : [];
          // Match patient by patientId, email, or full name
          matchedPatient = patientList.find(
            (p) =>
              (user?.patientId && String(p.patientId) === String(user.patientId)) ||
              (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
              (p.fullName && user.fullName && p.fullName.trim().toLowerCase() === user.fullName.trim().toLowerCase())
          );
        }

        const resolvedPatientId = user?.patientId || matchedPatient?.patientId || null;

        if (matchedPatient?.patientId && !user?.patientId) {
          try {
            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            stored.patientId = matchedPatient.patientId;
            localStorage.setItem("user", JSON.stringify(stored));
          } catch (e) {
            console.warn("Could not cache patientId:", e);
          }
        }

        if (isMounted) {
          setPatientDetails(
            matchedPatient || {
              fullName: user.fullName,
              email: user.email,
              patientId: resolvedPatientId || "N/A",
              bloodGroup: "O+",
              gender: "N/A",
              age: "N/A",
              phone: "N/A",
              address: "N/A",
            }
          );
        }

        // 2. Fetch Appointments & Medical Records for this patient
        if (resolvedPatientId) {
          const [appointmentsRes, recordsRes] = await Promise.all([
            fetch(`http://localhost:8080/api/appointments/patient/${resolvedPatientId}`, { headers }),
            fetch(`http://localhost:8080/api/medical-records/patient/${resolvedPatientId}`, { headers }),
          ]);

          let appointmentsData = [];
          let recordsData = [];

          if (appointmentsRes.ok) {
            appointmentsData = await appointmentsRes.json();
            if (isMounted && Array.isArray(appointmentsData)) {
              setAppointmentCount(appointmentsData.length);
            }
          }

          if (recordsRes.ok) {
            recordsData = await recordsRes.json();
            if (isMounted && Array.isArray(recordsData)) {
              setMedicalRecordCount(recordsData.length);
            }
          }

          // Build dynamic recent activities
          const activities = [];

          if (Array.isArray(recordsData)) {
            recordsData.forEach((rec) => {
              const doc = allDoctors.find((d) => String(d.doctorId) === String(rec.doctorId));
              activities.push({
                id: `rec_${rec.recordId}`,
                icon: "🩺",
                title: rec.diagnosis || "Medical Consultation",
                subtitle: `Doctor: ${doc ? `Dr. ${doc.fullName}` : `Doctor ID #${rec.doctorId}`}`,
                date: rec.visitDate || "",
                type: "record",
              });
            });
          }

          if (Array.isArray(appointmentsData)) {
            appointmentsData.forEach((apt) => {
              const doc = allDoctors.find((d) => String(d.doctorId) === String(apt.doctorId));
              activities.push({
                id: `apt_${apt.appointmentId}`,
                icon: "📅",
                title: `Consultation Appointment (${apt.status || "Booked"})`,
                subtitle: `Doctor: ${doc ? `Dr. ${doc.fullName}` : `Doctor ID #${apt.doctorId}`} at ${apt.appointmentTime || ""}`,
                date: apt.appointmentDate || "",
                type: "appointment",
              });
            });
          }

          // Sort by date descending
          activities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

          if (isMounted) {
            setRecentActivities(activities);
          }
        }
      } catch (error) {
        console.error("Error fetching patient dashboard data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (token) {
      fetchAllPatientData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.userId, user?.email, user?.fullName, token]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "Recent";
    const date = new Date(dateValue + "T00:00:00");
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
=======
import { getMyAppointments } from "../api/appointments";

function Dashboard({ onNavigate, token, fullName }) {
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getMyAppointments(token);
        if (!cancelled) {
          setAppointments(Array.isArray(data) ? data : []);
        }
      } catch {
        // A missing profile simply means no appointments yet.
      } finally {
        if (!cancelled) {
          setAppointmentsLoaded(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const upcoming = appointments.filter(
    (appointment) => appointment.status === "BOOKED"
  );
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-icon">🏥</div>
          <div>
            <h2>AI Healthcare</h2>
            <p>Management System</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          {/* Dashboard */}
          <button
            className="menu-item active"
            onClick={() => onNavigate("dashboard")}
          >
            <span>🏠</span>
            Dashboard
          </button>

          {/* Appointments */}
          <button
            className="menu-item"
            onClick={() => onNavigate("appointments")}
          >
            <span>📅</span>
            Appointments
          </button>

          {/* Appointment Reminders */}
          <button
            className="menu-item"
            onClick={() => onNavigate("reminders")}
          >
            <span>🔔</span>
            Reminders
          </button>

          {/* Doctors */}
          <button
            className="menu-item"
            onClick={() => onNavigate("doctors")}
          >
            <span>👨‍⚕️</span>
            Doctors
          </button>

          {/* Medical Records */}
          <button
            className="menu-item"
            onClick={() => onNavigate("medical-records")}
          >
            <span>🧪</span>
            Medical Records
          </button>

          {/* AI Assistant */}
          <button
            className="menu-item"
            onClick={() => onNavigate("assistant")}
          >
            <span>🤖</span>
            AI Assistant
          </button>

          {/* Medicine Safety & Interactions */}
          <button
            className="menu-item"
            onClick={() => onNavigate("medicines")}
          >
            <span>💊</span>
            Medicine Safety
          </button>

          {/* Nearby Pharmacies */}
          <button
            className="menu-item"
            onClick={() => onNavigate("pharmacies")}
          >
            <span>📍</span>
            Nearby Pharmacies
          </button>

          {/* Profile */}
          <button
            className="menu-item"
            onClick={() => onNavigate("profile")}
          >
            <span>👤</span>
            Profile
          </button>
        </nav>

        {/* Logout */}
        <div className="sidebar-bottom">
          <button
            className="menu-item logout"
            onClick={() => onNavigate("logout")}
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-topbar">
          <div>
            <h1>Patient Dashboard</h1>
            <p>Welcome back! Here's your personal health overview and records.</p>
          </div>

          {/* Logged-in User Profile Pill */}
          <div className="patient-profile">
            <div className="patient-avatar">👤</div>
            <div>
<<<<<<< HEAD
              <strong>{patientDetails?.fullName || user?.fullName || "Patient"}</strong>
              <small>Patient Account • ID #{patientDetails?.patientId || user?.patientId || "N/A"}</small>
=======
              <strong>{fullName || "Patient"}</strong>
              <small>Patient Account</small>
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <section className="welcome-section">
          <h2>
<<<<<<< HEAD
            Good Morning, {patientDetails?.fullName || user?.fullName || "Patient"}! 👋
=======
            Good Morning, {fullName || "Patient"}! 👋
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
          </h2>
          <p>
            Welcome to your patient portal. Manage your appointments and view your clinical medical records.
          </p>
        </section>

        {/* Patient Profile & Health Details Card */}
        <section style={patientStyles.detailsCardSection}>
          <div style={patientStyles.detailsCard}>
            <div style={patientStyles.detailsCardHeader}>
              <div style={patientStyles.badgeIcon}>📋</div>
              <div>
                <h3 style={patientStyles.detailsCardTitle}>Patient Profile & Health Details</h3>
                <p style={patientStyles.detailsCardSubtitle}>
                  Verified demographic and health records registered in the system
                </p>
              </div>
            </div>

            <div style={patientStyles.detailsGrid}>
              <div style={patientStyles.detailItem}>
                <span style={patientStyles.detailItemLabel}>Full Name</span>
                <strong style={patientStyles.detailItemValue}>
                  {patientDetails?.fullName || user?.fullName || "Not available"}
                </strong>
              </div>

              <div style={patientStyles.detailItem}>
                <span style={patientStyles.detailItemLabel}>Patient ID</span>
                <strong style={patientStyles.detailItemValue}>
                  #{patientDetails?.patientId || user?.patientId || "N/A"}
                </strong>
              </div>

              <div style={patientStyles.detailItem}>
                <span style={patientStyles.detailItemLabel}>Blood Group</span>
                <strong style={{ ...patientStyles.detailItemValue, color: "#dc2626" }}>
                  🩸 {patientDetails?.bloodGroup || "O+"}
                </strong>
              </div>

              <div style={patientStyles.detailItem}>
                <span style={patientStyles.detailItemLabel}>Age & Gender</span>
                <strong style={patientStyles.detailItemValue}>
                  {patientDetails?.age ? `${patientDetails.age} Years` : "N/A"} • {patientDetails?.gender || "N/A"}
                </strong>
              </div>

              <div style={patientStyles.detailItem}>
                <span style={patientStyles.detailItemLabel}>Phone Number</span>
                <strong style={patientStyles.detailItemValue}>
                  📞 {patientDetails?.phone || "Not available"}
                </strong>
              </div>

              <div style={patientStyles.detailItem}>
                <span style={patientStyles.detailItemLabel}>Email Address</span>
                <strong style={patientStyles.detailItemValue}>
                  ✉️ {patientDetails?.email || user?.email || "Not available"}
                </strong>
              </div>

              <div style={{ ...patientStyles.detailItem, gridColumn: "1 / -1" }}>
                <span style={patientStyles.detailItemLabel}>Residential Address</span>
                <strong style={patientStyles.detailItemValue}>
                  📍 {patientDetails?.address || "Registered hospital patient address"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Cards */}
        <section className="dashboard-cards">
          {/* Appointments */}
          <div
            className="dashboard-card"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigate("appointments")}
          >
            <div className="card-icon">📅</div>
            <div>
              <h3>Appointments</h3>
<<<<<<< HEAD
              <p className="card-number">{loading ? "..." : appointmentCount}</p>
              <span>Consultations scheduled</span>
=======
              <p className="card-number">
                {appointmentsLoaded ? upcoming.length : "…"}
              </p>
              <span>Upcoming appointments</span>
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
            </div>
          </div>

          {/* Medical Records */}
          <div
            className="dashboard-card"
            style={{ cursor: "pointer" }}
            onClick={() => onNavigate("medical-records")}
          >
            <div className="card-icon">🧪</div>
            <div>
              <h3>Medical Records</h3>
              <p className="card-number">{loading ? "..." : medicalRecordCount}</p>
              <span>Available clinical reports</span>
            </div>
          </div>

          {/* Blood Group */}
          <div className="dashboard-card">
            <div className="card-icon" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
              🩸
            </div>
            <div>
              <h3>Blood Group</h3>
              <p className="card-number" style={{ color: "#dc2626" }}>
                {patientDetails?.bloodGroup || "O+"}
              </p>
              <span>Registered blood type</span>
            </div>
          </div>

          {/* Health Status */}
          <div className="dashboard-card">
            <div className="card-icon">❤️</div>
            <div>
              <h3>Health Status</h3>
              <p className="card-number">Good</p>
              <span>Overall profile active</span>
            </div>
          </div>
        </section>

        {/* AI Assistant Banner */}
        <section className="ai-section">
          <div className="ai-content">
            <div className="ai-icon">🤖</div>
            <div>
              <h2>AI Health Assistant</h2>
              <p>
                Get AI-powered health insights, answers to symptoms, and assistance based on your health records.
              </p>
            </div>
          </div>

<<<<<<< HEAD
=======

>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
          <button
            className="ai-button"
            onClick={() => onNavigate("assistant")}
          >
            Open Assistant
          </button>
        </section>

        {/* Recent Medical Activity */}
        <section className="recent-section">
          <div className="section-header">
            <h2>Recent Medical Activity</h2>
            <button
              className="view-all"
              onClick={() => onNavigate("medical-records")}
            >
              View All Records
            </button>
          </div>

          {loading && (
            <p style={{ padding: "20px", color: "#64748b" }}>Loading medical activities...</p>
          )}

<<<<<<< HEAD
          {!loading && recentActivities.length === 0 && (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748b" }}>
              <p style={{ fontSize: "15px", marginBottom: "12px" }}>
                No recent medical activity recorded yet.
              </p>
              <button
                className="ai-button"
                style={{ padding: "8px 16px", fontSize: "13px" }}
                onClick={() => onNavigate("appointments")}
              >
                📅 Schedule an Appointment
              </button>
            </div>
          )}

          {!loading &&
            recentActivities.slice(0, 5).map((activity) => (
              <div
                className="activity"
                key={activity.id}
                style={{ cursor: "pointer" }}
                onClick={() => onNavigate(activity.type === "record" ? "medical-records" : "appointments")}
              >
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-details">
                  <h4>{activity.title}</h4>
                  <p>{activity.subtitle}</p>
                </div>
                <span className="activity-date">{formatDate(activity.date)}</span>
              </div>
            ))}
=======
          {appointments.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              No appointments yet. Book one from the Appointments page.
            </p>
          ) : (
            appointments.slice(0, 5).map((appointment) => (
              <div className="activity" key={appointment.appointmentId}>
                <div className="activity-icon">🩺</div>

                <div className="activity-details">

                  <h4>
                    {appointment.doctorName || "Appointment"}
                  </h4>

                  <p>
                    {appointment.specialization || "Consultation"} —{" "}
                    {appointment.status}
                  </p>

                </div>

                <span className="activity-date">
                  {appointment.appointmentDate}
                </span>

              </div>
            ))
          )}

>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
        </section>
      </main>
    </div>
  );
}

const patientStyles = {
  detailsCardSection: {
    padding: "0 35px 20px",
  },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 3px 15px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e7edf3",
  },
  detailsCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "14px",
  },
  badgeIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    backgroundColor: "#e8f4f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },
  detailsCardTitle: {
    margin: "0 0 4px",
    fontSize: "17px",
    color: "#176b87",
    fontWeight: "bold",
  },
  detailsCardSubtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#64748b",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    backgroundColor: "#f8fafc",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #f1f5f9",
  },
  detailItemLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#64748b",
    fontWeight: "600",
  },
  detailItemValue: {
    fontSize: "14px",
    color: "#1e293b",
    overflowWrap: "anywhere",
  },
};

export default Dashboard;
