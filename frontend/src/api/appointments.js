import { apiRequest } from "./client";

// Real appointment endpoints. The patient is always taken from the JWT, so
// these calls never send a patientId.

export function getMyAppointments(token) {
  return apiRequest("/api/appointments/mine", { token });
}

export function createAppointment({ doctorId, date, startTime }, token) {
  return apiRequest("/api/appointments", {
    method: "POST",
    body: { doctorId, date, startTime },
    token,
  });
}

export function cancelAppointment(appointmentId, token) {
  return apiRequest(`/api/appointments/${appointmentId}/cancel`, {
    method: "POST",
    token,
  });
}
