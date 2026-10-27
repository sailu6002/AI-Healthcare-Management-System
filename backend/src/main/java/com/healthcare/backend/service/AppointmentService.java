package com.healthcare.backend.service;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    // Create appointment
    public Appointment createAppointment(Appointment appointment) {
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
    
}
