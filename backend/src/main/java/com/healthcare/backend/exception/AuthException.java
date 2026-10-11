package com.healthcare.backend.exception;

/**
 * Authentication/registration failure that should map to a specific HTTP
 * status (for example 401 for bad credentials, 409 for a duplicate email).
 */
public class AuthException extends RuntimeException {

    private final int status;

    public AuthException(String message, int status) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
