package com.healthcare.backend.exception;

/**
 * Raised when the downstream FastAPI assessment service cannot be reached
 * ({@code unavailable = true}) or rejects the request ({@code unavailable = false}).
 */
public class AiServiceException extends RuntimeException {

    private final boolean unavailable;

    public AiServiceException(String message, boolean unavailable) {
        super(message);
        this.unavailable = unavailable;
    }

    public AiServiceException(String message, boolean unavailable, Throwable cause) {
        super(message, cause);
        this.unavailable = unavailable;
    }

    public boolean isUnavailable() {
        return unavailable;
    }
}
