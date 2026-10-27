import { useEffect, useState } from "react";

import DoctorPatients from "./pages/DoctorPatients";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import Appointments from "./pages/Appointments";
import Doctors from "./pages/Doctors";
import Prescriptions from "./pages/Prescriptions";
import MedicalRecords from "./pages/MedicalRecords";
<<<<<<< HEAD
import DiseaseRiskAssessment from "./pages/DiseaseRiskAssessment";
import MedicineDirectory from "./pages/MedicineDirectory";
import PharmacyFinder from "./pages/PharmacyFinder";
import AiAssistant from "./pages/AiAssistant";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("token")
  );

=======
import Assistant from "./pages/Assistant";
import Profile from "./pages/Profile";

const SESSION_KEY = "ai_healthcare_session";

function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [session, setSession] = useState(readStoredSession);
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [bookingDraft, setBookingDraft] = useState(null);

  const handleLogin = (nextSession) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    } catch {
      // Ignore storage failures (for example, private browsing).
    }
    setSession(nextSession);
    setCurrentPage("dashboard");
  };

  const navigate = (page, payload) => {
    if (page === "logout") {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        // Ignore storage failures.
      }
      setSession(null);
      setCurrentPage("dashboard");
      setBookingDraft(null);
      return;
    }

    // Pages can hand off a doctor to the booking flow (for example from the
    // AI Assistant's recommended specialists).
    if (payload && payload.doctorId) {
      setBookingDraft(payload);
    }

    setCurrentPage(page);
  };

