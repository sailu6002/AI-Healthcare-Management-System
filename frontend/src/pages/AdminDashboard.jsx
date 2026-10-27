import { useEffect, useState } from "react";

function AdminDashboard({ onNavigate }) {
  const user = JSON.parse(localStorage.getItem("user"));

  const [userCount, setUserCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Users
        const usersResponse = await fetch(
          "http://localhost:8080/api/admin/users",
          {
            method: "GET",
            headers,
          }
        );

        if (usersResponse.ok) {
          const users = await usersResponse.json();
          setUserCount(users.length);

          const doctors = users.filter(
            (item) => item.role === "DOCTOR"
          );

          setDoctorCount(doctors.length);
        }

        // Appointments
        const appointmentsResponse = await fetch(
          "http://localhost:8080/api/appointments",
          {
            method: "GET",
            headers,
          }
        );

        if (appointmentsResponse.ok) {
          const appointments = await appointmentsResponse.json();
          setAppointmentCount(appointments.length);
        }

      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="sidebar-icon">
            🏥
          </div>

          <div>
            <h2>AI Healthcare</h2>
            <p>Management System</p>
          </div>

        </div>

        <nav className="sidebar-menu">

          <button
            className="menu-item active"
            onClick={() => onNavigate("dashboard")}
          >
            <span>🏠</span>
            Dashboard
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("users")}
          >
            <span>👥</span>
            Users
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("doctors")}
          >
            <span>👨‍⚕️</span>
            Doctors
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("appointments")}
          >
            <span>📅</span>
            Appointments
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("medical-records")}
          >
            <span>🧪</span>
            Medical Records
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("prescriptions")}
          >
            <span>💊</span>
            Prescriptions
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("assistant")}
          >
            <span>🤖</span>
            AI Assistant
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("medicines")}
          >
            <span>💊</span>
            Medicine Safety
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("pharmacies")}
          >
            <span>📍</span>
            Nearby Pharmacies
          </button>

          <button
            className="menu-item"
            onClick={() => onNavigate("profile")}
          >
            <span>👤</span>
            Profile
          </button>

        </nav>

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

        {/* Header */}
        <header className="dashboard-topbar">

          <div>
            <h1>Admin Dashboard</h1>

            <p>
              Manage users, doctors, appointments and healthcare records.
            </p>
          </div>

          <div className="patient-profile">

            <div className="patient-avatar">
              🛡️
            </div>

            <div>

              <strong>
                {user?.fullName || "Administrator"}
              </strong>

              <small>
                Admin Account
              </small>

            </div>

          </div>

        </header>

        {/* Welcome */}
        <section className="welcome-section">

          <h2>
            Welcome, {user?.fullName || "Administrator"}! 👋
          </h2>

          <p>
            Monitor and manage the AI Healthcare Management System.
          </p>

        </section>

        {/* Statistics */}
        <section className="dashboard-cards">

          {/* Users */}
          <div className="dashboard-card">

            <div className="card-icon">
              👥
            </div>

            <div>

              <h3>Total Users</h3>

              <p className="card-number">
                {userCount}
              </p>

              <span>
                Registered users
              </span>

            </div>

          </div>

          {/* Doctors */}
          <div className="dashboard-card">

            <div className="card-icon">
              👨‍⚕️
            </div>

            <div>

              <h3>Doctors</h3>

              <p className="card-number">
                {doctorCount}
              </p>

              <span>
                Registered doctors
              </span>

            </div>

          </div>

          {/* Appointments */}
          <div className="dashboard-card">

            <div className="card-icon">
              📅
            </div>

            <div>

              <h3>Appointments</h3>

              <p className="card-number">
                {appointmentCount}
              </p>

              <span>
                Total appointments
              </span>

            </div>

          </div>

          {/* System */}
          <div className="dashboard-card">

            <div className="card-icon">
              ⚙️
            </div>

            <div>

              <h3>System</h3>

              <p className="card-number">
                Active
              </p>

              <span>
                System status
              </span>

            </div>

          </div>

        </section>

        {/* Admin Management */}
        <section className="ai-section">

          <div className="ai-content">

            <div className="ai-icon">
              🛡️
            </div>

            <div>

              <h2>System Administration</h2>

              <p>
                Manage users, doctors, appointments and healthcare
                information from the administration dashboard.
              </p>

            </div>

          </div>

          <button
            className="ai-button"
            onClick={() => onNavigate("users")}
          >
            Manage Users
          </button>

        </section>

        {/* Quick Actions */}
        <section className="recent-section">

          <div className="section-header">

            <h2>Quick Actions</h2>

          </div>

          <div className="activity">

            <div className="activity-icon">
              👥
            </div>

            <div className="activity-details">

              <h4>User Management</h4>

              <p>
                View and manage registered users.
              </p>

            </div>

            <button
              className="view-all"
              onClick={() => onNavigate("users")}
            >
              Manage
            </button>

          </div>

          <div className="activity">

            <div className="activity-icon">
              👨‍⚕️
            </div>

            <div className="activity-details">

              <h4>Doctor Management</h4>

              <p>
                View registered doctors and their information.
              </p>

            </div>

            <button
              className="view-all"
              onClick={() => onNavigate("doctors")}
            >
              View
            </button>

          </div>

          <div className="activity">

            <div className="activity-icon">
              📅
            </div>

            <div className="activity-details">

              <h4>Appointment Management</h4>

              <p>
                Monitor all appointments in the system.
              </p>

            </div>

            <button
              className="view-all"
              onClick={() => onNavigate("appointments")}
            >
              View
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;
