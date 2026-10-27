package com.healthcare.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.healthcare.backend.model.Patient;
import com.healthcare.backend.repository.PatientRepository;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    // Create patient without duplicates
    public Patient createPatient(Patient patient) {
        if (patient.getEmail() != null && !patient.getEmail().trim().isEmpty()) {
            Optional<Patient> byEmail = patientRepository.findByEmail(patient.getEmail().trim());
            if (byEmail.isPresent()) {
                return byEmail.get();
            }
        }

        if (patient.getPhone() != null && !patient.getPhone().trim().isEmpty()) {
            Optional<Patient> byPhone = patientRepository.findByPhone(patient.getPhone().trim());
            if (byPhone.isPresent()) {
                return byPhone.get();
            }
        }

        if (patient.getFullName() != null && !patient.getFullName().trim().isEmpty()) {
            Optional<Patient> byName = patientRepository.findByFullNameIgnoreCase(patient.getFullName().trim());
            if (byName.isPresent()) {
                return byName.get();
            }
        }

        return patientRepository.save(patient);
    }

    // Get all patients
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    // Get patient by email
    public Optional<Patient> getPatientByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return Optional.empty();
        }
        return patientRepository.findByEmail(email.trim());
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
}
