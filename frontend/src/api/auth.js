import { apiRequest } from "./client";

// Real authentication against the Spring Boot backend. Both endpoints return
// { userId, fullName, email, role, token } where token is a signed JWT.

export function login(email, password) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function register({ fullName, email, password }) {
  // The backend always assigns ROLE_PATIENT on public registration and ignores
  // any client-supplied role, so none is sent.
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: { fullName, email, password },
  });
}
