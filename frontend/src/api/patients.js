import { apiRequest } from "./client";

// The authenticated patient's own profile. Ownership is derived from the JWT
// on the server; no patientId is ever sent from the client.
//
// A missing profile comes back as HTTP 409 with code "profile_required".

export function getMyProfile(token) {
  return apiRequest("/api/patients/me", { token });
}

export function createMyProfile(profile, token) {
  return apiRequest("/api/patients/me", {
    method: "POST",
    body: profile,
    token,
  });
}

export function updateMyProfile(profile, token) {
  return apiRequest("/api/patients/me", {
    method: "PUT",
    body: profile,
    token,
  });
}
