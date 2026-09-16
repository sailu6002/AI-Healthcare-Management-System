import { useState } from "react";

function Prescriptions({ onNavigate }) {
  const [search, setSearch] = useState("");

  const prescriptions = [
    {
      id: 1,
      medicine: "Paracetamol 500mg",
      doctor: "Dr. John Smith",
      purpose: "Fever and body pain",
      dosage: "1 tablet",
      frequency: "Twice a day",
      duration: "5 Days",
      date: "18 Aug 2026",
      status: "Active",
    },
    {
      id: 2,
      medicine: "Cetirizine 10mg",
      doctor: "Dr. Emily Johnson",
      purpose: "Allergy",
      dosage: "1 tablet",
      frequency: "Once a day",
      duration: "7 Days",
      date: "15 Aug 2026",
      status: "Active",
    },
    {
      id: 3,
      medicine: "Vitamin D3",
      doctor: "Dr. Sarah Wilson",
      purpose: "Vitamin deficiency",
      dosage: "1 capsule",
      frequency: "Once a week",
      duration: "4 Weeks",
      date: "10 Aug 2026",
      status: "Completed",
    },
  ];

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.medicine
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      prescription.doctor
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      prescription.purpose
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="prescriptions-page">

      {/* Header */}

      <div className="prescriptions-header">

        <div>

          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>Prescriptions</h1>

          <p>
            View and manage your prescribed medicines
          </p>

        </div>

      </div>


      {/* Search */}

      <div className="prescription-search-section">

        <div className="prescription-search-box">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search medicine, doctor or purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

      </div>


      {/* Summary */}

      <div className="prescription-stats">

        <div className="prescription-stat-card">

          <span className="prescription-stat-icon">
            💊
          </span>

          <div>
            <p>Total Prescriptions</p>
            <h2>{prescriptions.length}</h2>
          </div>

        </div>


        <div className="prescription-stat-card">

          <span className="prescription-stat-icon">
            🟢
          </span>

          <div>
            <p>Active</p>
            <h2>
              {
                prescriptions.filter(
                  (item) => item.status === "Active"
                ).length
              }
            </h2>
          </div>

        </div>


        <div className="prescription-stat-card">

          <span className="prescription-stat-icon">
            ✅
          </span>

          <div>
            <p>Completed</p>
            <h2>
              {
                prescriptions.filter(
                  (item) => item.status === "Completed"
                ).length
              }
            </h2>
          </div>

        </div>

      </div>


      {/* Prescription List */}

      <div className="prescriptions-section">

        <div className="prescriptions-section-header">

          <div>
            <h2>My Prescriptions</h2>

            <p>
              {filteredPrescriptions.length} prescriptions found
            </p>
          </div>

        </div>


        <div className="prescriptions-list">

          {filteredPrescriptions.length > 0 ? (

            filteredPrescriptions.map((prescription) => (

              <div
                className="prescription-card"
                key={prescription.id}
              >

                {/* Medicine Header */}

                <div className="prescription-card-header">

                  <div className="medicine-icon">
                    💊
                  </div>

                  <div className="medicine-info">

                    <h3>
                      {prescription.medicine}
                    </h3>

                    <p>
                      Prescribed by {prescription.doctor}
                    </p>

                  </div>

                  <span
                    className={`prescription-status ${
                      prescription.status === "Active"
                        ? "active"
                        : "completed"
                    }`}
                  >
                    {prescription.status}
                  </span>

                </div>


                {/* Prescription Details */}

                <div className="prescription-details">

                  <div>
                    <span>🎯</span>
                    <strong>Purpose</strong>
                    <p>{prescription.purpose}</p>
                  </div>

                  <div>
                    <span>💊</span>
                    <strong>Dosage</strong>
                    <p>{prescription.dosage}</p>
                  </div>

                  <div>
                    <span>🕐</span>
                    <strong>Frequency</strong>
                    <p>{prescription.frequency}</p>
                  </div>

                  <div>
                    <span>📅</span>
                    <strong>Duration</strong>
                    <p>{prescription.duration}</p>
                  </div>

                </div>


                {/* Footer */}

                <div className="prescription-card-footer">

                  <span>
                    📋 Prescribed on {prescription.date}
                  </span>

                  <button className="view-prescription-button">
                    View Details
                  </button>

                </div>

              </div>

            ))

          ) : (

            <div className="no-prescriptions">

              <div>💊</div>

              <h3>No prescriptions found</h3>

              <p>
                Try searching for a different medicine or doctor.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default Prescriptions;