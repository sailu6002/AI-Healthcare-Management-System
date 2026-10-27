import { useEffect, useState } from "react";

function Prescriptions({ onNavigate }) {
  const [search, setSearch] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [expandedPrescriptionId, setExpandedPrescriptionId] =
    useState(null);

  const [editingPrescriptionId, setEditingPrescriptionId] =
    useState(null);

  const [showAddForm, setShowAddForm] = useState(false);

  const [editForm, setEditForm] = useState({
    medicine: "",
    purpose: "",
    dosage: "",
    frequency: "",
    duration: "",
    status: "",
  });

  const [newPrescription, setNewPrescription] = useState({
    doctorId: "",
    medicine: "",
    purpose: "",
    dosage: "",
    frequency: "",
    duration: "",
    prescriptionDate: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // ==============================
  // FETCH PRESCRIPTIONS + DOCTORS
  // ==============================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          prescriptionsResponse,
          doctorsResponse,
        ] = await Promise.all([
          fetch(
            `http://localhost:8080/api/prescriptions/patient/${user?.patientId || user?.userId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),

          fetch("http://localhost:8080/api/doctors", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!prescriptionsResponse.ok) {
          throw new Error("Failed to fetch prescriptions");
        }

        if (!doctorsResponse.ok) {
          throw new Error("Failed to fetch doctors");
        }

        const prescriptionData =
          await prescriptionsResponse.json();

        const doctorData =
          await doctorsResponse.json();

        setPrescriptions(prescriptionData);
        setDoctors(doctorData);

        console.log(
          "Prescriptions:",
          prescriptionData
        );

        console.log("Doctors:", doctorData);
      } catch (error) {
        console.error(
          "Error fetching data:",
          error
        );

        setError("Unable to load prescriptions.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId && token) {
      fetchData();
    } else {
      setLoading(false);
      setError(
        "User information not found. Please login again."
      );
    }
  }, [user?.userId, token]);

  // ==============================
  // GET DOCTOR NAME
  // ==============================

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(
      (item) =>
        String(item.doctorId) ===
        String(doctorId)
    );

    return doctor
      ? doctor.fullName
      : `Doctor ID ${doctorId}`;
  };

  // ==============================
  // FORMAT DATE
  // ==============================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const dateObject = new Date(
      dateValue + "T00:00:00"
    );

    return dateObject.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==============================
  // SEARCH
  // ==============================

  const filteredPrescriptions =
    prescriptions.filter((prescription) => {
      const medicine =
        prescription.medicine?.toLowerCase() || "";

      const doctor = getDoctorName(
        prescription.doctorId
      ).toLowerCase();

      const purpose =
        prescription.purpose?.toLowerCase() || "";

      const searchValue =
        search.toLowerCase();

      return (
        medicine.includes(searchValue) ||
        doctor.includes(searchValue) ||
        purpose.includes(searchValue)
      );
    });

  // ==============================
  // COUNTS
  // ==============================

  const activeCount =
    prescriptions.filter(
      (item) => item.status === "Active"
    ).length;

  const completedCount =
    prescriptions.filter(
      (item) => item.status === "Completed"
    ).length;

  // ==============================
  // VIEW DETAILS
  // ==============================

  const handleViewDetails = (prescriptionId) => {
    if (
      expandedPrescriptionId ===
      prescriptionId
    ) {
      setExpandedPrescriptionId(null);
      setEditingPrescriptionId(null);
    } else {
      setExpandedPrescriptionId(
        prescriptionId
      );
      setEditingPrescriptionId(null);
    }
  };

  // ==============================
  // START EDIT
  // ==============================

  const handleEdit = (prescription) => {
    setEditingPrescriptionId(
      prescription.prescriptionId
    );

    setExpandedPrescriptionId(
      prescription.prescriptionId
    );

    setEditForm({
      medicine: prescription.medicine || "",
      purpose: prescription.purpose || "",
      dosage: prescription.dosage || "",
      frequency:
        prescription.frequency || "",
      duration:
        prescription.duration || "",
      status: prescription.status || "",
    });
  };

  // ==============================
  // HANDLE EDIT INPUT
  // ==============================

  const handleEditChange = (event) => {
    const { name, value } =
      event.target;

    setEditForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // ==============================
  // SAVE EDIT
  // ==============================

  const handleSaveChanges = async (
    prescription
  ) => {
    try {
      setSaving(true);

      const updatedPrescription = {
        patientId:
          prescription.patientId,

        doctorId:
          prescription.doctorId,

        medicine:
          editForm.medicine,

        purpose:
          editForm.purpose,

        dosage:
          editForm.dosage,

        frequency:
          editForm.frequency,

        duration:
          editForm.duration,

        prescriptionDate:
          prescription.prescriptionDate,

        status:
          editForm.status,
      };

      console.log(
        "Updating prescription:",
        updatedPrescription
      );

      const response = await fetch(
        `http://localhost:8080/api/prescriptions/${prescription.prescriptionId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            updatedPrescription
          ),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Update failed:",
          errorText
        );

        alert(
          "Failed to update prescription."
        );

        return;
      }

      const updatedData =
        await response.json();

      console.log(
        "Prescription updated:",
        updatedData
      );

      setPrescriptions(
        (previousPrescriptions) =>
          previousPrescriptions.map(
            (item) =>
              item.prescriptionId ===
              updatedData.prescriptionId
                ? updatedData
                : item
          )
      );

      setEditingPrescriptionId(null);

      alert(
        "Prescription updated successfully!"
      );
    } catch (error) {
      console.error(
        "Error updating prescription:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // CANCEL EDIT
  // ==============================

  const handleCancelEdit = () => {
    setEditingPrescriptionId(null);
  };

  // ==============================
  // OPEN ADD FORM
  // ==============================

  const handleOpenAddForm = () => {
    setShowAddForm(true);

    setNewPrescription({
      doctorId: "",
      medicine: "",
      purpose: "",
      dosage: "",
      frequency: "",
      duration: "",
      prescriptionDate:
        new Date()
          .toISOString()
          .split("T")[0],
      status: "Active",
    });
  };

  // ==============================
  // HANDLE ADD INPUT
  // ==============================

  const handleNewPrescriptionChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setNewPrescription(
      (previousForm) => ({
        ...previousForm,
        [name]: value,
      })
    );
  };

  // ==============================
  // ADD NEW PRESCRIPTION
  // ==============================

  const handleAddPrescription = async (
    event
  ) => {
    event.preventDefault();

    if (
      !newPrescription.doctorId ||
      !newPrescription.medicine ||
      !newPrescription.purpose ||
      !newPrescription.dosage ||
      !newPrescription.frequency ||
      !newPrescription.duration ||
      !newPrescription.prescriptionDate
    ) {
      alert(
        "Please fill all prescription details."
      );

      return;
    }

    try {
      setAdding(true);

      const prescriptionData = {
        patientId: user?.patientId || user.userId,

        doctorId:
          Number(newPrescription.doctorId),

        medicine:
          newPrescription.medicine,

        purpose:
          newPrescription.purpose,

        dosage:
          newPrescription.dosage,

        frequency:
          newPrescription.frequency,

        duration:
          newPrescription.duration,

        prescriptionDate:
          newPrescription.prescriptionDate,

        status:
          newPrescription.status,
      };

      console.log(
        "Adding prescription:",
        prescriptionData
      );

      const response = await fetch(
        "http://localhost:8080/api/prescriptions",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            prescriptionData
          ),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Add prescription failed:",
          errorText
        );

        alert(
          "Failed to add prescription."
        );

        return;
      }

      const createdPrescription =
        await response.json();

      console.log(
        "New prescription created:",
        createdPrescription
      );

      setPrescriptions(
        (previousPrescriptions) => [
          ...previousPrescriptions,
          createdPrescription,
        ]
      );

      setShowAddForm(false);

      setNewPrescription({
        doctorId: "",
        medicine: "",
        purpose: "",
        dosage: "",
        frequency: "",
        duration: "",
        prescriptionDate: "",
        status: "Active",
      });

      alert(
        "New prescription added successfully!"
      );
    } catch (error) {
      console.error(
        "Error adding prescription:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setAdding(false);
    }
  };

  // ==============================
  // DELETE PRESCRIPTION
  // ==============================

  const handleDeletePrescription = async (
    prescription
  ) => {
    const confirmDelete =
      window.confirm(
        `Are you sure you want to remove "${prescription.medicine}"?`
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(
        prescription.prescriptionId
      );

      const response = await fetch(
        `http://localhost:8080/api/prescriptions/${prescription.prescriptionId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Delete failed:",
          errorText
        );

        alert(
          "Failed to delete prescription."
        );

        return;
      }

      setPrescriptions(
        (previousPrescriptions) =>
          previousPrescriptions.filter(
            (item) =>
              item.prescriptionId !==
              prescription.prescriptionId
          )
      );

      if (
        expandedPrescriptionId ===
        prescription.prescriptionId
      ) {
        setExpandedPrescriptionId(null);
      }

      if (
        editingPrescriptionId ===
        prescription.prescriptionId
      ) {
        setEditingPrescriptionId(null);
      }

      alert(
        "Prescription removed successfully!"
      );
    } catch (error) {
      console.error(
        "Error deleting prescription:",
        error
      );

      alert(
        "Unable to connect to the backend."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="prescriptions-page">

      {/* ==============================
          HEADER
      ============================== */}

      <div className="prescriptions-header">
        <div>
          <button
            className="back-button"
            onClick={() =>
              onNavigate("dashboard")
            }
          >
            ← Back to Dashboard
          </button>

          <h1>Prescriptions</h1>

          <p>
            View and manage your prescribed
            medicines
          </p>
        </div>

        <button
          className="primary-button"
          onClick={handleOpenAddForm}
        >
          + New Prescription
        </button>
      </div>

      {/* ==============================
          ADD NEW PRESCRIPTION FORM
      ============================== */}

      {showAddForm && (
        <div className="new-prescription-card">

          <div className="new-prescription-header">
            <div>
              <h2>New Prescription</h2>

              <p>
                Add a new medicine to the
                patient's prescriptions.
              </p>
            </div>

            <button
              className="close-add-button"
              onClick={() =>
                setShowAddForm(false)
              }
            >
              ✕
            </button>
          </div>

          <form
            className="new-prescription-form"
            onSubmit={
              handleAddPrescription
            }
          >

            {/* Doctor */}

            <div className="add-field">
              <label>Doctor</label>

              <select
                name="doctorId"
                value={
                  newPrescription.doctorId
                }
                onChange={
                  handleNewPrescriptionChange
                }
              >
                <option value="">
                  Select Doctor
                </option>

                {doctors.map((doctor) => (
                  <option
                    key={doctor.doctorId}
                    value={doctor.doctorId}
                  >
                    {doctor.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Medicine */}

            <div className="add-field">
              <label>Medicine</label>

              <input
                type="text"
                name="medicine"
                placeholder="Example: Paracetamol 500mg"
                value={
                  newPrescription.medicine
                }
                onChange={
                  handleNewPrescriptionChange
                }
              />
            </div>

            {/* Purpose */}

            <div className="add-field">
              <label>Purpose</label>

              <input
                type="text"
                name="purpose"
                placeholder="Example: Fever and body pain"
                value={
                  newPrescription.purpose
                }
                onChange={
                  handleNewPrescriptionChange
                }
              />
            </div>

            {/* Dosage */}

            <div className="add-field">
              <label>Dosage</label>

              <input
                type="text"
                name="dosage"
                placeholder="Example: 1 tablet"
                value={
                  newPrescription.dosage
                }
                onChange={
                  handleNewPrescriptionChange
                }
              />
            </div>

            {/* Frequency */}

            <div className="add-field">
              <label>Frequency</label>

              <input
                type="text"
                name="frequency"
                placeholder="Example: Twice a day"
                value={
                  newPrescription.frequency
                }
                onChange={
                  handleNewPrescriptionChange
                }
              />
            </div>

            {/* Duration */}

            <div className="add-field">
              <label>Duration</label>

              <input
                type="text"
                name="duration"
                placeholder="Example: 5 Days"
                value={
                  newPrescription.duration
                }
                onChange={
                  handleNewPrescriptionChange
                }
              />
            </div>

            {/* Prescription Date */}

            <div className="add-field">
              <label>
                Prescription Date
              </label>

              <input
                type="date"
                name="prescriptionDate"
                value={
                  newPrescription.prescriptionDate
                }
                onChange={
                  handleNewPrescriptionChange
                }
              />
            </div>

            {/* Status */}

            <div className="add-field">
              <label>Status</label>

              <select
                name="status"
                value={
                  newPrescription.status
                }
                onChange={
                  handleNewPrescriptionChange
                }
              >
                <option value="Active">
                  Active
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>
            </div>

            {/* Buttons */}

            <div className="new-prescription-actions">

              <button
                type="submit"
                className="save-prescription-button"
                disabled={adding}
              >
                {adding
                  ? "Adding..."
                  : "Add Prescription"}
              </button>

              <button
                type="button"
                className="cancel-edit-button"
                onClick={() =>
                  setShowAddForm(false)
                }
                disabled={adding}
              >
                Cancel
              </button>

            </div>

          </form>
        </div>
      )}

      {/* ==============================
          SEARCH
      ============================== */}

      <div className="prescription-search-section">

        <div className="prescription-search-box">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search medicine, doctor or purpose..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>

      {/* ==============================
          STATISTICS
      ============================== */}

      <div className="prescription-stats">

        <div className="prescription-stat-card">

          <span className="prescription-stat-icon">
            💊
          </span>

          <div>
            <p>Total Prescriptions</p>

            <h2>
              {prescriptions.length}
            </h2>
          </div>

        </div>

        <div className="prescription-stat-card">

          <span className="prescription-stat-icon">
            🟢
          </span>

          <div>
            <p>Active</p>

            <h2>
              {activeCount}
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
              {completedCount}
            </h2>
          </div>

        </div>

      </div>

      {/* ==============================
          PRESCRIPTIONS
      ============================== */}

      <div className="prescriptions-section">

        <div className="prescriptions-section-header">

          <div>

            <h2>My Prescriptions</h2>

            <p>
              {loading
                ? "Loading prescriptions..."
                : `${filteredPrescriptions.length} prescriptions found`}
            </p>

          </div>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="no-prescriptions">

            <div>⏳</div>

            <h3>
              Loading prescriptions...
            </h3>

            <p>
              Please wait while we load your
              prescriptions.
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="no-prescriptions">

            <div>⚠️</div>

            <h3>
              Unable to load prescriptions
            </h3>

            <p>{error}</p>

          </div>
        )}

        {/* LIST */}

        {!loading &&
          !error &&
          filteredPrescriptions.length >
            0 && (

            <div className="prescriptions-list">

              {filteredPrescriptions.map(
                (prescription) => {

                  const isExpanded =
                    expandedPrescriptionId ===
                    prescription.prescriptionId;

                  const isEditing =
                    editingPrescriptionId ===
                    prescription.prescriptionId;

                  const isDeleting =
                    deletingId ===
                    prescription.prescriptionId;

                  return (
                    <div
                      className="prescription-card"
                      key={
                        prescription.prescriptionId
                      }
                    >

                      {/* CARD HEADER */}

                      <div className="prescription-card-header">

                        <div className="medicine-icon">
                          💊
                        </div>

                        <div className="medicine-info">

                          <h3>
                            {prescription.medicine}
                          </h3>

                          <p>
                            Prescribed by{" "}
                            {getDoctorName(
                              prescription.doctorId
                            )}
                          </p>

                        </div>

                        <span
                          className={`prescription-status ${
                            prescription.status ===
                            "Active"
                              ? "active"
                              : "completed"
                          }`}
                        >
                          {prescription.status}
                        </span>

                      </div>

                      {/* FOOTER */}

                      <div className="prescription-card-footer">

                        <span>
                          📋 Prescribed on{" "}
                          {formatDate(
                            prescription.prescriptionDate
                          )}
                        </span>

                        <button
                          className="view-prescription-button"
                          onClick={() =>
                            handleViewDetails(
                              prescription.prescriptionId
                            )
                          }
                        >
                          {isExpanded
                            ? "Hide Details"
                            : "View Details"}
                        </button>

                      </div>

                      {/* EXPANDED SECTION */}

                      {isExpanded && (
                        <div className="inline-prescription-details">

                          {/* EDIT MODE */}

                          {isEditing ? (

                            <div className="prescription-edit-form">

                              <h3>
                                Edit Prescription
                              </h3>

                              <div className="edit-field">

                                <label>
                                  Medicine
                                </label>

                                <input
                                  type="text"
                                  name="medicine"
                                  value={
                                    editForm.medicine
                                  }
                                  onChange={
                                    handleEditChange
                                  }
                                />

                              </div>

                              <div className="edit-field">

                                <label>
                                  Purpose
                                </label>

                                <input
                                  type="text"
                                  name="purpose"
                                  value={
                                    editForm.purpose
                                  }
                                  onChange={
                                    handleEditChange
                                  }
                                />

                              </div>

                              <div className="edit-field">

                                <label>
                                  Dosage
                                </label>

                                <input
                                  type="text"
                                  name="dosage"
                                  value={
                                    editForm.dosage
                                  }
                                  onChange={
                                    handleEditChange
                                  }
                                />

                              </div>

                              <div className="edit-field">

                                <label>
                                  Frequency
                                </label>

                                <input
                                  type="text"
                                  name="frequency"
                                  value={
                                    editForm.frequency
                                  }
                                  onChange={
                                    handleEditChange
                                  }
                                />

                              </div>

                              <div className="edit-field">

                                <label>
                                  Duration
                                </label>

                                <input
                                  type="text"
                                  name="duration"
                                  value={
                                    editForm.duration
                                  }
                                  onChange={
                                    handleEditChange
                                  }
                                />

                              </div>

                              <div className="edit-field">

                                <label>
                                  Status
                                </label>

                                <select
                                  name="status"
                                  value={
                                    editForm.status
                                  }
                                  onChange={
                                    handleEditChange
                                  }
                                >

                                  <option value="Active">
                                    Active
                                  </option>

                                  <option value="Completed">
                                    Completed
                                  </option>

                                  <option value="Cancelled">
                                    Cancelled
                                  </option>

                                </select>

                              </div>

                              <div className="edit-actions">

                                <button
                                  className="save-prescription-button"
                                  onClick={() =>
                                    handleSaveChanges(
                                      prescription
                                    )
                                  }
                                  disabled={saving}
                                >
                                  {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                                </button>

                                <button
                                  className="cancel-edit-button"
                                  onClick={
                                    handleCancelEdit
                                  }
                                  disabled={saving}
                                >
                                  Cancel
                                </button>

                              </div>

                            </div>

                          ) : (

                            /* VIEW MODE */

                            <>

                              <div className="inline-detail-row">

                                <span>🎯</span>

                                <strong>
                                  Purpose -
                                </strong>

                                <p>
                                  {prescription.purpose}
                                </p>

                              </div>

                              <div className="inline-detail-row">

                                <span>💊</span>

                                <strong>
                                  Dosage -
                                </strong>

                                <p>
                                  {prescription.dosage}
                                </p>

                              </div>

                              <div className="inline-detail-row">

                                <span>🕐</span>

                                <strong>
                                  Frequency -
                                </strong>

                                <p>
                                  {prescription.frequency}
                                </p>

                              </div>

                              <div className="inline-detail-row">

                                <span>📅</span>

                                <strong>
                                  Duration -
                                </strong>

                                <p>
                                  {prescription.duration}
                                </p>

                              </div>

                              <div className="inline-detail-row">

                                <span>📋</span>

                                <strong>
                                  Prescribed On -
                                </strong>

                                <p>
                                  {formatDate(
                                    prescription.prescriptionDate
                                  )}
                                </p>

                              </div>

                              <div className="inline-detail-row">

                                <span>📌</span>

                                <strong>
                                  Status -
                                </strong>

                                <p className="inline-status">
                                  {prescription.status}
                                </p>

                              </div>

                              {/* ACTION BUTTONS */}

                              <div className="prescription-action-buttons">

                                <button
                                  className="edit-prescription-button"
                                  onClick={() =>
                                    handleEdit(
                                      prescription
                                    )
                                  }
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  className="delete-prescription-button"
                                  onClick={() =>
                                    handleDeletePrescription(
                                      prescription
                                    )
                                  }
                                  disabled={isDeleting}
                                >
                                  {isDeleting
                                    ? "Deleting..."
                                    : "🗑️ Delete"}
                                </button>

                              </div>

                            </>

                          )}

                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        {/* NO PRESCRIPTIONS */}

        {!loading &&
          !error &&
          filteredPrescriptions.length ===
            0 && (

            <div className="no-prescriptions">

              <div>💊</div>

              <h3>
                No prescriptions found
              </h3>

              <p>
                {search
                  ? "Try searching for a different medicine or doctor."
                  : "You don't have any prescriptions yet."}
              </p>

            </div>
          )}

      </div>

    </div>
  );
}

export default Prescriptions;