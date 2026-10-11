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
  };

  return (
    <div className="page-container">

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

    </div>
  );
}

export default Appointments;
