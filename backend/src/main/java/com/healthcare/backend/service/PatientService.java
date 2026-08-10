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
}