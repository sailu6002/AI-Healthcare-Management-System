package com.healthcare.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.MedicalRecord;

public interface MedicalRecordRepository
        extends JpaRepository<MedicalRecord, Long> {

    // Find medical records belonging to a patient
    List<MedicalRecord> findByPatientId(Long patientId);

    // Find medical records created by or assigned to a doctor
    List<MedicalRecord> findByDoctorId(Long doctorId);
}

