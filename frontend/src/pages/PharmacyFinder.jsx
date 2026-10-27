import { useState, useEffect } from "react";

function PharmacyFinder({ onNavigate }) {
  const token = localStorage.getItem("token");

  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Location state
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [locationStatus, setLocationStatus] = useState("idle"); // "idle" | "requesting" | "granted" | "denied"
  const [manualLocation, setManualLocation] = useState("");

  // Search & Filter state
  const [medicineFilter, setMedicineFilter] = useState("");
  const [sortBy, setSortBy] = useState("distance"); // "distance" | "rating"
  const [maxRadius, setMaxRadius] = useState(30);

  useEffect(() => {
    // Attempt automatic geolocation on mount (with polite fallback)
    requestUserLocation();
  }, []);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      loadPharmaciesByDefaultArea();
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(userPos);
        setLocationStatus("granted");
        fetchNearbyPharmacies(userPos.lat, userPos.lng, medicineFilter, sortBy, maxRadius);
      },
      (err) => {
        console.warn("Geolocation permission not granted or unavailable:", err.message);
        setLocationStatus("denied");
        // Graceful fallback to default regional directory
        loadPharmaciesByDefaultArea();
      },
      { timeout: 7000 }
    );
  };

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
      throw new Error("Unable to reach pharmacy service.");
    }
  };

  const fetchNearbyPharmacies = async (lat, lng, medQuery, sort, radius) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (lat != null && lng != null) {
        params.append("lat", lat);
        params.append("lng", lng);
      }
      if (radius) params.append("radiusKm", radius);
      if (medQuery && medQuery.trim()) params.append("medicineQuery", medQuery.trim());
      if (sort) params.append("sortBy", sort);

      const res = await apiFetch(`/api/pharmacies/nearby?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setPharmacies(Array.isArray(data) ? data : []);
      } else {
        throw new Error("Failed to load pharmacy directory.");
      }
    } catch (err) {
      setError(err.message || "Failed to reach pharmacy service.");
    } finally {
      setLoading(false);
    }
  };

  const loadPharmaciesByDefaultArea = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (medicineFilter.trim()) params.append("medicineQuery", medicineFilter.trim());
      if (manualLocation.trim()) params.append("location", manualLocation.trim());

      const res = await apiFetch(`/api/pharmacies/search?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setPharmacies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message || "Unable to load pharmacies.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (coords && !manualLocation.trim()) {
      fetchNearbyPharmacies(coords.lat, coords.lng, medicineFilter, sortBy, maxRadius);
    } else {
      loadPharmaciesByDefaultArea();
    }
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    if (coords) {
      fetchNearbyPharmacies(coords.lat, coords.lng, medicineFilter, newSort, maxRadius);
    } else {
      // Sort in-memory
      const sorted = [...pharmacies].sort((a, b) => {
        if (newSort === "rating") return b.userRating - a.userRating;
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      });
      setPharmacies(sorted);
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
          <h1 style={styles.title}>📍 Nearby Pharmacy Suggestions & Inventory Finder</h1>
          <p style={styles.subtitle}>
            Locate licensed pharmacies near you, verify real-time medicine availability, and get direct directions.
          </p>
        </div>

        <button
          style={styles.medDirectoryBtn}
          onClick={() => onNavigate("medicines")}
          title="Search medicines and check drug interactions"
        >
          💊 Medicine Directory & Interactions →
        </button>
      </div>

      {/* Location Status / Permission Banner */}
      <div style={styles.locationBanner}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>
            {locationStatus === "granted" ? "🎯" : locationStatus === "requesting" ? "📡" : "📍"}
          </span>
          <div style={{ fontSize: "13px" }}>
            {locationStatus === "granted" && (
              <span>
                <strong>GPS Location Active:</strong> Sorting licensed pharmacies by real-time distance from your coordinates.
              </span>
            )}
            {locationStatus === "requesting" && (
              <span>Detecting nearby location coordinates...</span>
            )}
            {locationStatus === "denied" && (
              <span>
                <strong>Location Permission Not Granted:</strong> Showing regional pharmacies. You can also search by city or area below.
              </span>
            )}
            {locationStatus === "idle" && (
              <span>Share location for exact distance or enter your neighborhood below.</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            style={styles.locShareBtn}
            onClick={requestUserLocation}
            title="Update distance using GPS"
          >
            🔄 {locationStatus === "granted" ? "Refresh GPS" : "Share My Location"}
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Card */}
      <div style={styles.filterCard}>
        <form onSubmit={handleManualSearch} style={styles.filterForm}>
          {/* Manual Location Input */}
          <div style={styles.formGroup}>
            <label style={styles.label}>City, Neighborhood or Pincode</label>
            <input
              type="text"
              placeholder="e.g. Downtown, Metropolis, 500001..."
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Medicine In-Stock Filter */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Verify Medicine Availability (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Metformin, Lisinopril, Amoxicillin..."
              value={medicineFilter}
              onChange={(e) => setMedicineFilter(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Sort By */}
          <div style={{ ...styles.formGroup, maxWidth: "160px" }}>
            <label style={styles.label}>Sort Results By</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              style={styles.input}
            >
              <option value="distance">Nearest Distance</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" style={styles.searchSubmitBtn}>
              🔍 Search Pharmacies
            </button>
          </div>
        </form>
      </div>

      {/* Data Source & Privacy Disclaimer */}
      <div style={styles.privacyNote}>
        <strong>🔒 Privacy & Data Accuracy Assurance:</strong> Geolocation coordinates are processed strictly in-memory
        to compute distance using great-circle Haversine mathematics and are never stored or logged. Medicine availability
        is displayed as <strong>Verified In-Stock</strong> only when confirmed by an electronic pharmacy inventory source;
        otherwise, direct pharmacy contact numbers are provided.
      </div>

      {/* Results Section */}
      <div style={{ marginTop: "24px" }}>
        <div style={styles.resultsCountHeader}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
            Licensed Pharmacies Available ({pharmacies.length})
          </h3>
          {medicineFilter && (
            <span style={styles.medQueryPill}>
              Filtering for medicine: <strong>{medicineFilter}</strong>
            </span>
          )}
        </div>

        {loading && <div style={styles.messageBox}>Searching nearby pharmacies...</div>}

        {!loading && error && <div style={styles.errorBox}>{error}</div>}

        {!loading && !error && pharmacies.length === 0 && (
          <div style={styles.messageBox}>
            No pharmacies matched your location criteria. Try expanding search radius or clearing filters.
          </div>
        )}

        <div style={styles.pharmacyGrid}>
          {pharmacies.map((pharm) => (
            <div key={pharm.id} style={styles.pharmCard}>
              {/* Card Top */}
              <div style={styles.pharmTop}>
                <div>
                  <h3 style={styles.pharmName}>{pharm.name}</h3>
                  <div style={styles.pharmAddress}>📍 {pharm.address}, {pharm.city}</div>
                </div>

                {pharm.distanceKm != null ? (
                  <div style={styles.distBadge}>
                    <strong>{pharm.distanceKm} km</strong>
                    <span>away</span>
                  </div>
                ) : (
                  <div style={styles.ratingBadge}>⭐ {pharm.userRating}</div>
                )}
              </div>

              {/* Verified Medicine Availability Badge */}
              {pharm.medicineStockStatus !== "N/A" && (
                <div
                  style={{
                    ...styles.stockBanner,
                    backgroundColor:
                      pharm.medicineStockStatus === "CONFIRMED_IN_STOCK"
                        ? "#f0fdf4"
                        : pharm.medicineStockStatus === "OUT_OF_STOCK"
                        ? "#fef2f2"
                        : "#fffbeb",
                    borderColor:
                      pharm.medicineStockStatus === "CONFIRMED_IN_STOCK"
                        ? "#86efac"
                        : pharm.medicineStockStatus === "OUT_OF_STOCK"
                        ? "#fca5a5"
                        : "#fde68a",
                    color:
                      pharm.medicineStockStatus === "CONFIRMED_IN_STOCK"
                        ? "#166534"
                        : pharm.medicineStockStatus === "OUT_OF_STOCK"
                        ? "#991b1b"
                        : "#92400e",
                  }}
                >
                  <small style={{ fontWeight: "700" }}>{pharm.stockConfirmationNote}</small>
                </div>
              )}

              {/* Details & Hours */}
              <div style={styles.pharmMeta}>
                <div style={styles.metaRow}>
                  <span>🕒 Hours:</span>
                  <strong>{pharm.openingHours}</strong>
                  {pharm.open24Hours && <span style={styles.open24Tag}>24/7 OPEN</span>}
                </div>

                <div style={styles.metaRow}>
                  <span>📞 Phone:</span>
                  <a href={`tel:${pharm.phone}`} style={styles.phoneLink}>
                    {pharm.phone}
                  </a>
                </div>

                <div style={styles.metaRow}>
                  <span>⭐ Rating:</span>
                  <span>{pharm.userRating} / 5.0 verified reviews</span>
                </div>
              </div>

              {/* Services Tags */}
              {pharm.services && pharm.services.length > 0 && (
                <div style={styles.servicesWrap}>
                  {pharm.services.map((svc, i) => (
                    <span key={i} style={styles.serviceTag}>
                      ✓ {svc}
                    </span>
                  ))}
                </div>
              )}

              {/* Card Actions */}
              <div style={styles.pharmActions}>
                <a
                  href={`tel:${pharm.phone}`}
                  style={styles.callBtn}
                >
                  📞 Call Pharmacy
                </a>

                {pharm.directionsUrl && (
                  <a
                    href={pharm.directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.directionsBtn}
                  >
                    🗺️ Get Directions →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
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
  medDirectoryBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
  },
  locationBanner: {
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "12px 18px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    color: "#1e40af",
  },
  locShareBtn: {
    backgroundColor: "#1d4ed8",
    color: "#ffffff",
    border: "none",
    padding: "7px 14px",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
  filterCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "18px 20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    marginBottom: "16px",
  },
  filterForm: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },
  formGroup: {
    flex: 1,
    minWidth: "200px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12.5px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    padding: "9px 12px",
    fontSize: "13.5px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    outline: "none",
  },
  searchSubmitBtn: {
    padding: "10px 20px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
  privacyNote: {
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.5",
    backgroundColor: "#f8fafc",
    padding: "10px 14px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    marginBottom: "20px",
  },
  resultsCountHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },
  medQueryPill: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
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
    padding: "14px",
    backgroundColor: "#fef2f2",
    border: "1px solid #f87171",
    borderRadius: "6px",
    color: "#991b1b",
    marginBottom: "16px",
  },
  pharmacyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "20px",
  },
  pharmCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  pharmTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    gap: "10px",
  },
  pharmName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  pharmAddress: {
    fontSize: "12.5px",
    color: "#64748b",
  },
  distBadge: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "6px 10px",
    borderRadius: "8px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    fontSize: "13px",
  },
  ratingBadge: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: "700",
  },
  stockBanner: {
    border: "1px solid",
    borderRadius: "6px",
    padding: "8px 10px",
    marginBottom: "12px",
    fontSize: "12px",
  },
  pharmMeta: {
    fontSize: "13px",
    color: "#334155",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "14px",
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  open24Tag: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "700",
  },
  phoneLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },
  servicesWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "16px",
  },
  serviceTag: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "3px 8px",
    borderRadius: "4px",
    fontSize: "11px",
  },
  pharmActions: {
    display: "flex",
    gap: "10px",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "14px",
  },
  callBtn: {
    flex: 1,
    textAlign: "center",
    padding: "8px 12px",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
  },
  directionsBtn: {
    flex: 1,
    textAlign: "center",
    padding: "8px 12px",
    backgroundColor: "#059669",
    color: "#ffffff",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "600",
  },
};

export default PharmacyFinder;

