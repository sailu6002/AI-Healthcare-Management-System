import { useState } from "react";

function Doctors({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");

  const doctors = [
    {
      name: "Dr. John Smith",
      department: "General Medicine",
      specialization: "General Physician",
      experience: "12 Years",
      availability: "Available Today",
      icon: "👨‍⚕️",
    },
    {
      name: "Dr. Emily Johnson",
      department: "Dermatology",
      specialization: "Skin Specialist",
      experience: "9 Years",
      availability: "Available Today",
      icon: "👩‍⚕️",
    },
    {
      name: "Dr. Michael Brown",
      department: "Cardiology",
      specialization: "Heart Specialist",
      experience: "15 Years",
      availability: "Available Tomorrow",
      icon: "👨‍⚕️",
    },
    {
      name: "Dr. Sarah Wilson",
      department: "Neurology",
      specialization: "Neurologist",
      experience: "10 Years",
      availability: "Available Today",
      icon: "👩‍⚕️",
    },
    {
      name: "Dr. David Miller",
      department: "Orthopedics",
      specialization: "Orthopedic Specialist",
      experience: "11 Years",
      availability: "Available Tomorrow",
      icon: "👨‍⚕️",
    },
    {
      name: "Dr. Jessica Taylor",
      department: "General Medicine",
      specialization: "General Physician",
      experience: "8 Years",
      availability: "Available Today",
      icon: "👩‍⚕️",
    },
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(search.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      department === "All" || doctor.department === department;

    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="doctors-page">

      {/* Header */}
      <div className="doctors-header">

        <div>
          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>Doctors</h1>
          <p>Find and connect with healthcare professionals</p>
        </div>

      </div>

      {/* Search and Filter */}
      <div className="doctor-search-section">

        <div className="doctor-search-box">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search doctor or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="doctor-filter"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="All">All Departments</option>
          <option value="General Medicine">General Medicine</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Dermatology">Dermatology</option>
          <option value="Neurology">Neurology</option>
          <option value="Orthopedics">Orthopedics</option>
        </select>

      </div>

      {/* Doctor Count */}
      <div className="doctor-results">
        <h2>Available Doctors</h2>
        <span>{filteredDoctors.length} doctors found</span>
      </div>

      {/* Doctors Grid */}
      <div className="doctors-grid">

        {filteredDoctors.length > 0 ? (

          filteredDoctors.map((doctor, index) => (

            <div className="doctor-card" key={index}>

              <div className="doctor-card-top">

                <div className="doctor-avatar">
                  {doctor.icon}
                </div>

                <span className="doctor-status">
                  ● Available
                </span>

              </div>

              <div className="doctor-card-info">

                <h3>{doctor.name}</h3>

                <p className="doctor-specialization">
                  {doctor.specialization}
                </p>

                <p className="doctor-department">
                  🏥 {doctor.department}
                </p>

                <p className="doctor-experience">
                  ⭐ {doctor.experience} experience
                </p>

              </div>

              <div className="doctor-availability">
                <span>📅</span>
                {doctor.availability}
              </div>

              <button
                className="doctor-book-button"
                onClick={() => onNavigate("appointments")}
              >
                Book Appointment
              </button>

            </div>

          ))

        ) : (

          <div className="no-doctors">

            <div>🔍</div>

            <h3>No doctors found</h3>

            <p>
              Try changing your search or department filter.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}

export default Doctors;