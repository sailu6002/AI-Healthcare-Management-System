package com.healthcare.backend.service;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.healthcare.backend.model.MedicalRecord;
import com.healthcare.backend.repository.MedicalRecordRepository;

@Service
public class MedicalRecordService {
    private final MedicalRecordRepository medicalRecordRepository;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository) {
        this.medicalRecordRepository = medicalRecordRepository;
    }

    // Create
    public MedicalRecord createMedicalRecord(MedicalRecord medicalRecord) {
        return medicalRecordRepository.save(medicalRecord);
    }

    // Get All
    public List<MedicalRecord> getAllMedicalRecords() {
        return medicalRecordRepository.findAll();
    }

    // Get By ID
    public Optional<MedicalRecord> getMedicalRecordById(Long id) {
        return medicalRecordRepository.findById(id);
    }

    // Update
    public Optional<MedicalRecord> updateMedicalRecord(Long id, MedicalRecord details) {

        return medicalRecordRepository.findById(id).map(record -> {

            record.setPatientId(details.getPatientId());
            record.setDoctorId(details.getDoctorId());
            record.setAppointmentId(details.getAppointmentId());
            record.setDiagnosis(details.getDiagnosis());
            record.setPrescription(details.getPrescription());
            record.setTestResults(details.getTestResults());
            record.setVisitDate(details.getVisitDate());

            return medicalRecordRepository.save(record);
        });
    }

    // Delete
    public void deleteMedicalRecord(Long id) {
        medicalRecordRepository.deleteById(id);
    }
}
