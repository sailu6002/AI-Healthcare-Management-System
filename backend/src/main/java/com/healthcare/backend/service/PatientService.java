package com.healthcare.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.healthcare.backend.dto.PatientProfileRequest;
import com.healthcare.backend.exception.ApiException;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.model.User;
import com.healthcare.backend.repository.PatientRepository;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    // Create patient
    public Patient createPatient(Patient patient) {
        return patientRepository.save(patient);
    }

    // Get all patients
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    // Get patient by ID
    public Optional<Patient> getPatientById(Long id) {
        return patientRepository.findById(id);
    }

    // Update patient
    public Optional<Patient> updatePatient(Long id, Patient patient) {

        return patientRepository.findById(id)
                .map(existingPatient -> {

                    existingPatient.setFullName(patient.getFullName());
                    existingPatient.setAge(patient.getAge());
                    existingPatient.setGender(patient.getGender());
                    existingPatient.setBloodGroup(patient.getBloodGroup());
                    existingPatient.setEmail(patient.getEmail());
                    existingPatient.setPhone(patient.getPhone());
                    existingPatient.setAddress(patient.getAddress());

                    return patientRepository.save(existingPatient);
                });
    }

    // Delete patient
    public void deletePatient(Long id) {
        patientRepository.deleteById(id);
    }

    // ------------------------------------------------------------------
    // Authenticated patient profile (ownership is by the JWT user id)
    // ------------------------------------------------------------------

    /** The profile linked to a login account, if any. */
    public Optional<Patient> getProfileForUser(Long userId) {
        return patientRepository.findByUserId(userId);
    }

    /** The profile linked to a login account, or a clear profile-required error. */
    public Patient requireProfileForUser(Long userId) {
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(
                        "A patient profile is required before booking. "
                                + "Please complete your profile.",
                        409,
                        "profile_required"));
    }

    /** Explicitly create a profile for the authenticated account. */
    public Patient createProfileForUser(User user, PatientProfileRequest request) {

        if (patientRepository.existsByUserId(user.getUserId())) {
            throw new ApiException(
                    "A patient profile already exists for this account.",
                    409,
                    "profile_exists");
        }

        Patient patient = new Patient();
        patient.setUserId(user.getUserId());
        applyProfile(patient, request, user);
        return patientRepository.save(patient);
    }

    /** Update the authenticated account's own profile. */
    public Patient updateProfileForUser(User user, PatientProfileRequest request) {

        Patient patient = requireProfileForUser(user.getUserId());
        applyProfile(patient, request, user);
        return patientRepository.save(patient);
    }

    private void applyProfile(
            Patient patient, PatientProfileRequest request, User user) {

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new ApiException(
                    "Full name is required.", 400, "validation_error");
        }

        if (request.getAge() == null
                || request.getAge() < 1
                || request.getAge() > 120) {
            throw new ApiException(
                    "Age must be a whole number between 1 and 120.",
                    400,
                    "validation_error");
        }

        patient.setFullName(request.getFullName().trim());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setPhone(request.getPhone());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setAddress(request.getAddress());

        // Default to the account email; never required from the client.
        String email = request.getEmail();
        patient.setEmail(
                (email == null || email.isBlank()) ? user.getEmail() : email.trim());
    }
}
