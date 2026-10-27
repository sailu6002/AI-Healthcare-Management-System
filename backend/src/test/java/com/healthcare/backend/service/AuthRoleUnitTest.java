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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.healthcare.backend.controller.AuthController;
import com.healthcare.backend.dto.AuthRequest;
import com.healthcare.backend.dto.AuthResponse;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.PatientRepository;
import com.healthcare.backend.repository.UserRepository;
import com.healthcare.backend.security.JwtService;

class AuthRoleUnitTest {

    private List<User> mockUsers;
    private List<Patient> mockPatients;
    private List<Doctor> mockDoctors;

    private UserRepository userRepository;
    private PatientRepository patientRepository;
    private DoctorRepository doctorRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private UserService userService;
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockUsers = new ArrayList<>();
        mockPatients = new ArrayList<>();
        mockDoctors = new ArrayList<>();
        passwordEncoder = new BCryptPasswordEncoder();

        // Seed initial Patient user
        User patientUser = new User();
        patientUser.setUserId(1L);
        patientUser.setFullName("Adusuru Sailaja");
        patientUser.setEmail("sailaja@gmail.com");
        patientUser.setPassword(passwordEncoder.encode("password123"));
        patientUser.setRole("PATIENT");
        mockUsers.add(patientUser);

        Patient patient = new Patient();
        patient.setPatientId(1L);
        patient.setFullName("Adusuru Sailaja");
        patient.setEmail("sailaja@gmail.com");
        mockPatients.add(patient);

        // Seed initial Doctor user
        User doctorUser = new User();
        doctorUser.setUserId(2L);
        doctorUser.setFullName("Dr. Priya Sharma");
        doctorUser.setEmail("doctor@gmail.com");
        doctorUser.setPassword(passwordEncoder.encode("password123"));
        doctorUser.setRole("DOCTOR");
        mockUsers.add(doctorUser);

        Doctor doctor = new Doctor();
        doctor.setDoctorId(2L);
        doctor.setFullName("Dr. Priya Sharma");
        doctor.setEmail("doctor@gmail.com");
        doctor.setSpecialization("Dermatology");
        mockDoctors.add(doctor);

        // Seed initial Admin user
        User adminUser = new User();
        adminUser.setUserId(3L);
        adminUser.setFullName("System Administrator");
        adminUser.setEmail("admin@gmail.com");
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser.setRole("ADMIN");
        mockUsers.add(adminUser);

