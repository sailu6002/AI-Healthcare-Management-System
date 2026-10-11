package com.healthcare.backend.service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healthcare.backend.dto.AppointmentRequest;
import com.healthcare.backend.dto.AppointmentView;
import com.healthcare.backend.exception.ApiException;
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
     private final AvailabilityService availabilityService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            UserRepository userRepository,
            AvailabilityService availabilityService) {

        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.availabilityService = availabilityService;
    }

    // ------------------------------------------------------------------
    // Patient booking (identity comes from the authenticated principal)
    // ------------------------------------------------------------------

    @Transactional
    public AppointmentView createBooking(String email, AppointmentRequest request) {

        Patient patient = requirePatient(email);

        Long doctorId = request.getDoctorId();
        LocalDate date = request.getDate();
        LocalTime start = request.getStartTime();

        // Validates doctor existence, slot alignment, time-off and known
        // conflicts. The DB unique key still wins any concurrent race.
        availabilityService.validateAvailableSlot(doctorId, date, start);

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ApiException(
                        "Doctor not found.", 404, "doctor_not_found"));

        Appointment appointment = new Appointment();
        appointment.setPatientId(patient.getPatientId());
        appointment.setDoctorId(doctorId);
        appointment.setAppointmentDate(date);
        appointment.setAppointmentTime(start);
        appointment.setStatus("BOOKED");

        try {
            Appointment saved = appointmentRepository.saveAndFlush(appointment);
            return AppointmentView.from(saved, doctor);
        } catch (DataIntegrityViolationException ex) {
            // uq_active_slot rejected a second active booking for this slot.
            throw new ApiException(
                    "That slot was just booked by someone else. "
                            + "Please choose another time.",
                    409,
                    "slot_conflict");
        }
    }

    public List<AppointmentView> getMyAppointments(String email) {

        Patient patient = requirePatient(email);

        return appointmentRepository
                .findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(
                        patient.getPatientId())
                .stream()
                .map(appointment -> AppointmentView.from(
                        appointment,
                        doctorRepository.findById(appointment.getDoctorId())
                                .orElse(null)))
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentView cancel(String email, boolean admin, Long appointmentId) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ApiException(
                        "Appointment not found.", 404, "not_found"));

        if (!admin) {
            Patient patient = requirePatient(email);
            if (!patient.getPatientId().equals(appointment.getPatientId())) {
                throw new ApiException(
                        "You can only manage your own appointments.",
                        403,
                        "forbidden");
            }
        }

        if ("COMPLETED".equals(appointment.getStatus())) {
            throw new ApiException(
                    "Completed appointments cannot be cancelled.",
                    400,
                    "invalid_status");
        }

        if (!"CANCELLED".equals(appointment.getStatus())) {
            appointment.setStatus("CANCELLED");
            appointment = appointmentRepository.saveAndFlush(appointment);
        }

        Doctor doctor = doctorRepository.findById(appointment.getDoctorId())
                .orElse(null);

        return AppointmentView.from(appointment, doctor);
    }

    private Patient requirePatient(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        "Authentication is required.", 401, "unauthorized"));

        return patientRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new ApiException(
                        "A patient profile is required before booking. "
                                + "Please complete your profile.",
                        409,
                        "profile_required"));
    }

    // ------------------------------------------------------------------
    // Administrative CRUD (controllers restrict these to ROLE_ADMIN)
    // ------------------------------------------------------------------

    // Get all appointments
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    // Get appointment by ID
    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    // Update appointment
    public Optional<Appointment> updateAppointment(Long id, Appointment appointmentDetails) {

        return appointmentRepository.findById(id).map(appointment -> {

            appointment.setPatientId(appointmentDetails.getPatientId());
            appointment.setDoctorId(appointmentDetails.getDoctorId());
            appointment.setAppointmentDate(appointmentDetails.getAppointmentDate());
            appointment.setAppointmentTime(appointmentDetails.getAppointmentTime());
            appointment.setStatus(appointmentDetails.getStatus());

            return appointmentRepository.save(appointment);
        });
    }

    // Delete appointment
    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }
}
