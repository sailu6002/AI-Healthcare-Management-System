package com.healthcare.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.PatientProfileRequest;
import com.healthcare.backend.exception.ApiException;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.model.User;
import com.healthcare.backend.service.PatientService;
import com.healthcare.backend.service.UserService;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;
    private final UserService userService;

    public PatientController(
            PatientService patientService, UserService userService) {
        this.patientService = patientService;
        this.userService = userService;
    }

    // ------------------------------------------------------------------
    // Authenticated patient's own profile
    // ------------------------------------------------------------------

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public Patient getMyProfile(Principal principal) {

        User user = userService.getByEmail(principal.getName());

        return patientService.getProfileForUser(user.getUserId())
                .orElseThrow(() -> new ApiException(
                        "A patient profile is required. Please complete "
                                + "your profile.",
                        409,
                        "profile_required"));
    }

    @PostMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Patient> createMyProfile(
            @RequestBody PatientProfileRequest request,
            Principal principal) {

        User user = userService.getByEmail(principal.getName());
        Patient patient = patientService.createProfileForUser(user, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(patient);
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    public Patient updateMyProfile(
            @RequestBody PatientProfileRequest request,
            Principal principal) {

        User user = userService.getByEmail(principal.getName());
        return patientService.updateProfileForUser(user, request);
    }

    // ------------------------------------------------------------------
    // Administrative endpoints
    // ------------------------------------------------------------------

    // Create a new patient
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        Patient savedPatient = patientService.createPatient(patient);
        return ResponseEntity.ok(savedPatient);
    }

    // Get all patients
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    // Get patient by email
    @GetMapping("/by-email/{email}")
    public ResponseEntity<Patient> getPatientByEmail(@PathVariable String email) {
        return patientService.getPatientByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get patient by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update patient
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Patient> updatePatient(
            @PathVariable Long id,
            @RequestBody Patient patient) {

        return patientService.updatePatient(id, patient)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete patient
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
