import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Doctors from "./pages/Doctors";
import Prescriptions from "./pages/Prescriptions";
import MedicalRecords from "./pages/MedicalRecords";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Login page
  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => {
          setIsLoggedIn(true);
          setCurrentPage("dashboard");
        }}
      />
    );
  }

  // Page navigation
  return (
    <>
      {/* Dashboard */}
      {currentPage === "dashboard" && (
        <Dashboard onNavigate={setCurrentPage} />
      )}

      {/* Appointments */}
      {currentPage === "appointments" && (
        <Appointments onNavigate={setCurrentPage} />
      )}

      {/* Doctors */}
      {currentPage === "doctors" && (
        <Doctors onNavigate={setCurrentPage} />
      )}

      {/* Prescriptions */}
      {currentPage === "prescriptions" && (
        <Prescriptions onNavigate={setCurrentPage} />
      )}

      {/* Medical Records */}
      {currentPage === "medical-records" && (
        <MedicalRecords onNavigate={setCurrentPage} />
      )}
    </>
  );
}

export default App;