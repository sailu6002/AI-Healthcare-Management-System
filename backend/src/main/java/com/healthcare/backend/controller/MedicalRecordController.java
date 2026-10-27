
package com.healthcare.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.model.MedicalRecord;
import com.healthcare.backend.service.MedicalRecordService;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(
            MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    // Create a medical record
    @PostMapping
    public ResponseEntity<?> createMedicalRecord(
            @RequestBody MedicalRecord medicalRecord) {

        if (medicalRecord == null
                || medicalRecord.getPatientId() == null
                || medicalRecord.getDoctorId() == null) {

            return ResponseEntity.badRequest()
                    .body("Patient ID and Doctor ID are required.");
        }

        MedicalRecord createdRecord =
                medicalRecordService.createMedicalRecord(medicalRecord);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(createdRecord);
    }

    // Get all medical records
    // Restrict this endpoint to authorized administrators
    // through your Spring Security configuration.
    @GetMapping
    public ResponseEntity<List<MedicalRecord>> getAllMedicalRecords() {

        List<MedicalRecord> records =
                medicalRecordService.getAllMedicalRecords();

        return ResponseEntity.ok(records);
    }

    // Get medical records by patient ID
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecord>>
            getMedicalRecordsByPatientId(
                    @PathVariable Long patientId) {

        if (patientId == null || patientId <= 0) {
            return ResponseEntity.badRequest().build();
        }

        List<MedicalRecord> records =
                medicalRecordService
                        .getMedicalRecordsByPatientId(patientId);

        return ResponseEntity.ok(records);
    }

    // Get medical records by doctor ID
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<MedicalRecord>>
            getMedicalRecordsByDoctorId(
                    @PathVariable Long doctorId) {

        if (doctorId == null || doctorId <= 0) {
            return ResponseEntity.badRequest().build();
        }

        List<MedicalRecord> records =
                medicalRecordService
                        .getMedicalRecordsByDoctorId(doctorId);

        return ResponseEntity.ok(records);
    }

    // Get one medical record by ID
    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecord> getMedicalRecordById(
            @PathVariable Long id) {

        if (id == null || id <= 0) {
            return ResponseEntity.badRequest().build();
        }

        Optional<MedicalRecord> record =
                medicalRecordService.getMedicalRecordById(id);

        return record
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update a medical record
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMedicalRecord(
            @PathVariable Long id,
            @RequestBody MedicalRecord medicalRecord) {

        if (id == null || id <= 0 || medicalRecord == null) {
            return ResponseEntity.badRequest()
                    .body("A valid record ID and record data are required.");
        }

        Optional<MedicalRecord> updatedRecord =
                medicalRecordService
                        .updateMedicalRecord(id, medicalRecord);

        return updatedRecord
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete a medical record
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicalRecord(
            @PathVariable Long id) {

        Optional<MedicalRecord> record =
                medicalRecordService.getMedicalRecordById(id);

        if (record.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        medicalRecordService.deleteMedicalRecord(id);

        return ResponseEntity.noContent().build();
    }
}