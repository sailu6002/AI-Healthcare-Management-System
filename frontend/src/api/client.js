// Small fetch wrapper for the Spring Boot backend.
//
// During development the base URL is empty so requests hit the Vite dev
// server and are proxied to the backend. For other deployments set
// VITE_API_BASE_URL (for example https://api.example.com).

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, code = "error", details = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = 20000;

export async function apiRequest(
  path,
  { method = "GET", body, token, timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", {
        code: "timeout",
      });
    }
    throw new ApiError(
      "Unable to reach the server. Please check your connection and try again.",
      { code: "network" }
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new ApiError(
        payload?.message || "Your session has expired. Please log in again.",
        {
          status: response.status,
          code: payload?.code || "unauthorized",
          details: payload,
        }
      );
    }

    if (response.status === 502 || response.status === 503) {
      throw new ApiError(
        payload?.message ||
          "The AI assessment service is currently unavailable. Please try again later.",
        { status: response.status, code: "ai_unavailable", details: payload }
      );
    }

    const message =
      payload?.message ||
      payload?.detail ||
      `Request failed (HTTP ${response.status}).`;

    throw new ApiError(
      Array.isArray(message) ? "Please review the submitted values." : message,
      {
        status: response.status,
        code: payload?.code || "server",
        details: payload,
      }
    );
  }

  return payload;
}
