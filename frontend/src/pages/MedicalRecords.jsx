import { useState } from "react";

function MedicalRecords({ onNavigate }) {
  const [search, setSearch] = useState("");

  const records = [
    {
      id: 1,
      diagnosis: "Fever and Viral Infection",
      doctor: "Dr. John Smith",
      department: "General Medicine",
      date: "18 Aug 2026",
      treatment: "Paracetamol and rest",
      status: "Recovered",
    },
    {
      id: 2,
      diagnosis: "Skin Allergy",
      doctor: "Dr. Emily Johnson",
      department: "Dermatology",
      date: "12 Aug 2026",
      treatment: "Antihistamine medication",
      status: "Under Treatment",
    },
    {
      id: 3,
      diagnosis: "Migraine",
      doctor: "Dr. Sarah Wilson",
      department: "Neurology",
      date: "05 Aug 2026",
      treatment: "Pain relief medication",
      status: "Recovered",
    },
    {
      id: 4,
      diagnosis: "Back Pain",
      doctor: "Dr. David Miller",
      department: "Orthopedics",
      date: "28 Jul 2026",
      treatment: "Physiotherapy",
      status: "Under Treatment",
    },
  ];

  const filteredRecords = records.filter(
    (record) =>
      record.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      record.doctor.toLowerCase().includes(search.toLowerCase()) ||
      record.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="medical-records-page">

      {/* Header */}

      <div className="medical-records-header">

        <div>

          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>Medical Records</h1>

          <p>
            View and manage your medical history
          </p>

        </div>

      </div>


      {/* Search */}

      <div className="medical-record-search-section">

        <div className="medical-record-search-box">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search diagnosis, doctor or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

      </div>


      {/* Statistics */}

      <div className="medical-record-stats">

        <div className="medical-record-stat-card">

          <span className="medical-record-stat-icon">
            📋
          </span>

          <div>
            <p>Total Records</p>
            <h2>{records.length}</h2>
          </div>

        </div>


        <div className="medical-record-stat-card">

          <span className="medical-record-stat-icon">
            ❤️
          </span>

          <div>
            <p>Recovered</p>
            <h2>
              {
                records.filter(
                  (record) => record.status === "Recovered"
                ).length
              }
            </h2>
          </div>

        </div>


        <div className="medical-record-stat-card">

          <span className="medical-record-stat-icon">
            🩺
          </span>

          <div>
            <p>Under Treatment</p>
            <h2>
              {
                records.filter(
                  (record) =>
                    record.status === "Under Treatment"
                ).length
              }
            </h2>
          </div>

        </div>

      </div>


      {/* Medical Records List */}

      <section className="medical-records-section">

        <div className="medical-records-section-header">

          <div>

            <h2>Medical History</h2>

            <p>
              {filteredRecords.length} records found
            </p>

          </div>

        </div>


        <div className="medical-records-list">

          {filteredRecords.length > 0 ? (

            filteredRecords.map((record) => (

              <div
                className="medical-record-card"
                key={record.id}
              >

                {/* Record Header */}

                <div className="medical-record-card-header">

                  <div className="medical-record-icon">
                    🏥
                  </div>

                  <div className="medical-record-info">

                    <h3>
                      {record.diagnosis}
                    </h3>

                    <p>
                      {record.doctor} • {record.department}
                    </p>

                  </div>

                  <span
                    className={`medical-record-status ${
                      record.status === "Recovered"
                        ? "recovered"
                        : "treatment"
                    }`}
                  >
                    {record.status}
                  </span>

                </div>


                {/* Record Details */}

                <div className="medical-record-details">

                  <div>

                    <span>📅</span>

                    <div>
                      <strong>Date</strong>
                      <p>{record.date}</p>
                    </div>

                  </div>


                  <div>

                    <span>💊</span>

                    <div>
                      <strong>Treatment</strong>
                      <p>{record.treatment}</p>
                    </div>

                  </div>

                </div>


                {/* Footer */}

                <div className="medical-record-card-footer">

                  <span>
                    📋 Medical consultation record
                  </span>

                  <button className="view-record-button">
                    View Details
                  </button>

                </div>

              </div>

            ))

          ) : (

            <div className="no-medical-records">

              <div>📋</div>

              <h3>No medical records found</h3>

              <p>
                Try searching for a different diagnosis,
                doctor or department.
              </p>

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

export default MedicalRecords;