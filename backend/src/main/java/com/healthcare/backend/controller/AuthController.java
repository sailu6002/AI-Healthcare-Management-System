package com.healthcare.backend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.AuthRequest;
import com.healthcare.backend.dto.AuthResponse;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.PatientRepository;
import com.healthcare.backend.security.JwtService;
import com.healthcare.backend.service.UserService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Autowired
    public AuthController(
            UserService userService,
            JwtService jwtService,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            if (user == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", 400,
                    "error", "Bad Request",
                    "message", "User registration payload cannot be null."
                ));
            }

            // Security check: Never allow public registration of ADMIN role
            if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().trim())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "status", 403,
                    "error", "Forbidden",
                    "message", "Admin accounts cannot be registered publicly."
                ));
            }

            User registeredUser = userService.register(user);

            String token = jwtService.generateToken(
                    registeredUser.getEmail(),
                    registeredUser.getRole()
            );

            Long patientId = null;
            Long doctorId = null;

            if ("PATIENT".equalsIgnoreCase(registeredUser.getRole())) {
                patientId = patientRepository.findByEmail(registeredUser.getEmail())
                        .map(Patient::getPatientId)
                        .orElseGet(() -> patientRepository.findByFullNameIgnoreCase(registeredUser.getFullName())
                                .map(Patient::getPatientId)
                                .orElse(null));
            } else if ("DOCTOR".equalsIgnoreCase(registeredUser.getRole())) {
                doctorId = doctorRepository.findByEmail(registeredUser.getEmail())
                        .map(Doctor::getDoctorId)
                        .orElseGet(() -> doctorRepository.findByFullNameIgnoreCase(registeredUser.getFullName())
                                .map(Doctor::getDoctorId)
                                .orElse(null));
            }

            AuthResponse response = new AuthResponse(
                    registeredUser.getUserId(),
                    registeredUser.getFullName(),
                    registeredUser.getEmail(),
                    registeredUser.getRole(),
                    token,
                    patientId,
                    doctorId
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "status", 400,
                "error", "Bad Request",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", e.getMessage() != null ? e.getMessage() : "Registration failed."
            ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            if (request == null || request.getEmail() == null || request.getEmail().trim().isEmpty() ||
                request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", 400,
                    "error", "Bad Request",
                    "message", "Email and password are required."
                ));
            }

            User loggedInUser = userService.login(
                    request.getEmail(),
                    request.getPassword()
            );

            // Enforce role verification on backend:
            // If the client specified an intended role, verify it against the actual user account role in MySQL
            if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
                String requestedRole = request.getRole().trim().toUpperCase();
                String actualRole = loggedInUser.getRole() != null ? loggedInUser.getRole().trim().toUpperCase() : "";
                if (!requestedRole.equals(actualRole)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "status", 403,
                        "error", "Role Mismatch",
                        "actualRole", actualRole,
                        "expectedRole", requestedRole,
                        "message", "Role mismatch: This account is registered as " + actualRole + 
                                   ", but you selected " + requestedRole + ". Please select the correct role."
                    ));
                }
            }

            String token = jwtService.generateToken(
                    loggedInUser.getEmail(),
                    loggedInUser.getRole()
            );

            Long patientId = null;
            Long doctorId = null;

            if ("PATIENT".equalsIgnoreCase(loggedInUser.getRole())) {
                patientId = patientRepository.findByEmail(loggedInUser.getEmail())
                        .map(Patient::getPatientId)
                        .orElseGet(() -> patientRepository.findByFullNameIgnoreCase(loggedInUser.getFullName())
                                .map(Patient::getPatientId)
                                .orElse(null));
            } else if ("DOCTOR".equalsIgnoreCase(loggedInUser.getRole())) {
                doctorId = doctorRepository.findByEmail(loggedInUser.getEmail())
                        .map(Doctor::getDoctorId)
                        .orElseGet(() -> doctorRepository.findByFullNameIgnoreCase(loggedInUser.getFullName())
                                .map(Doctor::getDoctorId)
                                .orElse(null));
            }

            AuthResponse response = new AuthResponse(
                    loggedInUser.getUserId(),
                    loggedInUser.getFullName(),
                    loggedInUser.getEmail(),
                    loggedInUser.getRole(),
                    token,
                    patientId,
                    doctorId
            );

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "status", 401,
                "error", "Unauthorized",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", e.getMessage() != null ? e.getMessage() : "Authentication failed."
            ));
        }
    }
}
