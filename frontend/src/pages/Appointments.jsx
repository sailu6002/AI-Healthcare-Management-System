import { useState } from "react";

function Appointments({ onNavigate }) {
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const [appointments, setAppointments] = useState([
    {
      doctor: "Dr. John Smith",
      department: "General Medicine",
      date: "20 Aug 2026",
      time: "10:00 AM",
      icon: "👨‍⚕️",
    },
    {
      doctor: "Dr. Emily Johnson",
      department: "Dermatology",
      date: "25 Aug 2026",
      time: "02:00 PM",
      icon: "👩‍⚕️",
    },
  ]);

  const handleBookAppointment = () => {
    if (!department || !doctor || !date || !time) {
      alert("Please select Department, Doctor, Date and Time.");
      return;
    }

    const formattedDate = new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newAppointment = {
      doctor: doctor,
      department: department,
      date: formattedDate,
      time: time,
      icon: doctor.includes("Emily") ? "👩‍⚕️" : "👨‍⚕️",
    };

    setAppointments([...appointments, newAppointment]);

    setDepartment("");
    setDoctor("");
    setDate("");
    setTime("");

    alert("Appointment booked successfully!");
  };

  return (
    <div className="page-container">

      {/* Page Header */}

      <div className="page-header">

        <div>

          {/* Back to Dashboard Button */}
          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>Appointments</h1>

          <p>
            Manage your doctor appointments
          </p>

        </div>

        <button className="primary-button">
          + Book Appointment
        </button>

      </div>


      {/* Appointment Statistics */}

      <div className="appointment-stats">

        <div className="stat-card">
          <span className="stat-icon">📅</span>

          <div>
            <p>Upcoming</p>
            <h2>{appointments.length}</h2>
          </div>
        </div>


        <div className="stat-card">
          <span className="stat-icon">✅</span>

          <div>
            <p>Completed</p>
            <h2>8</h2>
          </div>
        </div>


        <div className="stat-card">
          <span className="stat-icon">❌</span>

          <div>
            <p>Cancelled</p>
            <h2>1</h2>
          </div>
        </div>

      </div>


      {/* Book Appointment */}

      <section className="appointment-form-card">

        <h2>Book New Appointment</h2>

        <p className="form-description">
          Select a doctor and preferred appointment time.
        </p>


        <div className="appointment-form">

          {/* Department */}

          <div className="form-group">

            <label>Department</label>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >

              <option value="">
                Select Department
              </option>

              <option value="General Medicine">
                General Medicine
              </option>

              <option value="Cardiology">
                Cardiology
              </option>

              <option value="Dermatology">
                Dermatology
              </option>

              <option value="Neurology">
                Neurology
              </option>

              <option value="Orthopedics">
                Orthopedics
              </option>

            </select>

          </div>


          {/* Doctor */}

          <div className="form-group">

            <label>Doctor</label>

            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            >

              <option value="">
                Select Doctor
              </option>

              <option value="Dr. John Smith">
                Dr. John Smith
              </option>

              <option value="Dr. Emily Johnson">
                Dr. Emily Johnson
              </option>

              <option value="Dr. Michael Brown">
                Dr. Michael Brown
              </option>

            </select>

          </div>


          {/* Date */}

          <div className="form-group">

            <label>Date</label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

          </div>


          {/* Time */}

          <div className="form-group">

            <label>Preferred Time</label>

            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >

              <option value="">
                Select Time
              </option>

              <option value="09:00 AM">
                09:00 AM
              </option>

              <option value="10:00 AM">
                10:00 AM
              </option>

              <option value="11:00 AM">
                11:00 AM
              </option>

              <option value="02:00 PM">
                02:00 PM
              </option>

              <option value="04:00 PM">
                04:00 PM
              </option>

            </select>

          </div>

        </div>


        <button
          className="primary-button book-button"
          onClick={handleBookAppointment}
        >
          Book Appointment
        </button>

      </section>


      {/* Upcoming Appointments */}

      <section className="appointments-list">

        <div className="section-title">

          <h2>
            Upcoming Appointments
          </h2>

          <button className="view-all">
            View All
          </button>

        </div>


        {/* Appointment List */}

        {appointments.map((appointment, index) => (

          <div
            className="appointment-item"
            key={index}
          >

            <div className="doctor-icon">
              {appointment.icon}
            </div>


            <div className="doctor-info">

              <h3>
                {appointment.doctor}
              </h3>

              <p>
                {appointment.department}
              </p>

            </div>


            <div className="appointment-date">

              <strong>
                {appointment.date}
              </strong>

              <span>
                {appointment.time}
              </span>

            </div>


            <span className="status upcoming">
              Upcoming
            </span>

          </div>

        ))}

      </section>

    </div>
  );
}

export default Appointments;