package com.healthcare.backend.service;

import java.lang.reflect.Proxy;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

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

class AppointmentBookingUnitTest {

    private List<Appointment> mockDoctorAppts;
    private List<Appointment> mockPatientAppts;

    private Doctor mockDoctor1;
    private Doctor mockDoctor2;
    private Doctor mockDoctor3;

    private Patient mockPatient1;
    private Patient mockPatient4;
    private Patient mockPatient5;

    private User mockUser9;

    private AppointmentRepository appointmentRepository;
    private DoctorRepository doctorRepository;
    private PatientRepository patientRepository;
    private UserRepository userRepository;

    private AppointmentService appointmentService;

    @BeforeEach
    void setUp() {
        mockDoctorAppts = new ArrayList<>();
        mockPatientAppts = new ArrayList<>();

        mockDoctor1 = new Doctor();
        mockDoctor1.setDoctorId(1L);
        mockDoctor1.setFullName("Dr. Arun Kumar");
        mockDoctor1.setSpecialization("Cardiology");
        mockDoctor1.setEmail("arun@gmail.com");

        mockDoctor2 = new Doctor();
        mockDoctor2.setDoctorId(2L);
        mockDoctor2.setFullName("Dr. Priya Sharma");
        mockDoctor2.setSpecialization("Dermatology");
        mockDoctor2.setEmail("priya_doc@gmail.com");

        mockDoctor3 = new Doctor();
        mockDoctor3.setDoctorId(3L);
        mockDoctor3.setFullName("Dr. Rahul Verma");
        mockDoctor3.setSpecialization("Neurology");
        mockDoctor3.setEmail("rahul_doc@gmail.com");

        mockPatient1 = new Patient();
        mockPatient1.setPatientId(1L);
        mockPatient1.setFullName("Adusuru Sailaja");
        mockPatient1.setEmail("sailaja@gmail.com");

        mockPatient4 = new Patient();
        mockPatient4.setPatientId(4L);
        mockPatient4.setFullName("Rahul Kumar");
        mockPatient4.setEmail("rahul@gmail.com");

        mockPatient5 = new Patient();
        mockPatient5.setPatientId(5L);
        mockPatient5.setFullName("Priya Sharma");
        mockPatient5.setEmail("priya@gmail.com");

        mockUser9 = new User();
        mockUser9.setUserId(9L);
        mockUser9.setFullName("Adusuru Sailaja");
        mockUser9.setEmail("sailaja@gmail.com");
        mockUser9.setRole("PATIENT");

        // Dynamic Proxy for AppointmentRepository
        appointmentRepository = (AppointmentRepository) Proxy.newProxyInstance(
                AppointmentRepository.class.getClassLoader(),
                new Class<?>[]{AppointmentRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findByDoctorIdAndAppointmentDate".equals(name)) {
                        return mockDoctorAppts;
                    }
                    if ("findByPatientIdAndAppointmentDate".equals(name)) {
                        return mockPatientAppts;
                    }
                    if ("save".equals(name)) {
                        Appointment a = (Appointment) args[0];
                        if (a.getAppointmentId() == null) {
                            a.setAppointmentId(101L);
                        }
                        return a;
                    }
                    if ("findById".equals(name)) {
                        Long id = (Long) args[0];
                        return mockDoctorAppts.stream()
                                .filter(a -> id.equals(a.getAppointmentId()))
                                .findFirst();
                    }
                    return null;
                }
        );

