package com.healthcare.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.model.AppointmentReminder;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.repository.AppointmentReminderRepository;
import com.healthcare.backend.repository.AppointmentRepository;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.PatientRepository;

@Service
public class AppointmentReminderService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentReminderService.class);

    private final AppointmentReminderRepository reminderRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    public AppointmentReminderService(
            AppointmentReminderRepository reminderRepository,
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository) {
        this.reminderRepository = reminderRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    /**
     * Automated background scheduler: executes every 60 seconds.
     * Evaluates active upcoming appointments and generates 24-hour and 1-hour notifications.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void scheduledReminderJob() {
        scanAndGenerateReminders();
    }

    /**
     * Core reminder scanning logic. Can also be called on-demand via API for testing and verification.
     */
    @Transactional
    public int scanAndGenerateReminders() {
        List<Appointment> activeAppointments = appointmentRepository.findByStatusNot("Cancelled");
        LocalDateTime now = LocalDateTime.now();
        int createdCount = 0;

        for (Appointment apt : activeAppointments) {
            // Ignore completed or non-booked appointments
            if ("Completed".equalsIgnoreCase(apt.getStatus())) {
                continue;
            }

            LocalDateTime appointmentDateTime = parseAppointmentDateTime(apt.getAppointmentDate(), apt.getAppointmentTime());
            if (appointmentDateTime == null) {
                continue;
            }

            long minutesUntil = ChronoUnit.MINUTES.between(now, appointmentDateTime);

            // 1. Check for 24-Hour Reminder (Between 60 minutes and 1440 minutes / 24 hours)
            if (minutesUntil > 60 && minutesUntil <= 1440) {
                boolean alreadySent = reminderRepository.existsByAppointmentIdAndReminderType(apt.getAppointmentId(), "HOURS_24");
                if (!alreadySent) {
                    createReminder(apt, "HOURS_24", minutesUntil);
                    createdCount++;
                }
            }

            // 2. Check for 1-Hour Urgent Reminder (Between 0 and 60 minutes)
            if (minutesUntil >= 0 && minutesUntil <= 60) {
                boolean alreadySent = reminderRepository.existsByAppointmentIdAndReminderType(apt.getAppointmentId(), "HOUR_1");
                if (!alreadySent) {
                    createReminder(apt, "HOUR_1", minutesUntil);
                    createdCount++;
                }
            }
        }

        if (createdCount > 0) {
            log.info("Appointment reminder scan completed. Generated {} new notification(s).", createdCount);
        }

        return createdCount;
    }

    private void createReminder(Appointment apt, String type, long minutesUntil) {
        Optional<Doctor> doctorOpt = doctorRepository.findById(apt.getDoctorId());
        Optional<Patient> patientOpt = patientRepository.findById(apt.getPatientId());

        String docName = doctorOpt.map(Doctor::getFullName).orElse("Attending Physician");
        String docSpec = doctorOpt.map(Doctor::getSpecialization).orElse("General Practice");
        String clinicAddress = doctorOpt.map(Doctor::getAddress).orElse("AI Healthcare Central Clinic, OPD Block");
        String patientName = patientOpt.map(Patient::getFullName).orElse("Valued Patient");
        String patientEmail = patientOpt.map(Patient::getEmail).orElse(null);

        String message;
        if ("HOURS_24".equals(type)) {
            long hours = Math.max(1, minutesUntil / 60);
            message = String.format(
                "📅 24-Hour Appointment Reminder: Hello %s, your consultation with Dr. %s (%s) is scheduled in approximately %d hours on %s at %s. Clinic Location: %s. Please arrive 10 minutes early and carry previous records.",
                patientName, docName, docSpec, hours, apt.getAppointmentDate(), apt.getAppointmentTime(), clinicAddress
            );
        } else {
            message = String.format(
                "⏰ 1-Hour Urgent Reminder: Hello %s, your consultation with Dr. %s (%s) starts in %d minutes at %s. Clinic Location: %s. Please check in at the reception desk.",
                patientName, docName, docSpec, Math.max(1, minutesUntil), apt.getAppointmentTime(), clinicAddress
            );
        }

        AppointmentReminder reminder = new AppointmentReminder();
        reminder.setAppointmentId(apt.getAppointmentId());
        reminder.setPatientId(apt.getPatientId());
        reminder.setDoctorId(apt.getDoctorId());
        reminder.setReminderType(type);
        reminder.setDoctorName(docName);
        reminder.setDoctorSpecialization(docSpec);
        reminder.setClinicDetails(clinicAddress);
        reminder.setAppointmentDate(apt.getAppointmentDate());
        reminder.setAppointmentTime(apt.getAppointmentTime());
        reminder.setMessage(message);
        reminder.setSentAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        reminder.setRecipientEmail(patientEmail);
        reminder.setAttemptCount(1);

        // Honest delivery status indicator
        try {
            reminder.setChannel("IN_APP_NOTIFICATION");
            reminder.setStatus("SCHEDULED");
            if (patientEmail != null && !patientEmail.isBlank()) {
                reminder.setDeliveryStatus("IN_APP_ACTIVE (Email Unconfigured)");
            } else {
                reminder.setDeliveryStatus("IN_APP_ACTIVE");
            }
            log.info("In-App reminder registered for appointment #{} (Patient: {})", apt.getAppointmentId(), patientName);
        } catch (Exception e) {
            reminder.setStatus("FAILED");
            reminder.setDeliveryStatus("FAILED");
            reminder.setFailureReason(e.getMessage());
            log.error("Failed to register appointment reminder for appointment #{}: {}", apt.getAppointmentId(), e.getMessage());
        }

        reminderRepository.save(reminder);
    }

    public List<AppointmentReminder> getRemindersForPatient(Long patientId) {
        return reminderRepository.findByPatientIdOrderBySentAtDesc(patientId);
    }

    private LocalDateTime parseAppointmentDateTime(String dateStr, String timeStr) {
        try {
            if (dateStr == null || timeStr == null) return null;
            LocalDate date = LocalDate.parse(dateStr.trim());
            LocalTime time;

            String cleanTime = timeStr.trim();
            if (cleanTime.toUpperCase().contains("AM") || cleanTime.toUpperCase().contains("PM")) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm[:ss] a");
                time = LocalTime.parse(cleanTime.toUpperCase(), formatter);
            } else if (cleanTime.length() == 5) {
                time = LocalTime.parse(cleanTime);
            } else {
                time = LocalTime.parse(cleanTime);
            }

            return LocalDateTime.of(date, time);
        } catch (Exception e) {
            log.debug("Unable to parse appointment date/time: {} {}", dateStr, timeStr);
            return null;
        }
    }
}
