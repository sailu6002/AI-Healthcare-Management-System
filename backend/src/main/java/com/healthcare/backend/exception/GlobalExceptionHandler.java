package com.healthcare.backend.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Returns consistent JSON error bodies so the frontend can present useful
 * messages instead of Spring's default error payloads.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<Map<String, Object>> handleAiService(AiServiceException ex) {

        HttpStatus status = ex.isUnavailable()
                ? HttpStatus.SERVICE_UNAVAILABLE
                : HttpStatus.BAD_GATEWAY;

        String message = ex.isUnavailable()
                ? "The AI assessment service is currently unavailable. Please try again later."
                : "The AI assessment service could not process this request.";

        return buildResponse(status, message);
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<Map<String, Object>> handleAuth(AuthException ex) {

        HttpStatus status = HttpStatus.resolve(ex.getStatus());

        if (status == null) {
            status = HttpStatus.BAD_REQUEST;
        }

        return buildResponse(status, ex.getMessage());
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApi(ApiException ex) {

        HttpStatus status = HttpStatus.resolve(ex.getStatus());

        if (status == null) {
            status = HttpStatus.BAD_REQUEST;
        }

        return buildResponse(status, ex.getMessage(), ex.getCode());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(
            HttpStatus status, String message) {

        return buildResponse(status, message, null);
    }

    private ResponseEntity<Map<String, Object>> buildResponse(
            HttpStatus status, String message, String code) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);

        if (code != null) {
            body.put("code", code);
        }

        return ResponseEntity.status(status).body(body);
    }
}
