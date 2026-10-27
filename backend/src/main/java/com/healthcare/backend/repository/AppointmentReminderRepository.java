package com.healthcare.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.AppointmentReminder;

public interface AppointmentReminderRepository
        extends JpaRepository<AppointmentReminder, Long> {

    // Prevent duplicate reminders for the same appointment and reminder window
    boolean existsByAppointmentIdAndReminderType(Long appointmentId, String reminderType);

    // List all reminders for a given patient, ordered with most recent first
    List<AppointmentReminder> findByPatientIdOrderBySentAtDesc(Long patientId);

    // Find all reminders logged for a specific appointment
    List<AppointmentReminder> findByAppointmentId(Long appointmentId);
}

