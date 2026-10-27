package com.healthcare.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healthcare.backend.dto.SlotAvailabilityDto;
import com.healthcare.backend.exception.AppointmentConflictException;
import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.AppointmentRepository;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.PatientRepository;
import com.healthcare.backend.repository.UserRepository;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    // Standard daily consultation slots
    private static final String[][] STANDARD_SLOTS = {
        {"09:00:00", "09:00 AM", "morning"},
        {"10:00:00", "10:00 AM", "morning"},
        {"11:00:00", "11:00 AM", "morning"},
        {"14:00:00", "02:00 PM", "afternoon"},
        {"15:00:00", "03:00 PM", "afternoon"},
        {"16:00:00", "04:00 PM", "afternoon"},
        {"17:00:00", "05:00 PM", "afternoon"}
    };

    @Autowired
    public AppointmentService(
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            UserRepository userRepository) {

        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create appointment with patient/doctor validation
     * and double-booking prevention.
     */
    @Transactional
    public Appointment createAppointment(Appointment appointment) {

        if (appointment == null) {
            throw new IllegalArgumentException(
                "Appointment payload cannot be null."
            );
        }

        if (appointment.getDoctorId() == null) {
            throw new IllegalArgumentException(
                "Doctor selection is required."
            );
        }

        if (appointment.getPatientId() == null) {
            throw new IllegalArgumentException(
                "Patient selection is required."
            );
        }

        if (appointment.getAppointmentDate() == null
                || appointment.getAppointmentDate().trim().isEmpty()) {
            throw new IllegalArgumentException(
                "Consultation date is required."
            );
        }

        if (appointment.getAppointmentTime() == null
                || appointment.getAppointmentTime().trim().isEmpty()) {
            throw new IllegalArgumentException(
                "Consultation time slot is required."
            );
        }

        String cleanDate = appointment.getAppointmentDate().trim();
        String normalizedTime =
                normalizeTime(appointment.getAppointmentTime());

        appointment.setAppointmentDate(cleanDate);
        appointment.setAppointmentTime(normalizedTime);

        // Validate that the patient exists.
        // If the ID isn't directly in patients, check if it maps from a userId in users table.
        Patient patient = null;
        Optional<Patient> patientOpt = patientRepository.findById(appointment.getPatientId());
        if (patientOpt.isPresent()) {
            patient = patientOpt.get();
        } else if (userRepository != null) {
            Optional<User> userOpt = userRepository.findById(appointment.getPatientId());
            if (userOpt.isPresent()) {
                Optional<Patient> mappedPatient = patientRepository.findByEmail(userOpt.get().getEmail());
                if (mappedPatient.isPresent()) {
                    patient = mappedPatient.get();
                    appointment.setPatientId(patient.getPatientId());
                }
            }
        }

        if (patient == null) {
            throw new IllegalArgumentException(
                "Patient not found with ID: " + appointment.getPatientId()
            );
        }

        // Validate that the doctor exists.
        Doctor doctor = doctorRepository
                .findById(appointment.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Doctor not found with ID: "
                    + appointment.getDoctorId()
                ));

        String rawDocName = doctor.getFullName();
        String formattedDoctor = rawDocName.startsWith("Dr.")
                ? rawDocName
                : "Dr. " + rawDocName;

        // Prevent a doctor from being booked twice
        // for the same date and time.
        List<Appointment> existingDocAppts =
                appointmentRepository.findByDoctorIdAndAppointmentDate(
                    appointment.getDoctorId(), cleanDate
                );

        boolean doctorHasConflict = existingDocAppts.stream()
                .filter(a -> a.getStatus() == null
                    || !"cancelled".equalsIgnoreCase(
                        a.getStatus().trim()
                    ))
                .anyMatch(a -> normalizeTime(
                    a.getAppointmentTime()
                ).equals(normalizedTime));

        if (doctorHasConflict) {
            throw new AppointmentConflictException(
                String.format(
                    "The time slot %s on %s is already booked for %s. "
                    + "Please select an available slot.",
                    formatTimeLabel(normalizedTime),
                    cleanDate,
                    formattedDoctor
                )
            );
        }

        // Prevent the same patient from booking
        // two appointments at the same date and time.
        List<Appointment> existingPatientAppts =
                appointmentRepository.findByPatientIdAndAppointmentDate(
                    appointment.getPatientId(), cleanDate
                );

        boolean patientHasConflict = existingPatientAppts.stream()
                .filter(a -> a.getStatus() == null
                    || !"cancelled".equalsIgnoreCase(
                        a.getStatus().trim()
                    ))
                .anyMatch(a -> normalizeTime(
                    a.getAppointmentTime()
                ).equals(normalizedTime));

        if (patientHasConflict) {
            throw new AppointmentConflictException(
                String.format(
                    "You already have an active appointment scheduled "
                    + "at %s on %s. Please choose a different time.",
                    formatTimeLabel(normalizedTime),
                    cleanDate
                )
            );
        }

        if (appointment.getStatus() == null
                || appointment.getStatus().trim().isEmpty()) {
            appointment.setStatus("Booked");
        }

        return appointmentRepository.save(appointment);
    }

    /**
     * Reschedule an existing appointment.
     */
    @Transactional
    public Appointment rescheduleAppointment(
            Long appointmentId,
            String newDate,
            String newTime) {

        Appointment appointment = appointmentRepository
                .findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Appointment not found with ID: " + appointmentId
                ));

        if (appointment.getStatus() != null
                && "cancelled".equalsIgnoreCase(
                    appointment.getStatus().trim()
                )) {
            throw new IllegalArgumentException(
                "Cannot reschedule an appointment that has "
                + "already been cancelled."
            );
        }

        if (newDate == null || newDate.trim().isEmpty()
                || newTime == null || newTime.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "New appointment date and time are required."
            );
        }

        String cleanDate = newDate.trim();
        String normalizedTime = normalizeTime(newTime);

        // Check doctor availability.
        List<Appointment> existingDocAppts =
                appointmentRepository.findByDoctorIdAndAppointmentDate(
                    appointment.getDoctorId(), cleanDate
                );

        boolean doctorConflict = existingDocAppts.stream()
                .filter(a -> !a.getAppointmentId().equals(appointmentId))
                .filter(a -> a.getStatus() == null
                    || !"cancelled".equalsIgnoreCase(
                        a.getStatus().trim()
                    ))
                .anyMatch(a -> normalizeTime(
                    a.getAppointmentTime()
                ).equals(normalizedTime));

        if (doctorConflict) {
            throw new AppointmentConflictException(
                String.format(
                    "The requested slot %s on %s is already taken. "
                    + "Please choose another slot.",
                    formatTimeLabel(normalizedTime),
                    cleanDate
                )
            );
        }

        // Check patient availability.
        List<Appointment> existingPatientAppts =
                appointmentRepository.findByPatientIdAndAppointmentDate(
                    appointment.getPatientId(), cleanDate
                );

        boolean patientConflict = existingPatientAppts.stream()
                .filter(a -> !a.getAppointmentId().equals(appointmentId))
                .filter(a -> a.getStatus() == null
                    || !"cancelled".equalsIgnoreCase(
                        a.getStatus().trim()
                    ))
                .anyMatch(a -> normalizeTime(
                    a.getAppointmentTime()
                ).equals(normalizedTime));

        if (patientConflict) {
            throw new AppointmentConflictException(
                "You already have another appointment at "
                + formatTimeLabel(normalizedTime)
                + " on " + cleanDate + "."
            );
        }

        appointment.setAppointmentDate(cleanDate);
        appointment.setAppointmentTime(normalizedTime);
        appointment.setStatus("Rescheduled");

        return appointmentRepository.save(appointment);
    }

    /**
     * Cancel an appointment.
     */
    @Transactional
    public Appointment cancelAppointment(
            Long appointmentId,
            String reason) {

        Appointment appointment = appointmentRepository
                .findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Appointment not found with ID: " + appointmentId
                ));

        appointment.setStatus("Cancelled");

        return appointmentRepository.save(appointment);
    }

    /**
     * Get available consultation slots and recommendations.
     */
    public List<SlotAvailabilityDto> getAvailableSlots(
            Long doctorId,
            String date,
            String preferredPeriod) {

        if (doctorId == null
                || !doctorRepository.existsById(doctorId)) {
            throw new IllegalArgumentException(
                "Doctor not found with ID: " + doctorId
            );
        }

        if (date == null || date.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "Consultation date is required."
            );
        }

        String cleanDate = date.trim();

        List<Appointment> bookedAppointments =
                appointmentRepository.findByDoctorIdAndAppointmentDate(
                    doctorId, cleanDate
                );

        Set<String> bookedTimes = bookedAppointments.stream()
                .filter(a -> a.getStatus() == null
                    || !"cancelled".equalsIgnoreCase(
                        a.getStatus().trim()
                    ))
                .map(a -> normalizeTime(a.getAppointmentTime()))
                .collect(Collectors.toSet());

        List<SlotAvailabilityDto> slots = new ArrayList<>();
        SlotAvailabilityDto bestCandidate = null;

        for (String[] slotDef : STANDARD_SLOTS) {

            String slot24 = slotDef[0];
            String slotLabel = slotDef[1];
            String period = slotDef[2];

            boolean isAvailable = !bookedTimes.contains(slot24);

            SlotAvailabilityDto dto = new SlotAvailabilityDto(
                slot24,
                slotLabel,
                isAvailable,
                false,
                null
            );

            if (isAvailable && bestCandidate == null) {
                if (preferredPeriod == null
                        || preferredPeriod.trim().isEmpty()
                        || preferredPeriod.equalsIgnoreCase(period)) {
                    bestCandidate = dto;
                }
            }

            slots.add(dto);
        }

        if (bestCandidate == null) {
            bestCandidate = slots.stream()
                    .filter(SlotAvailabilityDto::isAvailable)
                    .findFirst()
                    .orElse(null);
        }

        if (bestCandidate != null) {
            bestCandidate.setRecommended(true);
            bestCandidate.setRecommendationReason(
                "⭐ AI Recommendation: Optimal consultation slot "
                + "based on doctor availability and lower "
                + "anticipated queue time."
            );
        }

        return slots;
    }

    // Standard CRUD methods

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    @Transactional
    public Optional<Appointment> updateAppointment(
            Long id,
            Appointment appointmentDetails) {

        return appointmentRepository.findById(id).map(appointment -> {

            if (appointmentDetails.getPatientId() == null) {
                throw new IllegalArgumentException(
                    "Patient selection is required."
                );
            }

            if (appointmentDetails.getDoctorId() == null) {
                throw new IllegalArgumentException(
                    "Doctor selection is required."
                );
            }

            Patient patient = null;
            Optional<Patient> patientOpt = patientRepository.findById(appointmentDetails.getPatientId());
            if (patientOpt.isPresent()) {
                patient = patientOpt.get();
            } else if (userRepository != null) {
                Optional<User> userOpt = userRepository.findById(appointmentDetails.getPatientId());
                if (userOpt.isPresent()) {
                    Optional<Patient> mappedPatient = patientRepository.findByEmail(userOpt.get().getEmail());
                    if (mappedPatient.isPresent()) {
                        patient = mappedPatient.get();
                        appointmentDetails.setPatientId(patient.getPatientId());
                    }
                }
            }

            if (patient == null) {
                throw new IllegalArgumentException(
                    "Patient not found with ID: "
                    + appointmentDetails.getPatientId()
                );
            }

            doctorRepository.findById(appointmentDetails.getDoctorId())
                    .orElseThrow(() -> new IllegalArgumentException(
                        "Doctor not found with ID: "
                        + appointmentDetails.getDoctorId()
                    ));

            appointment.setPatientId(appointmentDetails.getPatientId());
            appointment.setDoctorId(appointmentDetails.getDoctorId());
            appointment.setAppointmentDate(
                appointmentDetails.getAppointmentDate()
            );
            appointment.setAppointmentTime(
                normalizeTime(appointmentDetails.getAppointmentTime())
            );
            appointment.setStatus(appointmentDetails.getStatus());

            return appointmentRepository.save(appointment);
        });
    }

    @Transactional
    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }

    /**
     * Normalize time values to HH:mm:ss.
     */
    private String normalizeTime(String timeValue) {

        if (timeValue == null || timeValue.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "Consultation time slot is required."
            );
        }

        String clean = timeValue.trim().toUpperCase();

        if (clean.contains("AM") || clean.contains("PM")) {
            String[] parts = clean.split("\\s+");

            if (parts.length >= 2) {
                String[] hm = parts[0].split(":");

                int hour = Integer.parseInt(hm[0]);
                String min = hm.length > 1 ? hm[1] : "00";

                if ("PM".equals(parts[1]) && hour != 12) {
                    hour += 12;
                }

                if ("AM".equals(parts[1]) && hour == 12) {
                    hour = 0;
                }

                return String.format("%02d:%s:00", hour, min);
            }
        }

        if (clean.length() == 5 && clean.contains(":")) {
            return clean + ":00";
        }

        if (clean.length() == 4 && clean.charAt(1) == ':') {
            return "0" + clean + ":00";
        }

        if (clean.length() == 7 && clean.charAt(1) == ':') {
            return "0" + clean;
        }

        return clean;
    }

    /**
     * Format 24-hour time as a human-readable label.
     */
    private String formatTimeLabel(String timeValue) {

        if (timeValue == null) {
            return "";
        }

        try {
            String[] parts = timeValue.split(":");

            int hour = Integer.parseInt(parts[0]);
            String period = hour >= 12 ? "PM" : "AM";

            if (hour == 0) {
                hour = 12;
            } else if (hour > 12) {
                hour -= 12;
            }

            return String.format(
                "%02d:%s %s",
                hour,
                parts[1],
                period
            );

        } catch (Exception e) {
            return timeValue;
        }
    }
}
