
package com.healthcare.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.healthcare.backend.model.MedicalRecord;
import com.healthcare.backend.repository.MedicalRecordRepository;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;

    public MedicalRecordService(
            MedicalRecordRepository medicalRecordRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
    }

    // Create a medical record
    @Transactional
    public MedicalRecord createMedicalRecord(
            MedicalRecord medicalRecord) {

        if (medicalRecord == null) {
            throw new IllegalArgumentException(
                    "Medical record cannot be empty."
            );
        }

        if (medicalRecord.getPatientId() == null
                || medicalRecord.getDoctorId() == null) {
            throw new IllegalArgumentException(
                    "Patient ID and Doctor ID are required."
            );
        }

        return medicalRecordRepository.save(medicalRecord);
    }

    // Get all medical records
    @Transactional(readOnly = true)
    public List<MedicalRecord> getAllMedicalRecords() {
        return medicalRecordRepository.findAll();
    }

    // Get medical records by patient ID
    @Transactional(readOnly = true)
    public List<MedicalRecord> getMedicalRecordsByPatientId(
            Long patientId) {

        if (patientId == null || patientId <= 0) {
            throw new IllegalArgumentException(
                    "A valid patient ID is required."
            );
        }

        return medicalRecordRepository.findByPatientId(patientId);
    }

    // Get medical records by doctor ID
    @Transactional(readOnly = true)
    public List<MedicalRecord> getMedicalRecordsByDoctorId(
            Long doctorId) {

        if (doctorId == null || doctorId <= 0) {
            throw new IllegalArgumentException(
                    "A valid doctor ID is required."
            );
        }

        return medicalRecordRepository.findByDoctorId(doctorId);
    }

    // Get a medical record by ID
    @Transactional(readOnly = true)
    public Optional<MedicalRecord> getMedicalRecordById(Long id) {

        if (id == null || id <= 0) {
            return Optional.empty();
        }

        return medicalRecordRepository.findById(id);
    }

    // Update an existing medical record
    @Transactional
    public Optional<MedicalRecord> updateMedicalRecord(
            Long id,
            MedicalRecord details) {

        if (id == null || id <= 0 || details == null) {
            return Optional.empty();
        }

        return medicalRecordRepository.findById(id).map(record -> {

            // Keep the existing patient, doctor and appointment IDs.
            // Updating clinical details must not change record ownership.

            record.setDiagnosis(details.getDiagnosis());
            record.setSymptoms(details.getSymptoms());
            record.setTreatment(details.getTreatment());
            record.setPrescription(details.getPrescription());
            record.setTestResults(details.getTestResults());
            record.setVisitDate(details.getVisitDate());

            return medicalRecordRepository.save(record);
        });
    }

    // Delete a medical record
    @Transactional
    public void deleteMedicalRecord(Long id) {

        if (id == null || id <= 0) {
            throw new IllegalArgumentException(
                    "A valid medical record ID is required."
            );
        }

        if (!medicalRecordRepository.existsById(id)) {
            throw new IllegalArgumentException(
                    "Medical record not found: " + id
            );
        }

        medicalRecordRepository.deleteById(id);
    }
}