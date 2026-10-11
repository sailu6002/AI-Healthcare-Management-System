package com.healthcare.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Booking request. The patient is ALWAYS derived from the authenticated
 * principal; there is deliberately no patientId field here.
 */
public class AppointmentRequest {

    private Long doctorId;
    private LocalDate date;
    private LocalTime startTime;

    public AppointmentRequest() {
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }
}
