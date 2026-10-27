package com.healthcare.backend.dto;

public class AuthResponse {

    private Long userId;
    private String fullName;
    private String email;
    private String role;
    private String token;
    private Long patientId;
    private Long doctorId;

    public AuthResponse() {
    }

    public AuthResponse(Long userId, String fullName, String email, String role, String token) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.token = token;
    }

    public AuthResponse(Long userId, String fullName, String email, String role, String token, Long patientId, Long doctorId) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.token = token;
        this.patientId = patientId;
        this.doctorId = doctorId;
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

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }
}
