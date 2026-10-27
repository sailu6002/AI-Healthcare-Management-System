package com.healthcare.backend.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

<<<<<<< HEAD
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.model.Patient;
=======
import com.healthcare.backend.exception.AuthException;
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.DoctorRepository;
import com.healthcare.backend.repository.PatientRepository;
import com.healthcare.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(User user) {
<<<<<<< HEAD
        if (user == null) {
            throw new IllegalArgumentException("User registration payload cannot be null.");
        }

        if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required.");
        }

        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }

        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required.");
        }

        if (user.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        String normalizedEmail = user.getEmail().trim().toLowerCase();

        // Enforce security rule: public registration cannot create ADMIN accounts
        if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().trim())) {
            throw new IllegalArgumentException("Admin accounts cannot be registered publicly.");
        }

        String normalizedRole = "PATIENT";
        if (user.getRole() != null && !user.getRole().trim().isEmpty()) {
            String roleUpper = user.getRole().trim().toUpperCase();
            if ("DOCTOR".equals(roleUpper)) {
                normalizedRole = "DOCTOR";
            } else if ("PATIENT".equals(roleUpper)) {
                normalizedRole = "PATIENT";
            } else {
                throw new IllegalArgumentException("Invalid registration role. Allowed roles: Patient, Doctor.");
            }
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered: " + normalizedEmail);
        }

        user.setFullName(user.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setRole(normalizedRole);
=======

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new AuthException("Email already registered", 409);
        }

        // Public registration must never be able to choose a privileged role.
        // Any client-supplied role (including "ADMIN") is ignored.
        user.setRole("PATIENT");

>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        User savedUser = userRepository.save(user);

        // If registered user is a PATIENT, ensure corresponding Patient record exists
        if ("PATIENT".equalsIgnoreCase(savedUser.getRole())) {
            Optional<Patient> existingPatient = patientRepository.findByEmail(savedUser.getEmail());
            if (existingPatient.isEmpty()) {
                Patient newPatient = new Patient();
                newPatient.setFullName(savedUser.getFullName());
                newPatient.setEmail(savedUser.getEmail());
                newPatient.setBloodGroup("O+");
                patientRepository.save(newPatient);
            }
        } else if ("DOCTOR".equalsIgnoreCase(savedUser.getRole())) {
            Optional<Doctor> existingDoctor = doctorRepository.findByEmail(savedUser.getEmail());
            if (existingDoctor.isEmpty()) {
                Doctor newDoctor = new Doctor();
                newDoctor.setFullName(savedUser.getFullName());
                newDoctor.setEmail(savedUser.getEmail());
                newDoctor.setSpecialization("General Medicine");
                doctorRepository.save(newDoctor);
            }
        }

        return savedUser;
    }

    public User getByEmail(String email) {

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new AuthException("Invalid email or password", 401));
    }


    public User login(String email, String password) {
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Email and password are required.");
        }

<<<<<<< HEAD
        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            // Check if password was stored as plain text in initial SQL script, and upgrade to BCrypt
            if (password.equals(user.getPassword())) {
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
                return user;
            }
            throw new IllegalArgumentException("Invalid email or password.");
=======
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new AuthException("Invalid email or password", 401));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AuthException("Invalid email or password", 401);
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
        }

        return user;
    }
}
