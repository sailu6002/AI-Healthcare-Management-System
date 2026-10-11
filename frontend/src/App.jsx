import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Doctors from "./pages/Doctors";
import Prescriptions from "./pages/Prescriptions";
import MedicalRecords from "./pages/MedicalRecords";
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

  // Login page
  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  // Page navigation
  return (
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

export default App;
