import { useState, useEffect } from "react";

function MedicineDirectory({ onNavigate }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isPatient = user?.role !== "DOCTOR" && user?.role !== "ADMIN";

  const [activeTab, setActiveTab] = useState("search"); // "search" | "interactions" | "recorded"
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Interaction Checker state
  const [interactionDrugs, setInteractionDrugs] = useState(["Aspirin", "Warfarin"]);
  const [customDrugInput, setCustomDrugInput] = useState("");
  const [interactionResults, setInteractionResults] = useState(null);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  // Patient Recorded Medications state
  const [recordedMedsData, setRecordedMedsData] = useState(null);
  const [loadingRecorded, setLoadingRecorded] = useState(false);

  // Pre-load medicines on mount
  useEffect(() => {
    fetchMedicines("");
    const targetPatientId = user?.patientId || user?.userId;
    if (isPatient && targetPatientId) {
      loadRecordedMeds(targetPatientId);
    }
  }, []);

  const apiFetch = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    try {
      const res = await fetch(path, { ...options, headers });
      if (res.ok) return res;
      if (!path.startsWith("http")) {
        return await fetch(`http://localhost:8080${path}`, { ...options, headers });
      }
      return res;
    } catch {
      if (!path.startsWith("http")) {
        return await fetch(`http://localhost:8080${path}`, { ...options, headers });
      }
      throw new Error("Unable to reach medicine service.");
    }
  };

  const fetchMedicines = async (q) => {
    try {
      setLoading(true);
      setError("");
      const url = q ? `/api/medicines?query=${encodeURIComponent(q)}` : "/api/medicines";
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setMedicines(list);
        if (list.length > 0 && !selectedMedicine) {
          setSelectedMedicine(list[0]);
        }
      } else {
        throw new Error("Unable to retrieve medicine directory.");
      }
    } catch (err) {
      setError(err.message || "Failed to load medicine data.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecordedMeds = async (patientId) => {
    try {
      setLoadingRecorded(true);
      const res = await apiFetch(`/api/medicines/patient/${patientId}/recorded`);
      if (res.ok) {
        const data = await res.json();
        setRecordedMedsData(data);
      }
    } catch (e) {
      console.error("Failed to load patient recorded medications:", e);
    } finally {
      setLoadingRecorded(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMedicines(searchQuery);
  };

  const handleAddDrugToInteraction = (name) => {
    if (!name || !name.trim()) return;
    const clean = name.trim();
    if (!interactionDrugs.includes(clean)) {
      setInteractionDrugs([...interactionDrugs, clean]);
    }
    setCustomDrugInput("");
  };

  const handleRemoveDrugFromInteraction = (name) => {
    setInteractionDrugs(interactionDrugs.filter((d) => d !== name));
  };

  const handleCheckInteractions = async () => {
    if (interactionDrugs.length < 2) {
      alert("Please select at least 2 medications to evaluate potential drug-drug interactions.");
      return;
    }

    try {
      setCheckingInteractions(true);
      const res = await apiFetch("/api/medicines/check-interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(interactionDrugs),
      });

      if (res.ok) {
        const data = await res.json();
        setInteractionResults(Array.isArray(data) ? data : []);
      } else {
        throw new Error("Interaction check failed.");
      }
    } catch (err) {
      alert(err.message || "Failed to check interactions.");
    } finally {
      setCheckingInteractions(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <button style={styles.backBtn} onClick={() => onNavigate("dashboard")}>
            ← Back to Dashboard
          </button>
          <h1 style={styles.title}>💊 AI-Assisted Medicine Information & Safety</h1>
          <p style={styles.subtitle}>
            Verified pharmaceutical monographs, indications, contraindications, and drug-drug interaction checker.
          </p>
        </div>

        <button
          style={styles.pharmacyBtn}
          onClick={() => onNavigate("pharmacies")}
          title="Find nearby pharmacies stocking verified medications"
        >
          📍 Find Nearby Pharmacies →
        </button>
      </div>

      {/* Mandatory Safety Notice */}
      <div style={styles.safetyBanner}>
        <span style={{ fontSize: "22px", marginRight: "12px" }}>⚠️</span>
        <div>
          <strong>Mandatory Safety & Clinical Warning:</strong> This pharmaceutical directory is strictly for
          educational reference. It <strong>does NOT prescribe medications</strong>, generate personalized dosages,
          or recommend altering prescribed treatments. Never discontinue or change any prescribed medication
          without explicit instructions from your treating doctor or licensed pharmacist.
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabBar}>
        <button
          style={activeTab === "search" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab("search")}
        >
          🔍 Search Medicines & Monographs
        </button>

        <button
          style={activeTab === "interactions" ? styles.tabBtnActive : styles.tabBtn}
          onClick={() => setActiveTab("interactions")}
        >
          ⚡ Drug-Drug Interaction Checker ({interactionDrugs.length} selected)
        </button>

        {isPatient && (
          <button
            style={activeTab === "recorded" ? styles.tabBtnActive : styles.tabBtn}
            onClick={() => setActiveTab("recorded")}
          >
            📋 My Recorded Medications
          </button>
        )}
      </div>

      {/* TAB 1: MEDICINE SEARCH & MONOGRAPHS */}
      {activeTab === "search" && (
        <div>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={styles.searchBarForm}>
            <input
              type="text"
              placeholder="Search by medicine name, generic name, brand (e.g. Lipitor, Metformin, Tylenol), or therapeutic class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchSubmitBtn}>
              Search
            </button>
          </form>

          {loading && <div style={styles.messageBox}>Searching pharmaceutical database...</div>}

          {!loading && error && <div style={styles.errorBox}>{error}</div>}

          {!loading && !error && (
            <div style={styles.twoColumnLayout}>
              {/* Left Column: Medicine List */}
              <div style={styles.medicineList}>
                <div style={styles.listHeader}>
                  <span>Verified Monographs ({medicines.length})</span>
                  <small style={{ color: "#64748b" }}>Click to view details</small>
                </div>

                {medicines.length === 0 ? (
                  <div style={styles.emptyList}>No medications matched your search.</div>
                ) : (
                  medicines.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMedicine(m)}
                      style={{
                        ...styles.medItem,
                        borderColor: selectedMedicine?.id === m.id ? "#2563eb" : "#e2e8f0",
                        backgroundColor: selectedMedicine?.id === m.id ? "#eff6ff" : "#ffffff",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "14.5px", color: "#0f172a" }}>{m.name}</strong>
                        <div style={{ fontSize: "12px", color: "#2563eb", marginTop: "2px" }}>
                          Generic: {m.genericName}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                          Class: {m.therapeuticClass}
                        </div>
                      </div>
                      <button
                        style={styles.addToInterBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddDrugToInteraction(m.genericName);
                          setActiveTab("interactions");
                        }}
                        title="Add to interaction checker"
                      >
                        + Check
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Selected Medicine Detailed Monograph */}
              <div style={styles.monographCard}>
                {!selectedMedicine ? (
                  <div style={styles.emptyDetail}>Select a medication to view clinical monograph.</div>
                ) : (
                  <div>
                    {/* Header */}
                    <div style={styles.monoHeader}>
                      <div>
                        <span style={styles.classTag}>{selectedMedicine.therapeuticClass}</span>
                        <h2 style={{ fontSize: "22px", margin: "6px 0 2px 0", color: "#0f172a" }}>
                          {selectedMedicine.name}
                        </h2>
                        <div style={{ fontSize: "13.5px", color: "#475569" }}>
                          Generic Name: <strong>{selectedMedicine.genericName}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <button
                          style={styles.actionPillBtn}
                          onClick={() => {
                            handleAddDrugToInteraction(selectedMedicine.genericName);
                            setActiveTab("interactions");
                          }}
                        >
                          ⚡ Check Interactions
                        </button>
                      </div>
                    </div>

                    {/* Common Brands */}
                    {selectedMedicine.brandNames && selectedMedicine.brandNames.length > 0 && (
                      <div style={styles.sectionRow}>
                        <strong style={styles.rowLabel}>Known Brand Names:</strong>
                        <div style={styles.brandsWrap}>
                          {selectedMedicine.brandNames.map((b, i) => (
                            <span key={i} style={styles.brandChip}>
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approved Uses */}
                    <div style={styles.monoSection}>
                      <h4 style={styles.monoSectionTitle}>🎯 Approved Indications & Uses</h4>
                      <ul style={styles.monoList}>
                        {selectedMedicine.approvedUses?.map((u, i) => (
                          <li key={i}>{u}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Warnings & Boxed Precautions */}
                    <div style={{ ...styles.monoSection, backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
                      <h4 style={{ ...styles.monoSectionTitle, color: "#92400e" }}>
                        ⚠️ Important Warnings & Boxed Precautions
                      </h4>
                      <ul style={{ ...styles.monoList, color: "#92400e" }}>
                        {selectedMedicine.warnings?.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Contraindications */}
                    <div style={{ ...styles.monoSection, backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
                      <h4 style={{ ...styles.monoSectionTitle, color: "#991b1b" }}>
                        🚫 Contraindications (Do NOT Take If)
                      </h4>
                      <ul style={{ ...styles.monoList, color: "#991b1b" }}>
                        {selectedMedicine.contraindications?.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Common Side Effects */}
                    <div style={styles.monoSection}>
                      <h4 style={styles.monoSectionTitle}>🤒 Common Side Effects</h4>
                      <div style={styles.sideEffectsGrid}>
                        {selectedMedicine.commonSideEffects?.map((se, i) => (
                          <span key={i} style={styles.sideEffectPill}>
                            • {se}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Food & Storage Advisories */}
                    <div style={styles.storageGrid}>
                      <div style={styles.storageCell}>
                        <div style={styles.cellLabel}>🍽️ Food & Alcohol Guidance</div>
                        <div style={styles.cellVal}>{selectedMedicine.foodAndAlcoholWarning}</div>
                      </div>

                      <div style={styles.storageCell}>
                        <div style={styles.cellLabel}>🌡️ Storage Instructions</div>
                        <div style={styles.cellVal}>{selectedMedicine.storageGuidelines}</div>
                      </div>
                    </div>

                    {/* Citation */}
                    <div style={styles.citationBox}>
                      <strong>Authoritative Source Citation: </strong>
                      {selectedMedicine.verifiedSourceCitation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DRUG-DRUG INTERACTION CHECKER */}
      {activeTab === "interactions" && (
        <div style={styles.interactionContainer}>
          <div style={styles.interactionCard}>
            <h2 style={styles.cardHeading}>⚡ Drug-Drug Interaction Safety Analyzer</h2>
            <p style={styles.cardDesc}>
              Select or type two or more medications to analyze potential pharmacokinetic and pharmacodynamic interactions.
            </p>

            {/* Selected Drugs Chips */}
            <div style={styles.selectedChipsWrap}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155", width: "100%" }}>
                Medications Selected for Analysis ({interactionDrugs.length}):
              </div>

              {interactionDrugs.map((d) => (
                <span key={d} style={styles.activeDrugChip}>
                  💊 {d}
                  <button
                    style={styles.removeChipBtn}
                    onClick={() => handleRemoveDrugFromInteraction(d)}
                  >
                    ✕
                  </button>
                </span>
              ))}

              {interactionDrugs.length === 0 && (
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                  No medications selected yet. Add medications below.
                </span>
              )}
            </div>

            {/* Add More Drugs Controls */}
            <div style={styles.addDrugRow}>
              <input
                type="text"
                placeholder="Type generic or brand drug name (e.g. Warfarin, Ibuprofen, Metformin)..."
                value={customDrugInput}
                onChange={(e) => setCustomDrugInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDrugToInteraction(customDrugInput);
                  }
                }}
                style={styles.drugInput}
              />
              <button
                type="button"
                style={styles.addBtn}
                onClick={() => handleAddDrugToInteraction(customDrugInput)}
              >
                + Add Medication
              </button>

              <button
                type="button"
                style={styles.checkRunBtn}
                onClick={handleCheckInteractions}
                disabled={checkingInteractions || interactionDrugs.length < 2}
              >
                {checkingInteractions ? "Analyzing Interactions..." : "⚡ Run Interaction Check"}
              </button>
            </div>

            {/* Quick Add Presets */}
            <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Quick Add Frequent Pairs:</span>
              <button
                type="button"
                style={styles.quickPresetBtn}
                onClick={() => setInteractionDrugs(["Aspirin", "Warfarin"])}
              >
                Aspirin + Warfarin
              </button>
              <button
                type="button"
                style={styles.quickPresetBtn}
                onClick={() => setInteractionDrugs(["Lisinopril", "Ibuprofen"])}
              >
                Lisinopril + Ibuprofen
              </button>
              <button
                type="button"
                style={styles.quickPresetBtn}
                onClick={() => setInteractionDrugs(["Metformin", "Warfarin"])}
              >
                Metformin + Warfarin
              </button>
              <button
                type="button"
                style={styles.quickPresetBtn}
                onClick={() => setInteractionDrugs(["Atorvastatin", "Warfarin"])}
              >
                Atorvastatin + Warfarin
              </button>
            </div>

            {/* Interaction Results Section */}
            {interactionResults && (
              <div style={styles.resultsWrap}>
                <h3 style={{ fontSize: "16px", color: "#0f172a", margin: "0 0 12px 0" }}>
                  Analysis Outcome: Found {interactionResults.length} Documented Drug Interaction(s)
                </h3>

                {interactionResults.length === 0 ? (
                  <div style={styles.noInterBox}>
                    ✅ <strong>No major or moderate documented drug interactions found</strong> between the selected
                    medications in our reference database. Always confirm with your physician or dispensing pharmacist.
                  </div>
                ) : (
                  interactionResults.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.interactionItem,
                        borderLeftColor:
                          item.severity === "MAJOR"
                            ? "#ef4444"
                            : item.severity === "MODERATE"
                            ? "#f59e0b"
                            : "#3b82f6",
                      }}
                    >
                      <div style={styles.interItemTop}>
                        <div>
                          <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                            {item.drugA} ⚡ {item.drugB}
                          </strong>
                        </div>
                        <span
                          style={{
                            ...styles.severityTag,
                            backgroundColor:
                              item.severity === "MAJOR"
                                ? "#fee2e2"
                                : item.severity === "MODERATE"
                                ? "#fef3c7"
                                : "#eff6ff",
                            color:
                              item.severity === "MAJOR"
                                ? "#991b1b"
                                : item.severity === "MODERATE"
                                ? "#92400e"
                                : "#1e40af",
                          }}
                        >
                          {item.severity} SEVERITY
                        </span>
                      </div>

                      <div style={{ marginTop: "10px", fontSize: "13.5px", color: "#334155", lineHeight: "1.5" }}>
                        <strong>Mechanism: </strong> {item.clinicalMechanism}
                      </div>

                      <div style={{ marginTop: "8px", fontSize: "13px", color: "#1e40af", backgroundColor: "#eff6ff", padding: "10px", borderRadius: "6px" }}>
                        <strong>Recommended Clinical Management: </strong> {item.recommendedAction}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PATIENT RECORDED MEDICATIONS */}
      {activeTab === "recorded" && (
        <div style={styles.recordedContainer}>
          <div style={styles.recordedCard}>
            <h2 style={styles.cardHeading}>📋 Your Recorded Medications & Prescriptions</h2>
            <p style={styles.cardDesc}>
              These medications have been documented in your consultation records and prescriptions.
            </p>

            {loadingRecorded && <div style={styles.messageBox}>Loading recorded medications...</div>}

            {!loadingRecorded && (!recordedMedsData || !recordedMedsData.rawPrescriptionEntries || recordedMedsData.rawPrescriptionEntries.length === 0) ? (
              <div style={styles.emptyList}>
                No prescription medications are currently on file in your medical records.
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "14px", color: "#334155", margin: "0 0 8px 0" }}>
                    Prescription Entries on Record:
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {recordedMedsData?.rawPrescriptionEntries.map((medText, i) => (
                      <div key={i} style={styles.recordMedRow}>
                        <span>💊 {medText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {recordedMedsData?.matchedVerifiedMedicines && recordedMedsData.matchedVerifiedMedicines.length > 0 && (
                  <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "14px", color: "#0f172a", margin: 0 }}>
                        Matched Verified Medications ({recordedMedsData.matchedVerifiedMedicines.length})
                      </h4>
                      <button
                        style={styles.actionPillBtn}
                        onClick={() => {
                          setInteractionDrugs(recordedMedsData.matchedVerifiedMedicines);
                          setActiveTab("interactions");
                        }}
                      >
                        ⚡ Check Interactions Across My Meds
                      </button>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {recordedMedsData.matchedVerifiedMedicines.map((m, i) => (
                        <span key={i} style={styles.brandChip}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    flexWrap: "wrap",
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
  pharmacyBtn: {
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(5, 150, 105, 0.2)",
  },
  safetyBanner: {
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
  tabBar: {
    display: "flex",
    gap: "10px",
    borderBottom: "2px solid #e2e8f0",
    marginBottom: "20px",
  },
  tabBtn: {
    padding: "12px 18px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid transparent",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  tabBtnActive: {
    padding: "12px 18px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "3px solid #2563eb",
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  searchBarForm: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  searchInput: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    outline: "none",
  },
  searchSubmitBtn: {
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  messageBox: {
    padding: "40px",
    textAlign: "center",
    color: "#64748b",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px dashed #cbd5e1",
  },
  errorBox: {
    padding: "16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #f87171",
    borderRadius: "8px",
    color: "#991b1b",
    marginBottom: "16px",
  },
  twoColumnLayout: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "24px",
    alignItems: "flex-start",
  },
  medicineList: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "16px",
    maxHeight: "750px",
    overflowY: "auto",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "600",
    fontSize: "13px",
    color: "#334155",
    marginBottom: "12px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "8px",
  },
  emptyList: {
    padding: "20px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },
  medItem: {
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.15s ease",
  },
  addToInterBtn: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  monographCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  emptyDetail: {
    padding: "60px 20px",
    textAlign: "center",
    color: "#64748b",
  },
  monoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "16px",
    marginBottom: "16px",
  },
  classTag: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "#e0e7ff",
    color: "#3730a3",
    padding: "3px 8px",
    borderRadius: "4px",
  },
  actionPillBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
  sectionRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  },
  rowLabel: {
    fontSize: "13px",
    color: "#475569",
  },
  brandsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  brandChip: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
  },
  monoSection: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "14px 16px",
    marginBottom: "14px",
  },
  monoSectionTitle: {
    fontSize: "14.5px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  monoList: {
    margin: 0,
    paddingLeft: "18px",
    fontSize: "13.5px",
    lineHeight: "1.5",
  },
  sideEffectsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  sideEffectPill: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
  },
  storageGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "16px",
  },
  storageCell: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    backgroundColor: "#fafaf9",
  },
  cellLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "4px",
  },
  cellVal: {
    fontSize: "12.5px",
    color: "#475569",
    lineHeight: "1.4",
  },
  citationBox: {
    fontSize: "11.5px",
    color: "#64748b",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "12px",
    lineHeight: "1.4",
  },
  interactionContainer: {
    maxWidth: "960px",
    margin: "0 auto",
  },
  interactionCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  cardHeading: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 6px 0",
  },
  cardDesc: {
    fontSize: "13.5px",
    color: "#64748b",
    margin: "0 0 16px 0",
  },
  selectedChipsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  activeDrugChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
  },
  removeChipBtn: {
    background: "transparent",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    padding: "0 2px",
  },
  addDrugRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  drugInput: {
    flex: 1,
    minWidth: "240px",
    padding: "10px 14px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    outline: "none",
  },
  addBtn: {
    padding: "10px 16px",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
  checkRunBtn: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  quickPresetBtn: {
    backgroundColor: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#475569",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "11.5px",
    cursor: "pointer",
  },
  resultsWrap: {
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #e2e8f0",
  },
  noInterBox: {
    padding: "16px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "8px",
    color: "#166534",
    fontSize: "13.5px",
  },
  interactionItem: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderLeftWidth: "6px",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
  },
  interItemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  severityTag: {
    fontSize: "11px",
    fontWeight: "800",
    padding: "4px 10px",
    borderRadius: "12px",
    letterSpacing: "0.5px",
  },
  recordedContainer: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  recordedCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  recordMedRow: {
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "13.5px",
    color: "#1e293b",
  },
};

export default MedicineDirectory;