        // Proxy UserRepository
        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findByEmail".equals(name)) {
                        String email = (String) args[0];
                        return mockUsers.stream()
                                .filter(u -> email.equalsIgnoreCase(u.getEmail()))
                                .findFirst();
                    }
                    if ("existsByEmail".equals(name)) {
                        String email = (String) args[0];
                        return mockUsers.stream().anyMatch(u -> email.equalsIgnoreCase(u.getEmail()));
                    }
                    if ("save".equals(name)) {
                        User u = (User) args[0];
                        if (u.getUserId() == null) {
                            u.setUserId((long) (mockUsers.size() + 1));
                        }
                        mockUsers.add(u);
                        return u;
                    }
                    return null;
                }
        );

        // Proxy PatientRepository
        patientRepository = (PatientRepository) Proxy.newProxyInstance(
                PatientRepository.class.getClassLoader(),
                new Class<?>[]{PatientRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findByEmail".equals(name)) {
                        String email = (String) args[0];
                        return mockPatients.stream()
                                .filter(p -> email.equalsIgnoreCase(p.getEmail()))
                                .findFirst();
                    }
                    if ("findByFullNameIgnoreCase".equals(name)) {
                        String fullName = (String) args[0];
                        return mockPatients.stream()
                                .filter(p -> fullName.equalsIgnoreCase(p.getFullName()))
                                .findFirst();
                    }
                    if ("save".equals(name)) {
                        Patient p = (Patient) args[0];
                        if (p.getPatientId() == null) {
                            p.setPatientId((long) (mockPatients.size() + 1));
                        }
                        mockPatients.add(p);
                        return p;
                    }
                    return null;
                }
        );

        // Proxy DoctorRepository
        doctorRepository = (DoctorRepository) Proxy.newProxyInstance(
                DoctorRepository.class.getClassLoader(),
                new Class<?>[]{DoctorRepository.class},
                (proxy, method, args) -> {
                    String name = method.getName();
                    if ("findByEmail".equals(name)) {
                        String email = (String) args[0];
                        return mockDoctors.stream()
                                .filter(d -> email.equalsIgnoreCase(d.getEmail()))
                                .findFirst();
                    }
                    if ("findByFullNameIgnoreCase".equals(name)) {
                        String fullName = (String) args[0];
                        return mockDoctors.stream()
                                .filter(d -> fullName.equalsIgnoreCase(d.getFullName()))
                                .findFirst();
                    }
                    if ("save".equals(name)) {
                        Doctor d = (Doctor) args[0];
                        if (d.getDoctorId() == null) {
                            d.setDoctorId((long) (mockDoctors.size() + 1));
                        }
                        mockDoctors.add(d);
                        return d;
                    }
                    return null;
                }
        );

        jwtService = new JwtService();
        userService = new UserService(userRepository, patientRepository, doctorRepository, passwordEncoder);
        authController = new AuthController(userService, jwtService, patientRepository, doctorRepository);
    }

    @Test
    @DisplayName("Patient login with correct role PATIENT succeeds and resolves patientId")
    void testPatientLoginSuccess() {
        AuthRequest request = new AuthRequest("sailaja@gmail.com", "password123", "PATIENT");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AuthResponse);

        AuthResponse auth = (AuthResponse) response.getBody();
        assertEquals("PATIENT", auth.getRole());
        assertEquals(1L, auth.getPatientId());
        assertNotNull(auth.getToken());
    }

    @Test
    @DisplayName("Doctor login with correct role DOCTOR succeeds and resolves doctorId")
    void testDoctorLoginSuccess() {
        AuthRequest request = new AuthRequest("doctor@gmail.com", "password123", "DOCTOR");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AuthResponse);

        AuthResponse auth = (AuthResponse) response.getBody();
        assertEquals("DOCTOR", auth.getRole());
        assertEquals(2L, auth.getDoctorId());
        assertNotNull(auth.getToken());
    }

    @Test
    @DisplayName("Admin login with correct role ADMIN succeeds")
    void testAdminLoginSuccess() {
        AuthRequest request = new AuthRequest("admin@gmail.com", "admin123", "ADMIN");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof AuthResponse);

        AuthResponse auth = (AuthResponse) response.getBody();
        assertEquals("ADMIN", auth.getRole());
        assertNotNull(auth.getToken());
    }

    @Test
    @DisplayName("Login with role mismatch returns 403 Forbidden")
    void testRoleMismatchReturnsForbidden() {
        // Patient account trying to login as DOCTOR
        AuthRequest request = new AuthRequest("sailaja@gmail.com", "password123", "DOCTOR");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    @DisplayName("Admin account trying to login as PATIENT returns 403 Forbidden")
    void testAdminRoleMismatchReturnsForbidden() {
        AuthRequest request = new AuthRequest("admin@gmail.com", "admin123", "PATIENT");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    @DisplayName("Public sign-up cannot create ADMIN accounts")
    void testPublicAdminSignupRejected() {
        User adminAttempt = new User();
        adminAttempt.setFullName("Fake Admin");
        adminAttempt.setEmail("fakeadmin@gmail.com");
        adminAttempt.setPassword("secret123");
        adminAttempt.setRole("ADMIN");

        ResponseEntity<?> response = authController.register(adminAttempt);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    }

    @Test
    @DisplayName("Public sign-up as PATIENT creates patient record and returns patientId")
    void testPublicPatientSignup() {
        User newPatient = new User();
        newPatient.setFullName("John Doe");
        newPatient.setEmail("johndoe@gmail.com");
        newPatient.setPassword("securePass123");
        newPatient.setRole("PATIENT");

        ResponseEntity<?> response = authController.register(newPatient);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());

        AuthResponse auth = (AuthResponse) response.getBody();
        assertNotNull(auth);
        assertEquals("PATIENT", auth.getRole());
        assertNotNull(auth.getPatientId());
    }

    @Test
    @DisplayName("Public sign-up as DOCTOR creates doctor record and returns doctorId")
    void testPublicDoctorSignup() {
        User newDoctor = new User();
        newDoctor.setFullName("Dr. Alan Turing");
        newDoctor.setEmail("turing@gmail.com");
        newDoctor.setPassword("securePass123");
        newDoctor.setRole("DOCTOR");

        ResponseEntity<?> response = authController.register(newDoctor);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());

        AuthResponse auth = (AuthResponse) response.getBody();
        assertNotNull(auth);
        assertEquals("DOCTOR", auth.getRole());
        assertNotNull(auth.getDoctorId());
    }

    @Test
    @DisplayName("Login with invalid password fails with 401 Unauthorized")
    void testInvalidPasswordFails() {
        AuthRequest request = new AuthRequest("sailaja@gmail.com", "wrongPassword", "PATIENT");
        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }
}

