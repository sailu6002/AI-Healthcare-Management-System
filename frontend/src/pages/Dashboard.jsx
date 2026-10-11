import { useEffect, useState } from "react";
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


          {/* Doctors */}
          <button
            className="menu-item"
            onClick={() => onNavigate("doctors")}
          >
            <span>👨‍⚕️</span>
            Doctors
          </button>


          {/* Prescriptions */}
          <button
            className="menu-item"
            onClick={() => onNavigate("prescriptions")}
          >
            <span>💊</span>
            Prescriptions
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
            <h1>Dashboard</h1>

            <p>
              Welcome back! Here's your health overview.
            </p>
          </div>


          <div className="patient-profile">

            <div className="patient-avatar">
              👤
            </div>

            <div>
              <strong>{fullName || "Patient"}</strong>
              <small>Patient Account</small>
            </div>

          </div>

        </header>


        {/* Welcome */}
        <section className="welcome-section">

          <h2>
            Good Morning, {fullName || "Patient"}! 👋
          </h2>

          <p>
            Take care of your health with AI-powered healthcare.
          </p>

        </section>


        {/* Statistics Cards */}
        <section className="dashboard-cards">

          <div className="dashboard-card">

            <div className="card-icon">
              📅
            </div>

            <div>
              <h3>Appointments</h3>
              <p className="card-number">
                {appointmentsLoaded ? upcoming.length : "…"}
              </p>
              <span>Upcoming appointments</span>
            </div>

          </div>


          <div className="dashboard-card">

            <div className="card-icon">
              💊
            </div>

            <div>
              <h3>Prescriptions</h3>
              <p className="card-number">3</p>
              <span>Active prescriptions</span>
            </div>

          </div>


          <div className="dashboard-card">

            <div className="card-icon">
              🧪
            </div>

            <div>
              <h3>Medical Reports</h3>
              <p className="card-number">5</p>
              <span>Available reports</span>
            </div>

          </div>


          <div className="dashboard-card">

            <div className="card-icon">
              ❤️
            </div>

            <div>
              <h3>Health Status</h3>
              <p className="card-number">Good</p>
              <span>Overall health status</span>
            </div>

          </div>

        </section>


        {/* AI Assistant */}
        <section className="ai-section">

          <div className="ai-content">

            <div className="ai-icon">
              🤖
            </div>

            <div>

              <h2>AI Health Assistant</h2>

              <p>
                Get AI-powered health insights and assistance
                based on your health information.
              </p>

            </div>

          </div>


          <button
            className="ai-button"
            onClick={() => onNavigate("assistant")}
          >
            Open Assistant
          </button>

        </section>


        {/* Recent Activity */}
        <section className="recent-section">

          <div className="section-header">

            <h2>Recent Medical Activity</h2>

            <button className="view-all">
              View All
            </button>

          </div>


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

        </section>

      </main>

    </div>
  );
}

export default Dashboard;