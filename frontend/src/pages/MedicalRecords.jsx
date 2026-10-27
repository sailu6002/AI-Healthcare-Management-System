import { useEffect, useState } from "react";

function MedicalRecords({ onNavigate }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isDoctor = user?.role === "DOCTOR";
  const isAdmin = user?.role === "ADMIN";
  const isPatient = !isDoctor && !isAdmin;

  // Active Tab: "clinical" or "ai_reports"
  const [activeTab, setActiveTab] = useState("clinical");

  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Add Medical Record Modal state (for doctors & admin only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    patientId: "",
    doctorId: "",
    appointmentId: "",
    diagnosis: "",
    symptoms: "",
    treatment: "",
    prescription: "",
    testResults: "",
    visitDate: new Date().toISOString().split("T")[0],
  });

  // AI Medical Report Analysis State
  const [analyzedReports, setAnalyzedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [manualReportText, setManualReportText] = useState("");
  const [analyzingReport, setAnalyzingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    if (!token) {
      setError("Please log in again to view medical records.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch doctors and patients
      const [doctorsResponse, patientsResponse] = await Promise.all([
        fetch("http://localhost:8080/api/doctors", { headers }),
        fetch("http://localhost:8080/api/patients", { headers }),
      ]);

      let doctorsData = [];
      let patientsData = [];

      if (doctorsResponse.ok) {
        doctorsData = await doctorsResponse.json();
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      }

      if (patientsResponse.ok) {
        patientsData = await patientsResponse.json();
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      }

      // If patient is logged in: find matching patient entity
      let resolvedPatientId = null;
      let matchedPatient = null;

      if (isPatient) {
        matchedPatient = (Array.isArray(patientsData) ? patientsData : []).find(
          (p) =>
            (user?.patientId && String(p.patientId) === String(user.patientId)) ||
            (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
            (p.fullName && user.fullName && p.fullName.trim().toLowerCase() === user.fullName.trim().toLowerCase())
        );

        resolvedPatientId = user?.patientId || matchedPatient?.patientId || null;

        if (matchedPatient?.patientId && !user?.patientId) {
          try {
            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            stored.patientId = matchedPatient.patientId;
            localStorage.setItem("user", JSON.stringify(stored));
          } catch (e) {
            console.warn("Could not cache patientId:", e);
          }
        }

        setCurrentPatient(
          matchedPatient || {
            fullName: user.fullName,
            email: user.email,
            patientId: resolvedPatientId || "N/A",
            bloodGroup: "O+",
            gender: "N/A",
            age: "N/A",
            phone: "N/A",
            address: "N/A",
          }
        );
      }

      // Fetch records: if patient, fetch ONLY this patient's records
      let recordsUrl = "http://localhost:8080/api/medical-records";
      if (isPatient && resolvedPatientId) {
        recordsUrl = `http://localhost:8080/api/medical-records/patient/${resolvedPatientId}`;
      }

      const recordsResponse = await fetch(recordsUrl, { headers });

      if (!recordsResponse.ok) {
        throw new Error(`Medical records request failed (${recordsResponse.status}).`);
      }

      const recordsData = await recordsResponse.json();
      let recordsList = Array.isArray(recordsData) ? recordsData : [];

      if (isPatient && resolvedPatientId) {
        recordsList = recordsList.filter((r) => String(r.patientId) === String(resolvedPatientId));
      }

      setRecords(recordsList);

      // Also load analyzed AI reports for this patient
      if (resolvedPatientId) {
        loadAnalyzedReports(resolvedPatientId);
      }
    } catch (err) {
      console.error("Error loading medical records data:", err);
      setError(err.message || "Unable to load medical records.");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyzedReports = async (patientId) => {
    try {
      setLoadingReports(true);
      const res = await fetch(`http://localhost:8080/api/medical-reports/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setAnalyzedReports(list);
        if (list.length > 0 && !selectedReport) {
          setSelectedReport(list[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load analyzed reports:", e);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleUploadAndAnalyzeReport = async (e) => {
    e.preventDefault();
    if (!reportFile && !manualReportText.trim()) {
      alert("Please upload a PDF / image report file or paste laboratory test text.");
      return;
    }

    try {
      setAnalyzingReport(true);
      const formData = new FormData();
      const patId = currentPatient?.patientId || user?.patientId || 1;
      formData.append("patientId", patId);
      formData.append("patientName", currentPatient?.fullName || user?.fullName || "Patient");
      formData.append("reportTitle", reportTitle.trim() || (reportFile ? reportFile.name : "Laboratory Panel Analysis"));

      if (reportFile) {
        formData.append("file", reportFile);
      }
      if (manualReportText.trim()) {
        formData.append("manualTextInput", manualReportText.trim());
      }

      const response = await fetch("http://localhost:8080/api/medical-reports/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Report analysis failed.");
      }

      const newAnalyzed = await response.json();
      setAnalyzedReports((prev) => [newAnalyzed, ...prev]);
      setSelectedReport(newAnalyzed);
      setReportFile(null);
      setManualReportText("");
      setReportTitle("");
      showFeedback("success", "Medical report successfully analyzed against clinical reference ranges!");
    } catch (err) {
      showFeedback("error", err.message || "Could not analyze medical report.");
    } finally {
      setAnalyzingReport(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4500);
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((item) => String(item.doctorId) === String(doctorId));
    return doctor ? `Dr. ${doctor.fullName} (${doctor.specialization || "General"})` : `Doctor ID #${doctorId ?? "Unknown"}`;
  };

  const getPatientName = (patientId) => {
    const patient = patients.find((item) => String(item.patientId) === String(patientId));
    return patient ? `${patient.fullName} (#${patient.patientId})` : `Patient ID #${patientId}`;
  };

  const getMatchedDoctorId = () => {
    const matched = doctors.find(
      (d) =>
        (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase()) ||
        (d.fullName && user.fullName && d.fullName.toLowerCase() === user.fullName.toLowerCase())
    );
    return matched?.doctorId || doctors[0]?.doctorId || user?.userId || "";
  };

  const openAddRecordModal = () => {
    setNewRecord({
      patientId: patients.length > 0 ? String(patients[0].patientId) : "",
      doctorId: getMatchedDoctorId() ? String(getMatchedDoctorId()) : "",
      appointmentId: "",
      diagnosis: "",
      symptoms: "",
      treatment: "",
      prescription: "",
      testResults: "",
      visitDate: new Date().toISOString().split("T")[0],
    });
    setShowAddModal(true);
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!newRecord.patientId) {
      alert("Please select a patient.");
      return;
    }

    const doctorIdVal = newRecord.doctorId || getMatchedDoctorId();
    if (!doctorIdVal) {
      alert("Please select a doctor.");
      return;
    }

    if (!newRecord.diagnosis.trim()) {
      alert("Diagnosis is required.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        patientId: Number(newRecord.patientId),
        doctorId: Number(doctorIdVal),
        appointmentId: newRecord.appointmentId ? Number(newRecord.appointmentId) : null,
        diagnosis: newRecord.diagnosis.trim(),
        symptoms: newRecord.symptoms.trim(),
        treatment: newRecord.treatment.trim(),
        prescription: newRecord.prescription.trim(),
        testResults: newRecord.testResults.trim(),
        visitDate: newRecord.visitDate,
      };

      const response = await fetch("http://localhost:8080/api/medical-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create medical record.");
      }

      const created = await response.json();
      setRecords((prev) => [created, ...prev]);
      setShowAddModal(false);
      showFeedback("success", "Clinical medical record saved successfully.");
    } catch (err) {
      showFeedback("error", err.message || "Failed to save medical record.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    const q = search.toLowerCase();
    const docName = getDoctorName(record.doctorId).toLowerCase();
    const patName = getPatientName(record.patientId).toLowerCase();
    const diag = (record.diagnosis || "").toLowerCase();
    const symp = (record.symptoms || "").toLowerCase();
    const tests = (record.testResults || "").toLowerCase();
    return (
      docName.includes(q) ||
      patName.includes(q) ||
      diag.includes(q) ||
      symp.includes(q) ||
      tests.includes(q)
    );
  });

  return (
    <div style={styles.container}>
      {/* Toast Feedback */}
      {feedback.message && (
        <div
          style={{
            ...styles.toast,
            backgroundColor: feedback.type === "error" ? "#fee2e2" : "#dcfce7",
            color: feedback.type === "error" ? "#991b1b" : "#166534",
            border: `1px solid ${feedback.type === "error" ? "#f87171" : "#86efac"}`,
          }}
        >
          {feedback.type === "error" ? "❌ " : "✅ "}
          {feedback.message}
        </div>
      )}

      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => onNavigate("dashboard")}>
            ← Back to Dashboard
          </button>

          <h1 style={styles.title}>
            {isPatient ? "📋 Medical Records & AI Lab Analysis" : "📋 Medical Records Management"}
          </h1>
          <p style={styles.subtitle}>
            {isPatient
              ? "Review your consultation history and use the AI Medical Report Scanner to analyze diagnostic lab tests."
              : "Review consultation history, record diagnoses, and audit uploaded patient diagnostic reports."}
          </p>
        </div>

        <div style={styles.headerRight}>
          {!isPatient && (
            <button style={styles.primaryAddBtn} onClick={openAddRecordModal}>
              ➕ Add Clinical Record
            </button>
          )}

          <div style={styles.totalBox}>
            <strong style={{ fontSize: "22px" }}>{records.length}</strong>
            <span style={{ fontSize: "12px" }}>
              {isPatient ? "My Records" : "Total Records"}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div style={styles.tabBar}>
        <button
          style={activeTab === "clinical" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab("clinical")}
        >
          📋 Clinical Consultation Records ({records.length})
        </button>

        <button
          style={activeTab === "ai_reports" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab("ai_reports")}
        >
          📄 AI Medical Report Scanner & Lab Analyzer ({analyzedReports.length})
        </button>
      </div>

      {/* TAB 1: CLINICAL MEDICAL RECORDS */}
      {activeTab === "clinical" && (
        <div>
          {/* Patient Profile Card (Shown for Logged-in Patient) */}
          {isPatient && currentPatient && (
            <section style={styles.patientProfileSection}>
              <div style={styles.patientProfileCard}>
                <div style={styles.patientProfileTop}>
                  <div style={styles.avatarPill}>👤</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={styles.patientProfileName}>{currentPatient.fullName}</h3>
                    <span style={styles.patientProfileId}>
                      Registered Patient #{currentPatient.patientId} • Confidential Health Records
                    </span>
                  </div>
                  <div style={styles.bloodTag}>🩸 {currentPatient.bloodGroup || "O+"}</div>
                </div>

                <div style={styles.patientMetaGrid}>
                  <div style={styles.metaCell}>
                    <span style={styles.metaLabel}>Age & Gender</span>
                    <strong style={styles.metaVal}>
                      {currentPatient.age ? `${currentPatient.age} Yrs` : "N/A"} • {currentPatient.gender || "N/A"}
                    </strong>
                  </div>

                  <div style={styles.metaCell}>
                    <span style={styles.metaLabel}>Phone Contact</span>
                    <strong style={styles.metaVal}>📞 {currentPatient.phone || "Not recorded"}</strong>
                  </div>

                  <div style={styles.metaCell}>
                    <span style={styles.metaLabel}>Registered Email</span>
                    <strong style={styles.metaVal}>
                      ✉️ {currentPatient.email || user.email || "Not recorded"}
                    </strong>
                  </div>

                  <div style={styles.metaCell}>
                    <span style={styles.metaLabel}>Residential Address</span>
                    <strong style={styles.metaVal}>
                      📍 {currentPatient.address || "On file with hospital"}
                    </strong>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Search Input */}
          <section style={styles.searchSection}>
            <input
              style={styles.searchInput}
              type="search"
              placeholder={
                isPatient
                  ? "🔍 Search your records by diagnosis, attending doctor, symptoms, or test results..."
                  : "🔍 Search all records by patient name, diagnosis, doctor, symptoms, or test results..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </section>

          {loading && <div style={styles.message}>Loading medical records...</div>}

          {!loading && error && (
            <div style={styles.error}>
              <strong>Unable to load records</strong>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredRecords.length === 0 && (
            <div style={styles.message}>
              {records.length === 0 ? (
                isPatient ? (
                  <div>
                    <p style={{ fontSize: "16px", marginBottom: "16px", color: "#334155" }}>
                      You do not have any doctor consultation records yet.
                    </p>
                    <button style={styles.primaryAddBtn} onClick={() => onNavigate("appointments")}>
                      📅 Schedule a Consultation Appointment
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: "16px", marginBottom: "16px" }}>No medical records in database.</p>
                    <button style={styles.primaryAddBtn} onClick={openAddRecordModal}>
                      ➕ Create First Medical Record
                    </button>
                  </div>
                )
              ) : (
                "No medical records matched your search query."
              )}
            </div>
          )}

          {/* Records Grid */}
          <div style={styles.grid}>
            {filteredRecords.map((record) => (
              <div key={record.recordId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.badge}>Record #{record.recordId}</span>
                    <h3 style={styles.doctorTitle}>{getDoctorName(record.doctorId)}</h3>
                    {!isPatient && (
                      <p style={styles.patientSub}>Patient: {getPatientName(record.patientId)}</p>
                    )}
                  </div>
                  <div style={styles.dateBox}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Visit Date</span>
                    <strong>{record.visitDate || "Not recorded"}</strong>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>🩺 Diagnosis</label>
                    <div style={styles.diagnosisVal}>{record.diagnosis || "No diagnosis documented."}</div>
                  </div>

                  {record.symptoms && (
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel}>⚠️ Symptoms</label>
                      <div style={styles.fieldVal}>{record.symptoms}</div>
                    </div>
                  )}

                  {record.treatment && (
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel}>💊 Clinical Treatment & Advice</label>
                      <div style={styles.fieldVal}>{record.treatment}</div>
                    </div>
                  )}

                  {record.testResults && (
                    <div style={styles.fieldGroup}>
                      <label style={styles.fieldLabel}>🧪 Diagnostic Test Findings</label>
                      <div style={styles.fieldVal}>{record.testResults}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AI MEDICAL REPORT SCANNER & LAB ANALYZER */}
      {activeTab === "ai_reports" && (
        <div style={{ marginTop: "16px" }}>
          {/* Mandatory Clinical Disclaimer */}
          <div style={styles.disclaimerBox}>
            <span style={{ fontSize: "22px", marginRight: "12px" }}>⚠️</span>
            <div>
              <strong>Verified Clinical Reference & Safety Disclaimer:</strong> This automated analyzer
              extracts parameters from uploaded documents and evaluates them against published medical reference
              ranges (ADA, AHA, NKF). It is <strong>NOT a clinical diagnosis</strong>. Extracted laboratory
              values are presented separately from AI interpretations. Always present your original laboratory
              reports to your physician.
            </div>
          </div>

          <div style={styles.scannerLayout}>
            {/* Left: Upload and Analyze Form */}
            <div style={styles.uploadCard}>
              <h2 style={styles.cardTitle}>📤 Upload & Analyze Medical Report</h2>
              <p style={styles.cardSubtitle}>
                Upload laboratory test results in PDF, PNG, JPG, or TXT format, or input clinical values.
              </p>

              <form onSubmit={handleUploadAndAnalyzeReport}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Report Title / Panel Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Comprehensive Metabolic Panel (CMP)"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload Report Document (PDF, Image, TXT)</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                    onChange={(e) => setReportFile(e.target.files[0] || null)}
                    style={{ ...styles.input, padding: "8px" }}
                  />
                  {reportFile && (
                    <span style={{ fontSize: "12px", color: "#0284c7" }}>
                      Selected: {reportFile.name} ({(reportFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Or Paste Laboratory Test Text / Numbers
                    <span style={{ fontWeight: "normal", color: "#64748b" }}> (Optional / Hybrid)</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Fasting Blood Sugar: 138 mg/dL&#10;HbA1c: 6.8%&#10;Total Cholesterol: 215 mg/dL&#10;Serum Creatinine: 1.1 mg/dL&#10;Blood Pressure: 135/88"
                    value={manualReportText}
                    onChange={(e) => setManualReportText(e.target.value)}
                    style={styles.textarea}
                  />
                </div>

                <button
                  type="submit"
                  style={styles.analyzeBtn}
                  disabled={analyzingReport}
                >
                  {analyzingReport ? "Extracting & Analyzing Lab Biomarkers..." : "⚡ Scan & Analyze Report with AI"}
                </button>
              </form>

              {/* Previously Analyzed Reports List */}
              <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#334155", margin: "0 0 10px 0" }}>
                  📂 Analyzed Reports History ({analyzedReports.length})
                </h4>
                {analyzedReports.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>No reports analyzed yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {analyzedReports.map((rep) => (
                      <div
                        key={rep.id}
                        onClick={() => setSelectedReport(rep)}
                        style={{
                          ...styles.historyItem,
                          borderColor: selectedReport?.id === rep.id ? "#0284c7" : "#e2e8f0",
                          backgroundColor: selectedReport?.id === rep.id ? "#f0f9ff" : "#ffffff",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: "13.5px", color: "#1e293b" }}>{rep.reportTitle}</strong>
                          <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                            {new Date(rep.uploadedAt).toLocaleString()} • {rep.fileName || "Text Entry"}
                          </div>
                        </div>
                        <span
                          style={{
                            ...styles.riskBadge,
                            backgroundColor:
                              rep.overallRiskLevel === "HIGH_ATTENTION"
                                ? "#fee2e2"
                                : rep.overallRiskLevel === "ATTENTION_RECOMMENDED"
                                ? "#fef3c7"
                                : "#dcfce7",
                            color:
                              rep.overallRiskLevel === "HIGH_ATTENTION"
                                ? "#991b1b"
                                : rep.overallRiskLevel === "ATTENTION_RECOMMENDED"
                                ? "#92400e"
                                : "#166534",
                          }}
                        >
                          {rep.overallRiskLevel === "HIGH_ATTENTION"
                            ? "High Attention"
                            : rep.overallRiskLevel === "ATTENTION_RECOMMENDED"
                            ? "Attention"
                            : "Normal"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Active Report Analysis View */}
            <div style={styles.resultsCard}>
              {!selectedReport && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>📄</div>
                  <h3>No Medical Report Selected</h3>
                  <p>Upload a document or select an existing analyzed report to inspect laboratory findings.</p>
                </div>
              )}

              {selectedReport && (
                <div>
                  {/* Report Header */}
                  <div style={styles.repHeader}>
                    <div>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Analyzed Report #{selectedReport.id} • {new Date(selectedReport.uploadedAt).toLocaleString()}
                      </span>
                      <h2 style={{ fontSize: "20px", color: "#0f172a", margin: "4px 0" }}>
                        {selectedReport.reportTitle}
                      </h2>
                      <div style={{ fontSize: "13px", color: "#475569" }}>
                        Patient: <strong>{selectedReport.patientName}</strong> • Original File:{" "}
                        <code>{selectedReport.fileName}</code>
                      </div>
                    </div>

                    {selectedReport.storedFilePath && (
                      <a
                        href={`http://localhost:8080/api/medical-reports/download/${selectedReport.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.downloadBtn}
                      >
                        📥 Download Original File
                      </a>
                    )}
                  </div>

                  {/* Overall Risk Level Banner */}
                  <div
                    style={{
                      ...styles.riskBanner,
                      backgroundColor:
                        selectedReport.overallRiskLevel === "HIGH_ATTENTION"
                          ? "#fef2f2"
                          : selectedReport.overallRiskLevel === "ATTENTION_RECOMMENDED"
                          ? "#fffbeb"
                          : "#f0fdf4",
                      borderColor:
                        selectedReport.overallRiskLevel === "HIGH_ATTENTION"
                          ? "#f87171"
                          : selectedReport.overallRiskLevel === "ATTENTION_RECOMMENDED"
                          ? "#f59e0b"
                          : "#4ade80",
                    }}
                  >
                    <div>
                      <strong>Overall Screening Finding: </strong>
                      {selectedReport.overallRiskLevel === "HIGH_ATTENTION"
                        ? "Multiple biomarkers are outside standard physiological thresholds. Prompt physician review recommended."
                        : selectedReport.overallRiskLevel === "ATTENTION_RECOMMENDED"
                        ? "One or more values deviate from standard reference ranges. Discuss with your physician."
                        : "Extracted parameters are within standard published reference intervals."}
                    </div>
                  </div>

                  {/* Section 1: Extracted Standard Laboratory Values Table */}
                  <div style={styles.sectionBox}>
                    <h3 style={styles.sectionTitle}>
                      🧪 Extracted Laboratory Values (Standard Reference Comparison)
                    </h3>
                    <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 12px 0" }}>
                      Exact values extracted from document text compared objectively against documented physiological reference ranges.
                    </p>

                    {(() => {
                      let labs = [];
                      try {
                        labs = JSON.parse(selectedReport.extractedLabValuesJson || "[]");
                      } catch (e) {
                        labs = [];
                      }

                      if (labs.length === 0) {
                        return (
                          <div style={{ padding: "14px", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "13px", color: "#64748b" }}>
                            No standardized numeric biomarkers recognized in this document. Please review raw narrative notes below.
                          </div>
                        );
                      }

                      return (
                        <div style={{ overflowX: "auto" }}>
                          <table style={styles.labTable}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Test Parameter</th>
                                <th style={styles.th}>Extracted Value</th>
                                <th style={styles.th}>Reference Range</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Interpretation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {labs.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td style={styles.td}>
                                    <strong>{item.parameter}</strong>
                                    <div style={{ fontSize: "11px", color: "#64748b" }}>{item.category}</div>
                                  </td>
                                  <td style={styles.td}>
                                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                                      {item.value}
                                    </span>{" "}
                                    <small style={{ color: "#64748b" }}>{item.unit}</small>
                                  </td>
                                  <td style={styles.td}>{item.referenceRange}</td>
                                  <td style={styles.td}>
                                    <span
                                      style={{
                                        ...styles.statusBadge,
                                        backgroundColor:
                                          item.status === "HIGH"
                                            ? "#fee2e2"
                                            : item.status === "LOW"
                                            ? "#fef3c7"
                                            : "#dcfce7",
                                        color:
                                          item.status === "HIGH"
                                            ? "#991b1b"
                                            : item.status === "LOW"
                                            ? "#92400e"
                                            : "#166534",
                                      }}
                                    >
                                      {item.status}
                                    </span>
                                  </td>
                                  <td style={{ ...styles.td, fontSize: "12px", color: "#334155" }}>
                                    {item.interpretation}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Section 2: AI Clinical Summary (Separated) */}
                  <div style={{ ...styles.sectionBox, backgroundColor: "#fafaf9" }}>
                    <h3 style={styles.sectionTitle}>
                      🤖 AI-Assisted Clinical Summary & Findings Interpretation
                    </h3>
                    <div style={styles.summaryText}>
                      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0, fontSize: "13.5px", lineHeight: "1.6" }}>
                        {selectedReport.clinicalSummary}
                      </pre>
                    </div>
                  </div>

                  {/* Section 3: Raw Preserved Text / Original Document */}
                  <div style={{ marginTop: "16px" }}>
                    <button
                      type="button"
                      style={styles.toggleRawBtn}
                      onClick={() => setShowRawText(!showRawText)}
                    >
                      {showRawText ? "▲ Hide Raw Extracted Document Text" : "▼ View Raw Extracted Document Text & Audit Trail"}
                    </button>

                    {showRawText && (
                      <div style={styles.rawTextContainer}>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>
                          Complete Raw Document Extraction:
                        </div>
                        <pre style={styles.rawTextPre}>
                          {selectedReport.rawExtractedText || "No text extracted."}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Medical Record Modal (Doctors and Admins only) */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Medical Record</h2>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Patient *</label>
                  <select
                    style={styles.input}
                    value={newRecord.patientId}
                    onChange={(e) => setNewRecord({ ...newRecord, patientId: e.target.value })}
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map((p) => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.fullName} (ID: {p.patientId})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Attending Doctor *</label>
                  <select
                    style={styles.input}
                    value={newRecord.doctorId}
                    onChange={(e) => setNewRecord({ ...newRecord, doctorId: e.target.value })}
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((d) => (
                      <option key={d.doctorId} value={d.doctorId}>
                        Dr. {d.fullName} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Visit Date *</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={newRecord.visitDate}
                    onChange={(e) => setNewRecord({ ...newRecord, visitDate: e.target.value })}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Appointment ID (Optional)</label>
                  <input
                    type="number"
                    style={styles.input}
                    placeholder="e.g. 102"
                    value={newRecord.appointmentId}
                    onChange={(e) => setNewRecord({ ...newRecord, appointmentId: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Diagnosis *</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="Primary diagnosis / clinical impression"
                  value={newRecord.diagnosis}
                  onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Reported Symptoms</label>
                <textarea
                  style={styles.textarea}
                  rows={2}
                  placeholder="Patient presented with..."
                  value={newRecord.symptoms}
                  onChange={(e) => setNewRecord({ ...newRecord, symptoms: e.target.value })}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Clinical Treatment & Management Plan</label>
                <textarea
                  style={styles.textarea}
                  rows={2}
                  placeholder="Treatment protocols, lifestyle modifications, or advice..."
                  value={newRecord.treatment}
                  onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Diagnostic Test Results</label>
                <textarea
                  style={styles.textarea}
                  rows={2}
                  placeholder="Laboratory values, imaging findings, or vital signs..."
                  value={newRecord.testResults}
                  onChange={(e) => setNewRecord({ ...newRecord, testResults: e.target.value })}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? "Saving Record..." : "Save Medical Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1280px",
    margin: "0 auto",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  toast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 10000,
    fontWeight: "500",
    fontSize: "14px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: {
    flex: 1,
    minWidth: "280px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#2563eb",
    fontSize: "14px",
    cursor: "pointer",
    padding: 0,
    marginBottom: "8px",
    fontWeight: "500",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  primaryAddBtn: {
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  totalBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "8px 16px",
    color: "#0f172a",
  },
  tabBar: {
    display: "flex",
    gap: "10px",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "20px",
  },
  tabBtn: {
    padding: "12px 20px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    color: "#64748b",
    fontSize: "14.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
  tabBtnActive: {
    padding: "12px 20px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid #0284c7",
    color: "#0284c7",
    fontSize: "14.5px",
    fontWeight: "700",
    cursor: "pointer",
  },
  patientProfileSection: {
    marginBottom: "20px",
  },
  patientProfileCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "18px 24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  patientProfileTop: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "14px",
  },
  avatarPill: {
    fontSize: "26px",
    backgroundColor: "#e0f2fe",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  patientProfileName: {
    margin: "0 0 2px 0",
    fontSize: "18px",
    color: "#0f172a",
  },
  patientProfileId: {
    fontSize: "12.5px",
    color: "#64748b",
  },
  bloodTag: {
    padding: "6px 14px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "20px",
    fontWeight: "700",
    fontSize: "13px",
  },
  patientMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px",
  },
  metaCell: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  metaLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  metaVal: {
    fontSize: "13px",
    color: "#1e293b",
  },
  searchSection: {
    marginBottom: "18px",
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    outline: "none",
    boxSizing: "border-box",
  },
  message: {
    textAlign: "center",
    padding: "40px",
    color: "#64748b",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px dashed #cbd5e1",
  },
  error: {
    padding: "16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #f87171",
    borderRadius: "8px",
    color: "#991b1b",
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "18px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "12px",
    marginBottom: "12px",
  },
  badge: {
    fontSize: "11px",
    fontWeight: "700",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "3px 8px",
    borderRadius: "4px",
  },
  doctorTitle: {
    margin: "6px 0 2px 0",
    fontSize: "16px",
    color: "#0f172a",
  },
  patientSub: {
    margin: 0,
    fontSize: "12.5px",
    color: "#64748b",
  },
  dateBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  fieldLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
  },
  diagnosisVal: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0284c7",
  },
  fieldVal: {
    fontSize: "13px",
    color: "#334155",
    lineHeight: "1.4",
  },
  disclaimerBox: {
    backgroundColor: "#fffbeb",
    borderLeft: "5px solid #f59e0b",
    padding: "14px 18px",
    borderRadius: "8px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "flex-start",
    color: "#92400e",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  scannerLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
    gap: "24px",
    alignItems: "flex-start",
  },
  uploadCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "22px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 6px 0",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 16px 0",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "14px",
  },
  label: {
    fontSize: "12.5px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13.5px",
    outline: "none",
  },
  textarea: {
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  analyzeBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14.5px",
    fontWeight: "700",
    cursor: "pointer",
  },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  riskBadge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 8px",
    borderRadius: "12px",
  },
  resultsCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
  },
  repHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "14px",
    marginBottom: "14px",
    flexWrap: "wrap",
    gap: "10px",
  },
  downloadBtn: {
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    border: "1px solid #cbd5e1",
    padding: "8px 14px",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: "600",
    textDecoration: "none",
  },
  riskBanner: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13.5px",
    marginBottom: "18px",
  },
  sectionBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  labTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    fontWeight: "600",
    borderBottom: "1px solid #e2e8f0",
  },
  td: {
    padding: "10px",
    verticalAlign: "top",
  },
  statusBadge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "3px 8px",
    borderRadius: "4px",
  },
  summaryText: {
    color: "#334155",
    marginTop: "8px",
  },
  toggleRawBtn: {
    background: "transparent",
    border: "none",
    color: "#0284c7",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    padding: 0,
  },
  rawTextContainer: {
    marginTop: "8px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "12px",
  },
  rawTextPre: {
    margin: 0,
    fontSize: "12px",
    color: "#334155",
    whiteSpace: "pre-wrap",
    maxHeight: "220px",
    overflowY: "auto",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "24px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "12px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#0f172a",
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer",
    color: "#64748b",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "16px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "14px",
  },
  cancelBtn: {
    padding: "10px 16px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 18px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default MedicalRecords;
