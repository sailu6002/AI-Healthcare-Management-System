package com.healthcare.backend.dto;

public class AuthResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String token;

    public AuthResponse() {
    }

    public AuthResponse(Long userId, String fullName, String email, String role, String token) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}