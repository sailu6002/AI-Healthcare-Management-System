import { apiRequest } from "./client";

// Real doctor records from the existing backend endpoint.
export function listDoctors(token) {
  return apiRequest("/api/doctors", { token });
}

// Server-computed, genuinely bookable slots for a doctor on a given date.
// A doctor with no configured schedule returns an empty array.
export function getAvailability(doctorId, date, token) {
  return apiRequest(
    `/api/doctors/${doctorId}/availability?date=${encodeURIComponent(date)}`,
    { token }
  );
}