        // Dynamic Proxy for DoctorRepository
        doctorRepository = (DoctorRepository) Proxy.newProxyInstance(
                DoctorRepository.class.getClassLoader(),
                new Class<?>[]{DoctorRepository.class},
                (proxy, method, args) -> {
                    if ("findById".equals(method.getName())) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(1L).equals(id)) return Optional.of(mockDoctor1);
                        if (Long.valueOf(2L).equals(id)) return Optional.of(mockDoctor2);
                        if (Long.valueOf(3L).equals(id)) return Optional.of(mockDoctor3);
                        return Optional.empty();
                    }
                    if ("existsById".equals(method.getName())) {
                        Long id = (Long) args[0];
                        return Long.valueOf(1L).equals(id) || Long.valueOf(2L).equals(id) || Long.valueOf(3L).equals(id);
                    }
                    return null;
                }
        );

        // Dynamic Proxy for PatientRepository
        patientRepository = (PatientRepository) Proxy.newProxyInstance(
                PatientRepository.class.getClassLoader(),
                new Class<?>[]{PatientRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findById".equals(name)) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(1L).equals(id)) return Optional.of(mockPatient1);
                        if (Long.valueOf(4L).equals(id)) return Optional.of(mockPatient4);
                        if (Long.valueOf(5L).equals(id)) return Optional.of(mockPatient5);
                        return Optional.empty();
                    }
                    if ("findByEmail".equals(name)) {
                        String email = (String) args[0];
                        if ("sailaja@gmail.com".equalsIgnoreCase(email)) return Optional.of(mockPatient1);
                        if ("rahul@gmail.com".equalsIgnoreCase(email)) return Optional.of(mockPatient4);
                        if ("priya@gmail.com".equalsIgnoreCase(email)) return Optional.of(mockPatient5);
                        return Optional.empty();
                    }
                    return null;
                }
        );

        // Dynamic Proxy for UserRepository
        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findById".equals(name)) {
                        Long id = (Long) args[0];
                        if (Long.valueOf(9L).equals(id)) return Optional.of(mockUser9);
                        return Optional.empty();
                    }
                    if ("findByEmail".equals(name)) {
                        String email = (String) args[0];
                        if ("sailaja@gmail.com".equalsIgnoreCase(email)) return Optional.of(mockUser9);
                        return Optional.empty();
                    }
                    return null;
                }
        );

        appointmentService = new AppointmentService(
                appointmentRepository,
                doctorRepository,
                patientRepository,
                userRepository
        );
    }

    @Test
    @DisplayName("Valid booking with Patient ID 1 (Sailaja) and Doctor ID 1 succeeds")
    void testBookAvailableSlotSuccessPatient1() {
        Appointment newAppt = new Appointment();
        newAppt.setDoctorId(1L);
        newAppt.setPatientId(1L);
        newAppt.setAppointmentDate("2026-11-10");
        newAppt.setAppointmentTime("09:00 AM");

        Appointment created = appointmentService.createAppointment(newAppt);

        assertNotNull(created);
        assertEquals(101L, created.getAppointmentId());
        assertEquals(1L, created.getPatientId());
        assertEquals("09:00:00", created.getAppointmentTime());
        assertEquals("Booked", created.getStatus());
    }

    @Test
    @DisplayName("Valid booking with Patient ID 4 (Rahul) and Doctor ID 2 succeeds")
    void testBookAvailableSlotSuccessPatient4() {
        Appointment newAppt = new Appointment();
        newAppt.setDoctorId(2L);
        newAppt.setPatientId(4L);
        newAppt.setAppointmentDate("2026-11-10");
        newAppt.setAppointmentTime("10:00 AM");

        Appointment created = appointmentService.createAppointment(newAppt);

        assertNotNull(created);
        assertEquals(101L, created.getAppointmentId());
        assertEquals(4L, created.getPatientId());
        assertEquals("10:00:00", created.getAppointmentTime());
    }

    @Test
    @DisplayName("Valid booking with Patient ID 5 (Priya) and Doctor ID 3 succeeds")
    void testBookAvailableSlotSuccessPatient5() {
        Appointment newAppt = new Appointment();
        newAppt.setDoctorId(3L);
        newAppt.setPatientId(5L);
        newAppt.setAppointmentDate("2026-11-10");
        newAppt.setAppointmentTime("11:00 AM");

        Appointment created = appointmentService.createAppointment(newAppt);

        assertNotNull(created);
        assertEquals(101L, created.getAppointmentId());
        assertEquals(5L, created.getPatientId());
        assertEquals("11:00:00", created.getAppointmentTime());
    }

    @Test
    @DisplayName("Booking with user ID 9 resolves via user table to authentic patient ID 1")
    void testBookAppointmentResolvesUserId9ToPatientId1() {
        Appointment newAppt = new Appointment();
        newAppt.setDoctorId(1L);
        newAppt.setPatientId(9L); // User ID from users table
        newAppt.setAppointmentDate("2026-11-10");
        newAppt.setAppointmentTime("02:00 PM");

        Appointment created = appointmentService.createAppointment(newAppt);

        assertNotNull(created);
        assertEquals(1L, created.getPatientId(), "Must be auto-resolved to genuine patient_id 1");
        assertEquals("14:00:00", created.getAppointmentTime());
        assertEquals("Booked", created.getStatus());
    }

    @Test
    @DisplayName("Non-existent patient ID (e.g. 999) throws IllegalArgumentException")
    void testBookAppointmentWithInvalidPatientIdThrowsException() {
        Appointment invalid = new Appointment();
        invalid.setDoctorId(1L);
        invalid.setPatientId(999L);
        invalid.setAppointmentDate("2026-11-10");
        invalid.setAppointmentTime("09:00 AM");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> appointmentService.createAppointment(invalid)
        );

        assertTrue(ex.getMessage().contains("Patient not found with ID: 999"));
    }

    @Test
    @DisplayName("Non-existent doctor ID (e.g. 999) throws IllegalArgumentException")
    void testBookAppointmentWithInvalidDoctorIdThrowsException() {
        Appointment invalid = new Appointment();
        invalid.setDoctorId(999L);
        invalid.setPatientId(1L);
        invalid.setAppointmentDate("2026-11-10");
        invalid.setAppointmentTime("09:00 AM");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> appointmentService.createAppointment(invalid)
        );

        assertTrue(ex.getMessage().contains("Doctor not found with ID: 999"));
    }

    @Test
    @DisplayName("Conflicting doctor booking throws AppointmentConflictException (maps to HTTP 409)")
    void testBookConflictingDoctorSlotThrowsConflict() {
        Appointment existing = new Appointment();
        existing.setAppointmentId(50L);
        existing.setDoctorId(1L);
        existing.setPatientId(4L);
        existing.setAppointmentDate("2026-11-10");
        existing.setAppointmentTime("09:00:00");
        existing.setStatus("Booked");
        mockDoctorAppts.add(existing);

        Appointment conflictingBooking = new Appointment();
        conflictingBooking.setDoctorId(1L);
        conflictingBooking.setPatientId(1L);
        conflictingBooking.setAppointmentDate("2026-11-10");
        conflictingBooking.setAppointmentTime("09:00 AM");

        AppointmentConflictException ex = assertThrows(
                AppointmentConflictException.class,
                () -> appointmentService.createAppointment(conflictingBooking)
        );

        assertTrue(ex.getMessage().contains("already booked for Dr. Arun Kumar"));
    }

    @Test
    @DisplayName("Simultaneous patient appointment at same time throws AppointmentConflictException (maps to HTTP 409)")
    void testPatientSimultaneousBookingThrowsConflict() {
        Appointment patientExisting = new Appointment();
        patientExisting.setAppointmentId(60L);
        patientExisting.setDoctorId(2L);
        patientExisting.setPatientId(1L);
        patientExisting.setAppointmentDate("2026-11-10");
        patientExisting.setAppointmentTime("10:00:00");
        patientExisting.setStatus("Booked");
        mockPatientAppts.add(patientExisting);

        Appointment overlappingBooking = new Appointment();
        overlappingBooking.setDoctorId(1L);
        overlappingBooking.setPatientId(1L);
        overlappingBooking.setAppointmentDate("2026-11-10");
        overlappingBooking.setAppointmentTime("10:00 AM");

        AppointmentConflictException ex = assertThrows(
                AppointmentConflictException.class,
                () -> appointmentService.createAppointment(overlappingBooking)
        );

        assertTrue(ex.getMessage().contains("already have an active appointment scheduled"));
    }

    @Test
    @DisplayName("Missing required fields throws IllegalArgumentException (maps to HTTP 400)")
    void testInvalidBookingPayloadThrowsBadRequest() {
        Appointment invalid = new Appointment();
        invalid.setDoctorId(1L);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> appointmentService.createAppointment(invalid)
        );

        assertTrue(ex.getMessage().contains("Patient selection is required"));
    }

    @Test
    @DisplayName("Slot availability query accurately detects booked versus free slots")
    void testSlotAvailabilityQueryMatchesBooking() {
        Appointment booked = new Appointment();
        booked.setDoctorId(1L);
        booked.setAppointmentDate("2026-11-10");
        booked.setAppointmentTime("09:00:00");
        booked.setStatus("Booked");
        mockDoctorAppts.add(booked);

        List<SlotAvailabilityDto> slots = appointmentService.getAvailableSlots(1L, "2026-11-10", "morning");

        assertNotNull(slots);
        assertFalse(slots.isEmpty());

        SlotAvailabilityDto slot9am = slots.stream()
                .filter(s -> "09:00:00".equals(s.getSlotTime()))
                .findFirst()
                .orElse(null);

        assertNotNull(slot9am);
        assertFalse(slot9am.isAvailable(), "09:00 AM slot must be marked unavailable because it is booked");

        SlotAvailabilityDto slot10am = slots.stream()
                .filter(s -> "10:00:00".equals(s.getSlotTime()))
                .findFirst()
                .orElse(null);

        assertNotNull(slot10am);
        assertTrue(slot10am.isAvailable(), "10:00 AM slot must be marked available");
    }
}
