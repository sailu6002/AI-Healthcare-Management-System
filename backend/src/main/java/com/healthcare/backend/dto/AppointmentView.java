package com.healthcare.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.model.Doctor;

/** Enriched appointment view returned to the frontend. */
public class AppointmentView {

    private final Long appointmentId;
    private final Long doctorId;
    private final String doctorName;
    private final String specialization;
    private final LocalDate appointmentDate;
    private final LocalTime appointmentTime;
    private final String status;

    public AppointmentView(
            Long appointmentId,
            Long doctorId,
            String doctorName,
            String specialization,
            LocalDate appointmentDate,
            LocalTime appointmentTime,
            String status) {

        this.appointmentId = appointmentId;
        this.doctorId = doctorId;
        this.doctorName = doctorName;
        this.specialization = specialization;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.status = status;
    }

    public static AppointmentView from(Appointment appointment, Doctor doctor) {
        return new AppointmentView(
                appointment.getAppointmentId(),
                appointment.getDoctorId(),
                doctor != null ? doctor.getFullName() : null,
                doctor != null ? doctor.getSpecialization() : null,
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getStatus());
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public String getSpecialization() {
        return specialization;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }

    public String getStatus() {
        return status;
    }
}
