<<<<<<< HEAD
import { useEffect, useState, useCallback } from "react";

function Appointments({ onNavigate, defaultTab = "appointments" }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const isDoctor = user?.role === "DOCTOR";
  const isPatient = user?.role !== "DOCTOR";

  // Active view tab: "appointments" or "reminders"
  const [activeTab, setActiveTab] = useState(defaultTab || "appointments");

  // Keep active tab in sync if defaultTab prop changes from parent
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState("");

  const [department, setDepartment] = useState("");
  const [departmentDoctors, setDepartmentDoctors] = useState([]);
  const [loadingDeptDoctors, setLoadingDeptDoctors] = useState(false);

  const [doctor, setDoctor] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [preferredPeriod, setPreferredPeriod] = useState("any"); // "any", "morning", "afternoon"
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Available slots & AI recommendations
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Reminders
  const [reminders, setReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [scanningReminders, setScanningReminders] = useState(false);

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [doctorFilter, setDoctorFilter] = useState("my"); // "my" or "all"

  // Medical Record modal state
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [submittingRecord, setSubmittingRecord] = useState(false);
  const [recordForm, setRecordForm] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    appointmentId: "",
    diagnosis: "",
    symptoms: "",
    treatment: "",
    prescription: "",
    testResults: "",
    visitDate: new Date().toISOString().split("T")[0],
  });

  // Feedback notification
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 5500);
  };

  // Helper for resilient fetch (attempts relative endpoint and immediately falls back to direct localhost:8080)
  const apiFetch = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const directUrl = path.startsWith("http") ? path : `http://localhost:8080${cleanPath}`;

    try {
      const res = await fetch(path, { ...options, headers });
      // If OK, or intentional backend validation error (400) or appointment conflict (409)
      if (res.ok || res.status === 400 || res.status === 409) {
        return res;
      }
      // If proxy returned 404, 500, 502, 503, 504, attempt direct backend port 8080
      if (!path.startsWith("http")) {
        const directRes = await fetch(directUrl, { ...options, headers });
        return directRes;
      }
      return res;
    } catch {
      // Network failure on relative request, attempt direct localhost:8080 fallback
      if (!path.startsWith("http")) {
        try {
          return await fetch(directUrl, { ...options, headers });
        } catch {
          return await fetch(`http://127.0.0.1:8080${cleanPath}`, { ...options, headers });
        }
      }
      throw new Error("Unable to connect to backend server");
    }
  };

  // Deduplication Helpers
  const deduplicateDoctors = (list) => {
    const seen = new Set();
    return list.filter((doc) => {
      const idKey = doc.doctorId ? `id_${doc.doctorId}` : null;
      const key = `${(doc.fullName || "").trim().toLowerCase()}_${(doc.specialization || "").trim().toLowerCase()}`;
      if (idKey && seen.has(idKey)) return false;
      if (seen.has(key)) return false;
      if (idKey) seen.add(idKey);
      if (key !== "_") seen.add(key);
      return true;
    });
  };

  const deduplicatePatients = (list) => {
    const seen = new Set();
    return list.filter((p) => {
      const id = p.patientId ? `id_${p.patientId}` : null;
      const key = `${(p.fullName || "").trim().toLowerCase()}_${(p.email || "").trim().toLowerCase()}`;
      if (id && seen.has(id)) return false;
      if (seen.has(key)) return false;
      if (id) seen.add(id);
      if (key !== "_") seen.add(key);
      return true;
    });
  };

  const deduplicateAppointments = (list) => {
    const seen = new Set();
    return list.filter((apt) => {
      const id = apt.appointmentId ? `id_${apt.appointmentId}` : null;
      const key = `${apt.patientId}_${apt.doctorId}_${apt.appointmentDate}_${apt.appointmentTime}`;
      if (id && seen.has(id)) return false;
      if (seen.has(key)) return false;
      if (id) seen.add(id);
      seen.add(key);
      return true;
    });
  };

  // 1. Fetch Specializations / Departments on Mount
  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    setDepartmentError("");
    try {
      let res = await apiFetch("/api/doctors/specializations");
      if (!res.ok) {
        res = await apiFetch("/api/specializations");
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
          setDepartmentError("");
          return;
        }
      }
      // If specializations endpoint is empty or not yet ready, fetch doctors to extract
      const docRes = await apiFetch("/api/doctors");
      if (docRes.ok) {
        const docData = await docRes.json();
        if (Array.isArray(docData) && docData.length > 0) {
          const specs = Array.from(
            new Set(docData.map((d) => d.specialization).filter((s) => s && s.trim() !== ""))
          ).sort((a, b) => a.localeCompare(b));
          if (specs.length > 0) {
            setDepartments(specs);
            setDepartmentError("");
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Unable to load specializations directly:", err);
      setDepartmentError("Could not connect to backend to load specializations. Verify MySQL and Spring Boot are running on port 8080.");
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  // 2. Fetch All Doctors & Patients independently
  const fetchDoctorsData = useCallback(async () => {
    setLoadingDoctors(true);
    try {
      const res = await apiFetch("/api/doctors");
      if (res.ok) {
        const data = await res.json();
        const cleanDocs = deduplicateDoctors(Array.isArray(data) ? data : []);
        setDoctors(cleanDocs);

        // Always ensure departments are populated from doctors if departments state is empty
        setDepartments((prev) => {
          if (prev.length > 0) return prev;
          return Array.from(
            new Set(cleanDocs.map((d) => d.specialization).filter((s) => s && s.trim() !== ""))
          ).sort((a, b) => a.localeCompare(b));
        });
        setDepartmentError("");
      } else {
        console.warn("Backend /api/doctors returned status:", res.status);
        if (res.status === 0 || !res.status) {
          setDepartmentError("Cannot reach backend server. Please verify MySQL and Spring Boot are running on port 8080.");
        }
      }
    } catch (err) {
      console.error("Error fetching doctors list:", err);
      setDepartmentError("Cannot reach backend server. Please verify MySQL and Spring Boot are running on port 8080.");
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  const fetchPatientsData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch("/api/patients");
      if (res.ok) {
        const data = await res.json();
        setPatients(deduplicatePatients(Array.isArray(data) ? data : []));
      }
    } catch (err) {
      console.warn("Non-critical: patients list not accessible for current role:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
    fetchDoctorsData();
    fetchPatientsData();
  }, [fetchDepartments, fetchDoctorsData, fetchPatientsData]);

  // 3. When a Department is Selected: fetch doctors for that specialization
  useEffect(() => {
    if (!department) {
      setDepartmentDoctors([]);
      return;
    }

    const fetchDoctorsForDept = async () => {
      setLoadingDeptDoctors(true);
      try {
        let res = await apiFetch(`/api/doctors/specialization/${encodeURIComponent(department)}`);
        if (!res.ok) {
          res = await apiFetch(`/api/doctors/department/${encodeURIComponent(department)}`);
        }
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDepartmentDoctors(deduplicateDoctors(data));
            return;
          }
        }
        // Fallback to filtering the preloaded doctors with flexible matching
        const cleanDept = department.trim().toLowerCase();
        const fallback = doctors.filter((d) => {
          if (!d.specialization) return false;
          const s = d.specialization.trim().toLowerCase();
          return s === cleanDept || s.includes(cleanDept) || cleanDept.includes(s);
        });
        setDepartmentDoctors(fallback);
      } catch (err) {
        console.warn("Specialization fetch fallback:", err);
        const cleanDept = department.trim().toLowerCase();
        const fallback = doctors.filter((d) => {
          if (!d.specialization) return false;
          const s = d.specialization.trim().toLowerCase();
          return s === cleanDept || s.includes(cleanDept) || cleanDept.includes(s);
        });
        setDepartmentDoctors(fallback);
      } finally {
        setLoadingDeptDoctors(false);
      }
    };

    fetchDoctorsForDept();
  }, [department, doctors]);

  const [patientProfileId, setPatientProfileId] = useState(user?.patientId || null);

  // Auto-resolve patient record by email if not already present in stored user
  useEffect(() => {
    if (isPatient && user?.email && !patientProfileId) {
      apiFetch(`/api/patients/by-email/${encodeURIComponent(user.email)}`)
        .then(async (res) => {
          if (res.ok) {
            const pat = await res.json();
            if (pat && pat.patientId) {
              setPatientProfileId(pat.patientId);
              try {
                const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                storedUser.patientId = pat.patientId;
                localStorage.setItem("user", JSON.stringify(storedUser));
              } catch (e) {
                console.warn("Could not cache patientId:", e);
              }
            }
          }
        })
        .catch((err) => console.warn("Patient lookup by email error:", err));
    }
  }, [isPatient, user?.email, patientProfileId]);

  // Resolve matching patient ID
  const matchedPatient = patients.find(
    (p) =>
      (patientProfileId && String(p.patientId) === String(patientProfileId)) ||
      (user?.patientId && String(p.patientId) === String(user.patientId)) ||
      (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()) ||
      (p.fullName && user.fullName && p.fullName.trim().toLowerCase() === user.fullName.trim().toLowerCase())
  );
  const resolvedPatientId = patientProfileId || user?.patientId || matchedPatient?.patientId || null;

  // 4. Fetch Appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoadingAppointments(true);
      let url = "/api/appointments";
      if (isPatient && resolvedPatientId) {
        url = `/api/appointments/patient/${resolvedPatientId}`;
      }

      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        setAppointments(deduplicateAppointments(Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [isPatient, resolvedPatientId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 5. Fetch Reminders for Patient
  const fetchReminders = useCallback(async () => {
    if (!resolvedPatientId) return;
    try {
      setLoadingReminders(true);
      const response = await apiFetch(`/api/reminders/patient/${resolvedPatientId}`);
      if (response.ok) {
        const data = await response.json();
        setReminders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching reminders:", e);
    } finally {
      setLoadingReminders(false);
    }
  }, [resolvedPatientId]);

  useEffect(() => {
    if (activeTab === "reminders") {
      fetchReminders();
    }
  }, [activeTab, fetchReminders]);

  // Trigger on-demand reminder scan
  const handleScanReminders = async () => {
    try {
      setScanningReminders(true);
      const response = await apiFetch("/api/reminders/scan-now", {
        method: "POST",
      });
      if (response.ok) {
        const result = await response.json();
        showFeedback("success", result.message || "Reminder scan executed successfully!");
        fetchReminders();
      } else {
        throw new Error("Reminder scan request failed.");
      }
    } catch (err) {
      console.error("Error running reminder check:", err);
      showFeedback("error", "Unable to trigger reminder check.");
    } finally {
      setScanningReminders(false);
    }
  };

  // 6. Query Available Slots when Doctor & Date change
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      const selectedDocId = isDoctor ? (doctor || doctors[0]?.doctorId) : doctor;
      if (!selectedDocId || !date) {
        setAvailableSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        const url = `/api/appointments/available-slots?doctorId=${selectedDocId}&date=${date}&preferredPeriod=${preferredPeriod}`;
        const res = await apiFetch(url);

        if (res.ok) {
          const slots = await res.json();
          const cleanSlots = Array.isArray(slots) ? slots : [];
          if (cleanSlots.length > 0) {
            setAvailableSlots(cleanSlots);

            // Auto-select AI recommended slot if no slot selected or current slot is booked
            const recommended = cleanSlots.find((s) => s.recommended && s.available);
            if (recommended && (!time || !cleanSlots.find((s) => s.slotTime === time && s.available))) {
              setTime(recommended.slotTime);
            }
            return;
          }
        }
        // Fallback default slots if backend endpoint isn't ready
        const defaultSlots = [
          { slotTime: "09:00:00", formattedTime: "09:00 AM", available: true, recommended: true, recommendationReason: "✨ AI Recommended: Ideal morning consultation" },
          { slotTime: "10:00:00", formattedTime: "10:00 AM", available: true, recommended: false },
          { slotTime: "11:00:00", formattedTime: "11:00 AM", available: true, recommended: true, recommendationReason: "✨ AI Recommended: High convenience slot" },
          { slotTime: "14:00:00", formattedTime: "02:00 PM", available: true, recommended: false },
          { slotTime: "15:00:00", formattedTime: "03:00 PM", available: true, recommended: true, recommendationReason: "✨ AI Recommended: Optimal afternoon slot" },
          { slotTime: "16:00:00", formattedTime: "04:00 PM", available: true, recommended: false },
          { slotTime: "17:00:00", formattedTime: "05:00 PM", available: true, recommended: false },
        ];
        setAvailableSlots(defaultSlots);
        if (!time) setTime("09:00:00");
      } catch (err) {
        console.warn("Unable to fetch available-slots from backend:", err);
        const defaultSlots = [
          { slotTime: "09:00:00", formattedTime: "09:00 AM", available: true, recommended: true, recommendationReason: "✨ AI Recommended: Morning consultation" },
          { slotTime: "10:00:00", formattedTime: "10:00 AM", available: true, recommended: false },
          { slotTime: "11:00:00", formattedTime: "11:00 AM", available: true, recommended: true, recommendationReason: "✨ AI Recommended: Prime consultation slot" },
          { slotTime: "14:00:00", formattedTime: "02:00 PM", available: true, recommended: false },
          { slotTime: "15:00:00", formattedTime: "03:00 PM", available: true, recommended: true, recommendationReason: "✨ AI Recommended: Afternoon consultation" },
          { slotTime: "16:00:00", formattedTime: "04:00 PM", available: true, recommended: false },
          { slotTime: "17:00:00", formattedTime: "05:00 PM", available: true, recommended: false },
        ];
        setAvailableSlots(defaultSlots);
        if (!time) setTime("09:00:00");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [doctor, date, preferredPeriod, isDoctor, doctors]);

  // Query Slots for Reschedule Modal
  useEffect(() => {
    const fetchRescheduleSlots = async () => {
      if (!reschedulingAppointment || !rescheduleDate) {
        setRescheduleSlots([]);
        return;
      }

      try {
        setLoadingRescheduleSlots(true);
        const url = `/api/appointments/available-slots?doctorId=${reschedulingAppointment.doctorId}&date=${rescheduleDate}`;
        const res = await apiFetch(url);

        if (res.ok) {
          const slots = await res.json();
          setRescheduleSlots(Array.isArray(slots) ? slots : []);
          const rec = slots.find((s) => s.recommended && s.available);
          if (rec) setRescheduleTime(rec.slotTime);
        }
      } catch (err) {
        console.error("Error fetching reschedule slots:", err);
      } finally {
        setLoadingRescheduleSlots(false);
      }
    };

    fetchRescheduleSlots();
  }, [reschedulingAppointment, rescheduleDate]);

  // Doctor helper
  const loggedInDoctor = doctors.find(
    (doc) =>
      (doc.email && user?.email && doc.email.toLowerCase() === user.email.toLowerCase()) ||
      (doc.fullName && user?.fullName && doc.fullName.toLowerCase() === user.fullName.toLowerCase())
  );

  useEffect(() => {
    if (isDoctor && !doctor) {
      if (loggedInDoctor) {
        setDoctor(String(loggedInDoctor.doctorId));
      } else if (doctors.length > 0) {
        setDoctor(String(doctors[0].doctorId));
      }
    }
  }, [isDoctor, loggedInDoctor, doctors, doctor]);

  const displayedAppointments = isDoctor
    ? doctorFilter === "my" && loggedInDoctor
      ? appointments.filter((apt) => String(apt.doctorId) === String(loggedInDoctor.doctorId))
      : appointments
    : appointments;

  const convertTime = (timeValue) => {
    if (!timeValue) return "10:00:00";
    const parts = timeValue.split(" ");
    if (parts.length === 2) {
      const [timePart, period] = parts;
      let [hours, minutes] = timePart.split(":");
      hours = Number(hours);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return `${String(hours).padStart(2, "0")}:${minutes}:00`;
    }
    return timeValue;
  };

  // Book Appointment
  const handleBookAppointment = async () => {
    if (!date) {
      showFeedback("error", "Please select a consultation Date.");
      return;
    }
    if (!time) {
      showFeedback("error", "Please select an available Time Slot.");
      return;
    }

    // Past date check
    const todayStr = new Date().toISOString().split("T")[0];
    if (date < todayStr) {
      showFeedback("error", "Cannot schedule an appointment for a past date.");
      return;
    }

    let appointmentPatientId;
    let appointmentDoctorId;

    if (isDoctor) {
      if (!selectedPatientId) {
        showFeedback("error", "Please select a Patient.");
        return;
      }
      appointmentPatientId = Number(selectedPatientId);
      appointmentDoctorId = Number(doctor || loggedInDoctor?.doctorId || doctors[0]?.doctorId);
      if (!appointmentDoctorId) {
        showFeedback("error", "Please select a Doctor.");
        return;
      }
    } else {
      if (!doctor) {
        showFeedback("error", "Please select a Doctor.");
        return;
      }
      const selectedDoc = (departmentDoctors.length > 0 ? departmentDoctors : doctors).find(
        (doc) => String(doc.doctorId) === String(doctor)
      );
      if (!selectedDoc) {
        showFeedback("error", "Please select a valid Doctor.");
        return;
      }
      if (!department && selectedDoc.specialization) {
        setDepartment(selectedDoc.specialization);
      }
      if (!resolvedPatientId) {
        showFeedback("error", "Unable to determine your patient profile. Please ensure your patient record exists.");
        return;
      }
      appointmentPatientId = Number(resolvedPatientId);
      appointmentDoctorId = selectedDoc.doctorId;
    }

    const appointmentData = {
      patientId: Number(appointmentPatientId),
      doctorId: Number(appointmentDoctorId),
      appointmentDate: date,
      appointmentTime: convertTime(time),
      status: "Booked",
    };

    try {
      setBookingInProgress(true);
      const response = await apiFetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        let errorMessage = "";
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.message || errorJson.error || "";
        } catch {
          try {
            errorMessage = await response.text();
          } catch {
            errorMessage = "";
          }
        }

        if (!errorMessage) {
          if (response.status === 409) {
            errorMessage = "Scheduling Conflict: The selected doctor or time slot is already booked. Please choose an alternate slot.";
          } else if (response.status === 400) {
            errorMessage = "Invalid Booking Request: Please verify doctor, date, and time selections.";
          } else if (response.status === 403) {
            errorMessage = "Access Denied: You do not have permission to book this appointment.";
          } else if (response.status >= 500) {
            errorMessage = "Server Error: Unable to save appointment to database. Please verify backend service.";
          } else {
            errorMessage = `Booking failed with HTTP status ${response.status}.`;
          }
        }
        throw new Error(errorMessage);
      }

      const newAppointment = await response.json();
      setAppointments((previous) => deduplicateAppointments([newAppointment, ...previous]));

      if (!isDoctor) {
        setDepartment("");
        setDoctor("");
      }
      setSelectedPatientId("");
      setDate("");
      setTime("");
      setAvailableSlots([]);

      showFeedback(
        "success",
        `Appointment scheduled successfully for ${newAppointment.appointmentDate} at ${formatTime(newAppointment.appointmentTime)}! Automated 24-hr and 1-hr reminders have been configured.`
      );
    } catch (error) {
      console.error("Error booking appointment:", error);
      showFeedback("error", error.message || "Unable to schedule appointment. Please try another slot.");
    } finally {
      setBookingInProgress(false);
    }
  };

  // Open Reschedule Modal
  const openRescheduleModal = (appointment) => {
    setReschedulingAppointment(appointment);
    setRescheduleDate(appointment.appointmentDate || new Date().toISOString().split("T")[0]);
    setRescheduleTime(appointment.appointmentTime || "");
    setShowRescheduleModal(true);
  };

  // Confirm Reschedule
  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select both a new date and available time slot.");
      return;
    }

    try {
      setSubmittingReschedule(true);
      const res = await apiFetch(`/api/appointments/${reschedulingAppointment.appointmentId}/reschedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate: rescheduleDate,
          appointmentTime: convertTime(rescheduleTime),
        }),
      });

      if (!res.ok) {
        let errMessage = "";
        try {
          const errData = await res.json();
          errMessage = errData.message || errData.error || "";
        } catch {
          try {
            errMessage = await res.text();
          } catch {
            errMessage = "";
          }
        }
        if (!errMessage) {
          errMessage = res.status === 409
            ? "Scheduling Conflict: The chosen slot is already booked."
            : `Rescheduling failed with HTTP ${res.status}.`;
        }
        throw new Error(errMessage);
      }

      const updated = await res.json();
      setAppointments((prev) =>
        prev.map((item) => (item.appointmentId === updated.appointmentId ? updated : item))
      );
      setShowRescheduleModal(false);
      showFeedback(
        "success",
        `Appointment successfully rescheduled to ${updated.appointmentDate} at ${formatTime(updated.appointmentTime)}!`
      );
    } catch (err) {
      console.error("Reschedule failed:", err);
      alert(err.message || "Rescheduling failed.");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async (appointment) => {
    if (!window.confirm(`Are you sure you want to cancel your appointment on ${formatDate(appointment.appointmentDate)}?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/appointments/${appointment.appointmentId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Patient cancelled via portal" }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to cancel appointment.");
      }

      const cancelled = await res.json();
      setAppointments((prev) =>
        prev.map((item) => (item.appointmentId === cancelled.appointmentId ? cancelled : item))
      );
      showFeedback("success", `Appointment #${appointment.appointmentId} has been cancelled.`);
    } catch (err) {
      console.error("Cancel failed:", err);
      alert(err.message || "Unable to cancel appointment.");
    }
  };

  // Update Status - Doctor
  const updateAppointmentStatus = async (appointment, newStatus) => {
    setUpdatingId(appointment.appointmentId);
    const updatedAppointment = {
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: newStatus,
    };

    try {
      const response = await apiFetch(`/api/appointments/${appointment.appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAppointment),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update appointment status.");
      }

      const updatedData = await response.json();
      setAppointments((prev) =>
        prev.map((item) => (item.appointmentId === appointment.appointmentId ? updatedData : item))
      );
      showFeedback("success", `Appointment #${appointment.appointmentId} marked as ${newStatus}.`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert(error.message || "Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Doctor Medical Record Modal
  const openMedicalRecordModal = (appointment) => {
    const pat = patients.find((p) => String(p.patientId) === String(appointment.patientId));
    setRecordForm({
      patientId: appointment.patientId,
      patientName: pat ? pat.fullName : `Patient #${appointment.patientId}`,
      doctorId: appointment.doctorId,
      appointmentId: appointment.appointmentId,
      diagnosis: "",
      symptoms: "",
      treatment: "",
      prescription: "",
      testResults: "",
      visitDate: appointment.appointmentDate || new Date().toISOString().split("T")[0],
    });
    setShowRecordModal(true);
  };

  const handleSaveMedicalRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.diagnosis.trim()) {
      alert("Please enter a Diagnosis.");
      return;
    }

    try {
      setSubmittingRecord(true);
      const payload = {
        patientId: Number(recordForm.patientId),
        doctorId: Number(recordForm.doctorId),
        appointmentId: recordForm.appointmentId ? Number(recordForm.appointmentId) : null,
        diagnosis: recordForm.diagnosis.trim(),
        symptoms: recordForm.symptoms.trim(),
        treatment: recordForm.treatment.trim(),
        prescription: recordForm.prescription.trim(),
        testResults: recordForm.testResults.trim(),
        visitDate: recordForm.visitDate,
      };

      const response = await apiFetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create medical record.");
      }

      setShowRecordModal(false);
      showFeedback("success", `Medical record created for ${recordForm.patientName} (Appointment #${recordForm.appointmentId})!`);
    } catch (err) {
      console.error("Error saving medical record:", err);
      alert(err.message || "Failed to save medical record.");
    } finally {
      setSubmittingRecord(false);
    }
  };

  // Doctors list for dropdown with flexible matching
  const activeDoctorOptions = isDoctor
    ? doctors
    : departmentDoctors.length > 0
    ? departmentDoctors
    : department
    ? doctors.filter((d) => {
        if (!d.specialization) return false;
        const s = d.specialization.trim().toLowerCase();
        const dep = department.trim().toLowerCase();
        return s === dep || s.includes(dep) || dep.includes(s);
      })
    : doctors;

  const formatDate = (dateValue) => {
    if (!dateValue) return "";
    const dateObject = new Date(dateValue + "T00:00:00");
    if (Number.isNaN(dateObject.getTime())) return dateValue;
    return dateObject.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
=======
import { useEffect, useState } from "react";
import { listDoctors, getAvailability } from "../api/doctors";
import {
  getMyAppointments,
  createAppointment,
  cancelAppointment,
} from "../api/appointments";
import { getMyProfile } from "../api/patients";

const STATUS_STYLES = {
  BOOKED: { color: "#166534", background: "#f0fdf4", border: "#bbf7d0" },
  CANCELLED: { color: "#991b1b", background: "#fef2f2", border: "#fecaca" },
  COMPLETED: { color: "#1e40af", background: "#eff6ff", border: "#bfdbfe" },
};

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function prettyTime(value) {
  return (value || "").slice(0, 5);
}

function ErrorBox({ children }) {
  if (!children) {
    return null;
  }
  return (
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        borderRadius: "8px",
        padding: "12px 16px",
        marginTop: "16px",
        fontSize: "14px",
      }}
    >
      {children}
    </div>
  );
}

function Appointments({ onNavigate, token, initialDoctorId }) {
  const [profileRequired, setProfileRequired] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [doctorsError, setDoctorsError] = useState("");

  const [doctorId, setDoctorId] = useState(
    initialDoctorId ? String(initialDoctorId) : ""
  );
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsState, setSlotsState] = useState("idle");
  const [slotsMessage, setSlotsMessage] = useState("");
  const [selectedStart, setSelectedStart] = useState("");

  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [appointmentsState, setAppointmentsState] = useState("loading");
  const [appointmentsError, setAppointmentsError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Bumping this reloads appointments and availability after a mutation.
  const [reloadKey, setReloadKey] = useState(0);

  // Profile must exist before booking or viewing history.
  useEffect(() => {
    let cancelled = false;

    async function checkProfile() {
      try {
        await getMyProfile(token);
        if (!cancelled) {
          setProfileRequired(false);
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        if (requestError.code === "profile_required") {
          setProfileRequired(true);
        } else {
          setProfileError(
            requestError.message || "Unable to load your profile."
          );
        }
      }
    }

    checkProfile();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        const data = await listDoctors(token);
        if (!cancelled) {
          setDoctors(Array.isArray(data) ? data : []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setDoctorsError(
            requestError.message || "Unable to load doctors right now."
          );
        }
      }
    }

    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      try {
        const data = await getMyAppointments(token);
        if (cancelled) {
          return;
        }
        setAppointments(Array.isArray(data) ? data : []);
        setAppointmentsState("ready");
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        if (requestError.code === "profile_required") {
          setProfileRequired(true);
          setAppointmentsState("ready");
          return;
        }
        setAppointmentsError(
          requestError.message || "Unable to load your appointments."
        );
        setAppointmentsState("error");
      }
    }

    loadAppointments();
    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  useEffect(() => {
    if (!doctorId || !date) {
      return undefined;
    }

    let cancelled = false;

    async function loadSlots() {
      try {
        const data = await getAvailability(doctorId, date, token);
        if (cancelled) {
          return;
        }
        setSlots(Array.isArray(data) ? data : []);
        setSlotsState("ready");
        if (!data || data.length === 0) {
          setSlotsMessage(
            "This doctor has no configured schedule (or no free slots) for the selected date."
          );
        }
      } catch (requestError) {
        if (cancelled) {
          return;
        }
        setSlots([]);
        setSlotsState("error");
        setSlotsMessage(
          requestError.message || "Unable to load availability."
        );
      }
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [doctorId, date, token, reloadKey]);

  const handleDoctorChange = (event) => {
    setDoctorId(event.target.value);
    setSlots([]);
    setSelectedStart("");
    setSlotsMessage("");
    setSlotsState("loading");
  };

  const handleDateChange = (event) => {
    setDate(event.target.value);
    setSlots([]);
    setSelectedStart("");
    setSlotsMessage("");
    setSlotsState("loading");
  };

  const handleBook = async () => {
    if (isBooking) {
      return;
    }
    if (profileRequired) {
      setBookingError("Please complete your profile before booking.");
      return;
    }
    if (!doctorId || !date || !selectedStart) {
      setBookingError("Please choose a doctor, date and available time.");
      return;
    }

    setBookingError("");
    setBookingSuccess("");
    setIsBooking(true);

    try {
      const created = await createAppointment(
        { doctorId: Number(doctorId), date, startTime: selectedStart },
        token
      );
      setBookingSuccess(
        `Appointment booked with ${created.doctorName || "the doctor"} on ${created.appointmentDate} at ${prettyTime(created.appointmentTime)}.`
      );
      setSelectedStart("");
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      if (requestError.code === "profile_required") {
        setProfileRequired(true);
        setBookingError("Please complete your profile before booking.");
      } else if (requestError.code === "slot_conflict") {
        setBookingError(
          "That slot was just taken. Please pick another available time."
        );
        setReloadKey((value) => value + 1);
      } else {
        setBookingError(
          requestError.message || "Unable to book the appointment."
        );
      }
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (cancellingId) {
      return;
    }
    setCancellingId(appointmentId);
    setAppointmentsError("");
    try {
      await cancelAppointment(appointmentId, token);
      setReloadKey((value) => value + 1);
    } catch (requestError) {
      setAppointmentsError(
        requestError.message || "Unable to cancel the appointment."
      );
    } finally {
      setCancellingId(null);
    }
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return "";
    const [hours, minutes] = timeValue.split(":");
    let hour = Number(hours);
    const period = hour >= 12 ? "PM" : "AM";
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    return `${String(hour).padStart(2, "0")}:${minutes} ${period}`;
  };

  const bookedCount = displayedAppointments.filter((a) => a.status === "Booked" || a.status === "Rescheduled").length;
  const completedCount = displayedAppointments.filter((a) => a.status === "Completed").length;
  const cancelledCount = displayedAppointments.filter((a) => a.status === "Cancelled").length;

  return (
    <div className="page-container">
      {/* FEEDBACK TOAST */}
      {feedback.message && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            backgroundColor: feedback.type === "error" ? "#fee2e2" : "#dcfce7",
            color: feedback.type === "error" ? "#991b1b" : "#166534",
            border: `1px solid ${feedback.type === "error" ? "#f87171" : "#86efac"}`,
            fontWeight: "600",
          }}
        >
          {feedback.type === "error" ? "⚠️ " : "✅ "}
          {feedback.message}
        </div>
      )}

<<<<<<< HEAD
      {/* HEADER WITH PERSISTENT TABS */}
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => onNavigate("dashboard")}>
            ← Back to Dashboard
          </button>
          <h1>{isDoctor ? "👨‍⚕️ Doctor Appointments" : "📅 Smart Appointments & Reminders"}</h1>
          <p>
            {isDoctor
              ? "Schedule, manage availability slots, and track consultation history."
              : "AI-assisted appointment booking with slot recommendation and automated 24h & 1h reminders."}
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setActiveTab("appointments")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: activeTab === "appointments" ? "#087b9c" : "#e2e8f0",
              color: activeTab === "appointments" ? "#ffffff" : "#475569",
              transition: "all 0.2s ease",
            }}
          >
            📅 Appointments ({displayedAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab("reminders")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              backgroundColor: activeTab === "reminders" ? "#087b9c" : "#e2e8f0",
              color: activeTab === "reminders" ? "#ffffff" : "#475569",
              transition: "all 0.2s ease",
            }}
          >
            🔔 Reminders ({reminders.length})
          </button>
        </div>
      </div>

      {/* SUBTAB: APPOINTMENT REMINDERS VIEW */}
      {activeTab === "reminders" && (
        <section style={{ backgroundColor: "#ffffff", padding: "26px", borderRadius: "14px", marginBottom: "30px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", color: "#172033" }}>
                🔔 Automated Appointment Reminders
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
                Automated 24-hour and 1-hour notifications with doctor details, clinic location, and consultation advice.
              </p>
            </div>

            <button
              onClick={handleScanReminders}
              disabled={scanningReminders}
              style={{
                backgroundColor: "#0284c7",
                color: "#ffffff",
                border: "none",
                padding: "10px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "13px",
              }}
            >
              {scanningReminders ? "⏳ Checking Reminders..." : "⚡ Scan & Check Reminders Now"}
            </button>
          </div>

          {loadingReminders && <p style={{ color: "#64748b" }}>Loading reminders...</p>}

          {!loadingReminders && reminders.length === 0 && (
            <div style={{ padding: "34px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b", border: "1px dashed #cbd5e1" }}>
              <span style={{ fontSize: "36px", display: "block", marginBottom: "8px" }}>🔔</span>
              <p style={{ fontSize: "16px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                No automated reminders recorded yet.
              </p>
              <p style={{ fontSize: "13.5px", color: "#64748b", maxWidth: "480px", margin: "0 auto" }}>
                Reminders are generated automatically 24 hours and 1 hour prior to your upcoming consultations. When you schedule an appointment, notifications will appear here.
              </p>
            </div>
          )}
=======
      <div className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back to Dashboard
          </button>

          <h1>Appointments</h1>
          <p>Book and manage your doctor appointments</p>
        </div>
      </div>

      {profileRequired && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          You need a patient profile before you can book appointments.{" "}
          <button className="back-button" onClick={() => onNavigate("profile")}>
            Set up my profile
          </button>
        </div>
      )}

      <ErrorBox>{profileError}</ErrorBox>

      {/* Booking */}
      <section className="appointment-form-card">
        <h2>Book New Appointment</h2>

        <p className="form-description">
          Slots shown are computed by the server from the doctor&apos;s real
          schedule, time off and existing bookings.
        </p>

        <div className="appointment-form">

          <div className="form-group">
            <label>Doctor</label>
            <select
              value={doctorId}
              onChange={handleDoctorChange}
              disabled={isBooking}
            >
              <option value="">Select Doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.fullName}
                  {doctor.specialization ? ` — ${doctor.specialization}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              min={localToday()}
              onChange={handleDateChange}
              disabled={isBooking}
            />
          </div>

        </div>

        {doctorsError && <ErrorBox>{doctorsError}</ErrorBox>}

        <div style={{ marginTop: "18px" }}>
          <label style={{ fontWeight: 600 }}>Available Time</label>

          {(!doctorId || !date) && (
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              Choose a doctor and a date to see available slots.
            </p>
          )}

          {slotsState === "loading" && (
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              Loading available slots…
            </p>
          )}

          {slotsState === "error" && <ErrorBox>{slotsMessage}</ErrorBox>}

          {slotsState === "ready" && slots.length === 0 && (
            <p
              style={{
                fontSize: "14px",
                color: "#92400e",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              {slotsMessage ||
                "No available slots for this doctor on the selected date."}
            </p>
          )}

          {slotsState === "ready" && slots.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {slots.map((slot) => {
                const value = slot.start;
                const active = value === selectedStart;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedStart(value)}
                    disabled={isBooking}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: active ? 700 : 500,
                      color: active ? "#ffffff" : "#166534",
                      background: active ? "#16a34a" : "#f0fdf4",
                      border: `1px solid ${active ? "#16a34a" : "#bbf7d0"}`,
                    }}
                  >
                    {prettyTime(value)} – {prettyTime(slot.end)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <ErrorBox>{bookingError}</ErrorBox>

        {bookingSuccess && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              borderRadius: "8px",
              padding: "12px 16px",
              marginTop: "16px",
              fontSize: "14px",
            }}
          >
            {bookingSuccess}
          </div>
        )}

        <button
          className="primary-button book-button"
          onClick={handleBook}
          disabled={isBooking || !selectedStart || profileRequired}
          style={{ marginTop: "18px" }}
        >
          {isBooking ? "Booking..." : "Book Appointment"}
        </button>
      </section>

      {/* History */}
      <section className="appointments-list" style={{ marginTop: "28px" }}>
        <div className="section-title">
          <h2>My Appointments</h2>
        </div>

        {appointmentsState === "loading" && (
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Loading your appointments…
          </p>
        )}

        <ErrorBox>{appointmentsError}</ErrorBox>

        {appointmentsState === "ready" && appointments.length === 0 && (
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            You have no appointments yet.
          </p>
        )}

        {appointments.map((appointment) => {
          const style =
            STATUS_STYLES[appointment.status] || STATUS_STYLES.COMPLETED;
          const cancellable = appointment.status === "BOOKED";
          return (
            <div className="appointment-item" key={appointment.appointmentId}>
              <div className="doctor-icon">🩺</div>

              <div className="doctor-info">
                <h3>
                  {appointment.doctorName || `Doctor #${appointment.doctorId}`}
                </h3>
                <p>{appointment.specialization}</p>
              </div>

              <div className="appointment-date">
                <strong>{appointment.appointmentDate}</strong>
                <span>{prettyTime(appointment.appointmentTime)}</span>
              </div>

              <span
                className="status"
                style={{
                  color: style.color,
                  background: style.background,
                  border: `1px solid ${style.border}`,
                }}
              >
                {appointment.status}
              </span>

              {cancellable && (
                <button
                  className="back-button"
                  onClick={() => handleCancel(appointment.appointmentId)}
                  disabled={cancellingId === appointment.appointmentId}
                  style={{ marginLeft: "12px" }}
                >
                  {cancellingId === appointment.appointmentId
                    ? "Cancelling..."
                    : "Cancel"}
                </button>
              )}
            </div>
          );
        })}
      </section>
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1

          {!loadingReminders && reminders.length > 0 && (
            <div style={{ display: "grid", gap: "14px" }}>
              {reminders.map((rem) => (
                <div
                  key={rem.reminderId}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "18px 20px",
                    backgroundColor: rem.reminderType === "HOUR_1" ? "#fffbeb" : "#f0fdf4",
                    borderLeft: `5px solid ${rem.reminderType === "HOUR_1" ? "#f59e0b" : "#10b981"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>{rem.reminderType === "HOUR_1" ? "⏰" : "📅"}</span>
                      <strong style={{ color: "#1e293b", fontSize: "15.5px" }}>
                        {rem.reminderType === "HOUR_1" ? "1-Hour Urgent Reminder" : "24-Hour Consultation Reminder"}
                      </strong>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                          padding: "3px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {rem.deliveryStatus || "IN_APP_ACTIVE"}
                      </span>
                      <span style={{ fontSize: "12px", backgroundColor: "#ffffff", padding: "4px 8px", borderRadius: "6px", color: "#475569", border: "1px solid #e2e8f0" }}>
                        Logged: {new Date(rem.sentAt).toLocaleString("en-GB")}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: "8px 0 12px", fontSize: "14px", color: "#334155", lineHeight: "1.5" }}>
                    {rem.message}
                  </p>

                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "12.5px", color: "#64748b", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "8px" }}>
                    <span>👨‍⚕️ <strong>Doctor:</strong> {rem.doctorName} ({rem.doctorSpecialization})</span>
                    <span>📍 <strong>Location:</strong> {rem.clinicDetails}</span>
                    <span>🕒 <strong>Consultation Time:</strong> {formatDate(rem.appointmentDate)} at {formatTime(rem.appointmentTime)}</span>
                    <span>📡 <strong>Channel:</strong> {rem.channel || "In-App Notification"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* APPOINTMENTS TAB MAIN CONTENT */}
      {activeTab === "appointments" && (
        <>
          {/* STATISTICS */}
          <div className="appointment-stats">
            <div className="stat-card">
              <span className="stat-icon">📅</span>
              <div>
                <p>{isDoctor ? "Booked / Scheduled" : "Upcoming Consultations"}</p>
                <h2>{bookedCount}</h2>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div>
                <p>Completed</p>
                <h2>{completedCount}</h2>
              </div>
            </div>

            <div className="stat-card">
              <span className="stat-icon">❌</span>
              <div>
                <p>Cancelled</p>
                <h2>{cancelledCount}</h2>
              </div>
            </div>
          </div>

          {/* APPOINTMENT SCHEDULING FORM CARD */}
          <section className="appointment-form-card" style={{ marginBottom: "30px" }}>
            <h2>{isDoctor ? "Schedule New Patient Appointment" : "📅 AI-Assisted Appointment Booking"}</h2>

            <p className="form-description">
              {isDoctor
                ? "Select patient, doctor, and date to inspect available time slots and avoid double-booking."
                : "Select clinical department and doctor to inspect real-time slot availability with smart AI slot recommendations."}
            </p>

            {/* ERROR BANNER IF SERVER/DB IS UNREACHABLE */}
            {departmentError && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  marginBottom: "16px",
                  fontSize: "13.5px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>⚠️ {departmentError}</span>
                <button
                  type="button"
                  onClick={() => {
                    fetchDepartments();
                    fetchDoctorsData();
                  }}
                  style={{
                    backgroundColor: "#991b1b",
                    color: "#ffffff",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  🔄 Retry Connection
                </button>
              </div>
            )}

            <div className="appointment-form">
              {/* DOCTOR VIEW: PATIENT SELECTOR */}
              {isDoctor && (
                <div className="form-group">
                  <label>Select Patient *</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.fullName} (ID: #{p.patientId} | {p.phone || "No phone"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* PATIENT VIEW: DEPARTMENT / SPECIALIZATION SELECTOR */}
              {!isDoctor && (
                <div className="form-group">
                  <label>Department / Specialization *</label>
                  <select
                    value={department}
                    onChange={(e) => {
                      const selectedDept = e.target.value;
                      setDepartment(selectedDept);
                      setDoctor("");
                      setTime("");
                      setAvailableSlots([]);
                      if (!date) {
                        setDate(new Date().toISOString().split("T")[0]);
                      }
                    }}
                    disabled={loadingDepartments}
                  >
                    <option value="">
                      {loadingDepartments
                        ? "Loading Departments / Specializations..."
                        : departments.length === 0
                        ? "No departments found (Server offline)"
                        : "-- Select Department / Specialization --"}
                    </option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        🏥 {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* DOCTOR SELECTOR */}
              <div className="form-group">
                <label>Doctor *</label>
                <select
                  value={doctor}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setDoctor(selectedId);
                    if (!department && selectedId) {
                      const selectedDoc = (doctors.length > 0 ? doctors : departmentDoctors).find(
                        (d) => String(d.doctorId) === String(selectedId)
                      );
                      if (selectedDoc && selectedDoc.specialization) {
                        setDepartment(selectedDoc.specialization);
                      }
                    }
                    if (!date) {
                      setDate(new Date().toISOString().split("T")[0]);
                    }
                    setTime("");
                    setAvailableSlots([]);
                  }}
                  disabled={loadingDeptDoctors}
                >
                  <option value="">
                    {loadingDeptDoctors
                      ? "Loading doctors for selected department..."
                      : loadingDoctors && doctors.length === 0
                      ? "Loading doctor directory..."
                      : activeDoctorOptions.length === 0
                      ? (department ? `No doctors available in ${department}` : "No doctors found in database")
                      : (department ? `-- Select Doctor in ${department} --` : "-- Select Doctor --")}
                  </option>
                  {activeDoctorOptions.map((doc) => {
                    const docName = (doc.fullName || "").startsWith("Dr.")
                      ? doc.fullName
                      : `Dr. ${doc.fullName}`;
                    return (
                      <option key={doc.doctorId} value={doc.doctorId}>
                        {docName} ({doc.specialization || "General Medicine"}) {doc.experience ? `• ${doc.experience} yrs exp` : ""} {doc.address ? `• ${doc.address}` : ""}
                      </option>
                    );
                  })}
                </select>
                {!isDoctor && department && !loadingDeptDoctors && activeDoctorOptions.length === 0 && (
                  <small style={{ color: "#ef4444", marginTop: "4px", display: "block" }}>
                    No doctors currently available in {department}. Please pick another department.
                  </small>
                )}
                {!isDoctor && !loadingDoctors && doctors.length === 0 && (
                  <small style={{ color: "#ef4444", marginTop: "4px", display: "block" }}>
                    No doctor records found in database. Please ensure MySQL is running and seed data is initialized.
                  </small>
                )}
              </div>

              {/* DATE */}
              <div className="form-group">
                <label>Consultation Date *</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                />
              </div>

              {/* PREFERRED PERIOD FOR AI RECOMMENDATION */}
              <div className="form-group">
                <label>Preferred Time of Day</label>
                <select
                  value={preferredPeriod}
                  onChange={(e) => setPreferredPeriod(e.target.value)}
                >
                  <option value="any">Any Time of Day</option>
                  <option value="morning">Morning (09:00 AM - 12:00 PM)</option>
                  <option value="afternoon">Afternoon (02:00 PM - 05:00 PM)</option>
                </select>
              </div>
            </div>

            {/* REAL-TIME SLOT AVAILABILITY & AI RECOMMENDATIONS */}
            {doctor ? (
              <div style={{ marginTop: "18px", padding: "18px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <strong style={{ fontSize: "14px", color: "#1e293b" }}>
                    {date ? `Select Available Time Slot for ${formatDate(date)}:` : "Select a consultation date above to view slots:"}
                  </strong>
                  {loadingSlots && <span style={{ fontSize: "12px", color: "#64748b" }}>Checking doctor availability & AI recommendations...</span>}
                </div>

                {!date ? (
                  <div style={{ fontSize: "13px", color: "#64748b", padding: "8px 0" }}>
                    📅 Please select a consultation date to view doctor availability and AI-recommended slots.
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {availableSlots.map((slot) => {
                      const isSelected = time === slot.slotTime;
                      return (
                        <button
                          key={slot.slotTime}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setTime(slot.slotTime)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: isSelected ? "2px solid #087b9c" : "1px solid #cbd5e1",
                            backgroundColor: !slot.available
                              ? "#f1f5f9"
                              : isSelected
                              ? "#e0f2fe"
                              : slot.recommended
                              ? "#fef9c3"
                              : "#ffffff",
                            color: !slot.available ? "#94a3b8" : isSelected ? "#0369a1" : "#1e293b",
                            cursor: slot.available ? "pointer" : "not-allowed",
                            fontWeight: isSelected || slot.recommended ? "bold" : "normal",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            boxShadow: isSelected ? "0 2px 6px rgba(8,123,156,0.2)" : "none",
                          }}
                        >
                          <span>{slot.formattedTime}</span>
                          {!slot.available && <small style={{ color: "#ef4444" }}>(Booked)</small>}
                          {slot.available && slot.recommended && (
                            <span style={{ fontSize: "11px", backgroundColor: "#facc15", color: "#78350f", padding: "2px 5px", borderRadius: "4px" }}>
                              ⭐ AI Pick
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : !loadingSlots ? (
                  <div style={{ fontSize: "13px", color: "#ef4444", padding: "8px 0" }}>
                    No consultation slots available for this date. Please select another date.
                  </div>
                ) : null}

                {/* AI RECOMMENDATION EXPLANATION */}
                {availableSlots.find((s) => s.recommended && s.available) && (
                  <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "#fefce8", border: "1px solid #fef08a", borderRadius: "6px", fontSize: "13px", color: "#854d0e" }}>
                    {availableSlots.find((s) => s.recommended).recommendationReason}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: "14px", padding: "12px 16px", backgroundColor: "#f1f5f9", borderRadius: "8px", color: "#64748b", fontSize: "13px" }}>
                👨‍⚕️ Please select a doctor above to inspect available consultation slots and smart AI recommendations.
              </div>
            )}

            <button
              className="primary-button book-button"
              style={{ marginTop: "20px" }}
              disabled={bookingInProgress}
              onClick={handleBookAppointment}
            >
              {bookingInProgress
                ? "Scheduling Appointment..."
                : isDoctor
                ? "Confirm & Schedule Appointment"
                : "Book Appointment"}
            </button>
          </section>

          {/* APPOINTMENTS LIST */}
          <section className="appointments-list">
            <div className="section-title">
              <h2>{isDoctor ? "Patient Appointments List" : "Your Consultation Appointments"}</h2>
            </div>

            {loadingAppointments && <p>Loading appointments...</p>}

            {!loadingAppointments && displayedAppointments.length === 0 && (
              <p>No appointments found.</p>
            )}

            {!loadingAppointments &&
              displayedAppointments.map((appointment) => {
                const selectedDoc = doctors.find((doc) => String(doc.doctorId) === String(appointment.doctorId));
                const patientObj = patients.find((pat) => String(pat.patientId) === String(appointment.patientId));

                return (
                  <div className="appointment-item" key={appointment.appointmentId}>
                    <div className="doctor-icon">{isDoctor ? "👤" : "👨‍⚕️"}</div>

                    <div className="doctor-info">
                      <h3>
                        {isDoctor
                          ? patientObj
                            ? `${patientObj.fullName} (#${patientObj.patientId})`
                            : `Patient #${appointment.patientId}`
                          : selectedDoc
                          ? selectedDoc.fullName
                          : `Doctor ID #${appointment.doctorId}`}
                      </h3>

                      <p>
                        {isDoctor
                          ? patientObj
                            ? `Phone: ${patientObj.phone || "N/A"} | Blood: ${patientObj.bloodGroup || "N/A"}`
                            : "Patient consultation"
                          : selectedDoc
                          ? `${selectedDoc.specialization} • ${selectedDoc.address || "Main OPD Clinic"}`
                          : "Doctor consultation"}
                      </p>
                    </div>

                    <div className="appointment-date">
                      <strong>{formatDate(appointment.appointmentDate)}</strong>
                      <span>{formatTime(appointment.appointmentTime)}</span>
                    </div>

                    {/* STATUS BADGE */}
                    <span
                      className={`status ${
                        appointment.status === "Completed"
                          ? "completed"
                          : appointment.status === "Cancelled"
                          ? "cancelled"
                          : "upcoming"
                      }`}
                    >
                      {appointment.status}
                    </span>

                    {/* PATIENT ACTIONS: RESCHEDULE & CANCEL */}
                    {!isDoctor && appointment.status !== "Completed" && appointment.status !== "Cancelled" && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={() => openRescheduleModal(appointment)}
                          style={{
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "#0369a1",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "12px",
                          }}
                        >
                          🔄 Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment)}
                          style={{
                            border: "1px solid #fecaca",
                            backgroundColor: "#fff1f2",
                            color: "#e11d48",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "12px",
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    )}

                    {/* DOCTOR CONTROLS */}
                    {isDoctor && (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={() => openMedicalRecordModal(appointment)}
                          style={{
                            border: "none",
                            backgroundColor: "#0284c7",
                            color: "#ffffff",
                            padding: "8px 12px",
                            borderRadius: "7px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "12px",
                          }}
                        >
                          📝 Add Record
                        </button>

                        <button
                          onClick={() => updateAppointmentStatus(appointment, "Completed")}
                          disabled={updatingId === appointment.appointmentId || appointment.status === "Completed"}
                          style={{
                            border: "none",
                            backgroundColor: appointment.status === "Completed" ? "#94a3b8" : "#16a34a",
                            color: "#ffffff",
                            padding: "8px 12px",
                            borderRadius: "7px",
                            cursor: appointment.status === "Completed" ? "default" : "pointer",
                            fontWeight: "600",
                            fontSize: "12px",
                          }}
                        >
                          {appointment.status === "Completed" ? "✓ Done" : "Mark Completed"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </section>
        </>
      )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && reschedulingAppointment && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <div style={modalStyles.header}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>
                🔄 Reschedule Appointment #{reschedulingAppointment.appointmentId}
              </h3>
              <button
                style={modalStyles.closeBtn}
                onClick={() => setShowRescheduleModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule}>
              <div style={{ marginBottom: "16px" }}>
                <label style={modalStyles.label}>Select New Consultation Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleTime("");
                  }}
                  style={modalStyles.input}
                  required
                />
              </div>

              {rescheduleDate && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={modalStyles.label}>Select New Available Time Slot *</label>
                  {loadingRescheduleSlots && <p style={{ fontSize: "12px", color: "#64748b" }}>Checking slots...</p>}
                  {!loadingRescheduleSlots && rescheduleSlots.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                      {rescheduleSlots.map((s) => (
                        <button
                          key={s.slotTime}
                          type="button"
                          disabled={!s.available}
                          onClick={() => setRescheduleTime(s.slotTime)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            border: rescheduleTime === s.slotTime ? "2px solid #087b9c" : "1px solid #cbd5e1",
                            backgroundColor: !s.available
                              ? "#f1f5f9"
                              : rescheduleTime === s.slotTime
                              ? "#e0f2fe"
                              : "#ffffff",
                            color: !s.available ? "#94a3b8" : "#1e293b",
                            cursor: s.available ? "pointer" : "not-allowed",
                            fontWeight: rescheduleTime === s.slotTime ? "bold" : "normal",
                          }}
                        >
                          {s.formattedTime} {!s.available && "(Booked)"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  style={modalStyles.cancelBtn}
                  onClick={() => setShowRescheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReschedule || !rescheduleTime}
                  style={modalStyles.submitBtn}
                >
                  {submittingReschedule ? "Rescheduling..." : "Confirm Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR MEDICAL RECORD MODAL */}
      {showRecordModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.content}>
            <div style={modalStyles.header}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>
                📝 Add Medical Record for {recordForm.patientName}
              </h3>
              <button
                style={modalStyles.closeBtn}
                onClick={() => setShowRecordModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMedicalRecord}>
              <div style={{ marginBottom: "12px" }}>
                <label style={modalStyles.label}>Diagnosis *</label>
                <input
                  type="text"
                  placeholder="e.g. Type 2 Diabetes, Acute Bronchitis"
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                  style={modalStyles.input}
                  required
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={modalStyles.label}>Patient Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Fatigue, increased thirst, frequent urination"
                  value={recordForm.symptoms}
                  onChange={(e) => setRecordForm({ ...recordForm, symptoms: e.target.value })}
                  style={modalStyles.input}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={modalStyles.label}>Clinical Treatment & Advice</label>
                <textarea
                  rows="2"
                  value={recordForm.treatment}
                  onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                  style={modalStyles.textarea}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" style={modalStyles.cancelBtn} onClick={() => setShowRecordModal(false)}>Cancel</button>
                <button type="submit" disabled={submittingRecord} style={modalStyles.submitBtn}>
                  {submittingRecord ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

<<<<<<< HEAD
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  content: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    maxWidth: "540px",
    width: "100%",
    padding: "26px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "12px",
    marginBottom: "16px",
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
  },
  cancelBtn: {
    padding: "10px 18px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  submitBtn: {
    padding: "10px 20px",
    backgroundColor: "#087b9c",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

=======
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
export default Appointments;
