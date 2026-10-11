package com.healthcare.backend.exception;

/**
 * Business/validation failure that maps to a specific HTTP status and a stable
 * machine-readable {@code code} (for example {@code profile_required} or
 * {@code slot_conflict}) so the frontend can react precisely.
 */
public class ApiException extends RuntimeException {

    private final int status;
    private final String code;

    public ApiException(String message, int status, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public int getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