<<<<<<< HEAD
  // Read the currently logged-in user's details.
  const getSavedUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Unable to read saved user:", error);
      return null;
    }
  };

  const [currentUser, setCurrentUser] = useState(() => getSavedUser());
  const user = currentUser;

  // Handle navigation and logout.
  const handleNavigation = (page) => {
    if (page === "logout" || page === "login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      setCurrentUser(null);
      setIsLoggedIn(false);
      setCurrentPage("dashboard");
      return;
    }

    setCurrentPage(page);
  };

  // Show login when there is no token.
  if (!isLoggedIn || !localStorage.getItem("token")) {
    return (
      <Login
        onLogin={(userData) => {
          const resolved = userData || getSavedUser();
          setCurrentUser(resolved);
          setIsLoggedIn(true);
          setCurrentPage("dashboard");
        }}
      />
    );
=======
  // Login page
  if (!session) {
    return <Login onLogin={handleLogin} />;
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
  }

  // Show the appropriate dashboard based on the user's role.
  if (currentPage === "dashboard") {
    if (user?.role === "ADMIN") {
      return (
        <AdminDashboard onNavigate={handleNavigation} />
      );
    }

    if (user?.role === "DOCTOR") {
      return (
        <DoctorDashboard onNavigate={handleNavigation} />
      );
    }

    return (
      <Dashboard onNavigate={handleNavigation} />
    );
  }

  // Appointments Booking
  if (currentPage === "appointments") {
    return (
      <Appointments onNavigate={handleNavigation} defaultTab="appointments" />
    );
  }

  // Appointment Reminders
  if (currentPage === "reminders") {
    return (
      <Appointments onNavigate={handleNavigation} defaultTab="reminders" />
    );
  }

  // Doctors
  if (currentPage === "doctors") {
    return (
      <Doctors onNavigate={handleNavigation} />
    );
  }

  // Patients (Doctor / Admin only)
  if (currentPage === "patients") {
    return (
      <DoctorPatients onNavigate={handleNavigation} />
    );
  }

  // Prescriptions (Only accessible to Doctor and Admin; removed from Patient module)
  if (currentPage === "prescriptions") {
    if (user?.role !== "DOCTOR" && user?.role !== "ADMIN") {
      return <Dashboard onNavigate={handleNavigation} />;
    }
    return (
      <Prescriptions onNavigate={handleNavigation} />
    );
  }

  // Medical Records
  if (currentPage === "medical-records") {
    return (
      <MedicalRecords onNavigate={handleNavigation} />
    );
  }

  // Profile
  if (currentPage === "profile") {
    return (
      <ProfileView user={user} onNavigate={handleNavigation} />
    );
  }

  // Admin user management placeholder
  if (currentPage === "users") {
    return (
      <div style={styles.container}>
        <h2>User Management</h2>
        <p>Admin user management page will be added next.</p>

        <button onClick={() => handleNavigation("dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Unified AI Healthcare Assistant (Cards + Chatbot + In-Page Workflows)
  if (currentPage === "assistant") {
    return (
      <AiAssistant onNavigate={handleNavigation} />
    );
  }

  // Standalone Disease Risk Assessment
  if (currentPage === "disease-prediction" || currentPage === "risk-assessment") {
    return (
      <DiseaseRiskAssessment onNavigate={handleNavigation} />
    );
  }

  // Verified Medicine Directory & Drug Interactions
  if (currentPage === "medicines") {
    return (
      <MedicineDirectory onNavigate={handleNavigation} />
    );
  }

  // Nearby Pharmacy Suggestions & Stock Finder
  if (currentPage === "pharmacies") {
    return (
      <PharmacyFinder onNavigate={handleNavigation} />
    );
  }

  // Fallback for unknown page names.
  return (
<<<<<<< HEAD
    <div style={styles.container}>
      <h2>Page not found</h2>

      <button onClick={() => handleNavigation("dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}

function ProfileView({ user, onNavigate }) {
  const token = localStorage.getItem("token");
  const isPatient = user?.role !== "DOCTOR" && user?.role !== "ADMIN";

  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(isPatient);

  useEffect(() => {
    if (!isPatient || !token) return;

    const fetchPatientData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/patients", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const patients = await response.json();
          const matched = (Array.isArray(patients) ? patients : []).find(
            (p) =>
              (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
              (p.fullName && user.fullName && p.fullName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) ||
              String(p.patientId) === String(user.userId)
          );
          setPatientDetails(matched || null);
        }
      } catch (e) {
        console.error("Error fetching patient profile details:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [isPatient, token, user?.email, user?.fullName, user?.userId]);

  return (
    <div style={styles.profilePage}>
      <div style={styles.profileCard}>
        <div style={styles.profileIcon}>👤</div>

        <h2 style={styles.profileTitle}>
          {user?.role === "DOCTOR"
            ? "Doctor Profile"
            : user?.role === "ADMIN"
            ? "Administrator Profile"
            : "My Patient Profile"}
        </h2>

        <p style={styles.profileSubtitle}>
          {isPatient
            ? "Your complete patient information and demographic records"
            : "Your registered account information"}
        </p>

        <div style={styles.profileDetails}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Full Name</span>
            <span style={styles.detailValue}>
              {patientDetails?.fullName || user?.fullName || "Not available"}
            </span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Email Address</span>
            <span style={styles.detailValue}>
              {patientDetails?.email || user?.email || "Not available"}
            </span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Account Role</span>
            <span style={styles.roleBadge}>
              {user?.role || "PATIENT"}
            </span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>{isPatient ? "Patient ID" : "User ID"}</span>
            <span style={styles.detailValue}>
              #{patientDetails?.patientId || user?.userId || "N/A"}
            </span>
          </div>

          {isPatient && (
            <>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Blood Group</span>
                <span style={{ ...styles.detailValue, color: "#dc2626", fontWeight: "bold" }}>
                  🩸 {patientDetails?.bloodGroup || "O+"}
                </span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Age & Gender</span>
                <span style={styles.detailValue}>
                  {patientDetails?.age ? `${patientDetails.age} Years` : "N/A"} • {patientDetails?.gender || "N/A"}
                </span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Phone Number</span>
                <span style={styles.detailValue}>
                  📞 {patientDetails?.phone || "Not recorded"}
                </span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Residential Address</span>
                <span style={styles.detailValue}>
                  📍 {patientDetails?.address || "Registered hospital patient address"}
                </span>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          style={styles.backButton}
          onClick={() => onNavigate("dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    fontFamily: "Arial, sans-serif",
  },

  profilePage: {
    minHeight: "100vh",
    backgroundColor: "#f4f8fc",
    padding: "40px 20px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },

  profileCard: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "35px",
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 4px 18px rgba(0, 0, 0, 0.07)",
  },

  profileIcon: {
    width: "70px",
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5f6fa",
    borderRadius: "50%",
    fontSize: "34px",
    marginBottom: "18px",
  },

  profileTitle: {
    margin: "0 0 8px",
    color: "#172033",
    fontSize: "26px",
  },

  profileSubtitle: {
    margin: "0 0 28px",
    color: "#718096",
    fontSize: "14px",
  },

  profileDetails: {
    borderTop: "1px solid #e5edf3",
    marginBottom: "28px",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "10px",
    padding: "16px 0",
    borderBottom: "1px solid #e5edf3",
  },

  detailLabel: {
    color: "#718096",
    fontSize: "14px",
  },

  detailValue: {
    color: "#172033",
    fontSize: "14px",
    fontWeight: "bold",
    overflowWrap: "anywhere",
    textAlign: "right",
  },

  roleBadge: {
    backgroundColor: "#e5f6fa",
    color: "#087b9c",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  backButton: {
    padding: "12px 20px",
    backgroundColor: "#087b9c",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
};

=======
    <>
      {/* Dashboard */}
      {currentPage === "dashboard" && (
        <Dashboard
          onNavigate={navigate}
          token={session.token}
          fullName={session.fullName}
        />
      )}

      {/* Appointments */}
      {currentPage === "appointments" && (
        <Appointments
          onNavigate={navigate}
          token={session.token}
          initialDoctorId={bookingDraft ? bookingDraft.doctorId : null}
        />
      )}

      {/* Doctors */}
      {currentPage === "doctors" && (
        <Doctors onNavigate={navigate} token={session.token} />
      )}

      {/* Patient Profile */}
      {currentPage === "profile" && (
        <Profile onNavigate={navigate} token={session.token} />
      )}

      {/* Prescriptions */}
      {currentPage === "prescriptions" && (
        <Prescriptions onNavigate={navigate} />
      )}

      {/* Medical Records */}
      {currentPage === "medical-records" && (
        <MedicalRecords onNavigate={navigate} />
      )}

      {/* AI Assistant */}
      {currentPage === "assistant" && (
        <Assistant onNavigate={navigate} token={session.token} />
      )}
    </>
  );
}

>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
export default App;
