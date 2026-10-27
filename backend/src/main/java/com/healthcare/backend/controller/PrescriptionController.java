package com.healthcare.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.model.Prescription;
import com.healthcare.backend.service.PrescriptionService;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(
            PrescriptionService prescriptionService) {

        this.prescriptionService = prescriptionService;
    }

    // Create prescription
    @PostMapping
    public Prescription createPrescription(
            @RequestBody Prescription prescription) {

        return prescriptionService
                .createPrescription(prescription);
    }

    // Get all prescriptions
    @GetMapping
    public List<Prescription> getAllPrescriptions() {

        return prescriptionService
                .getAllPrescriptions();
    }

    // Get prescriptions by patient
    @GetMapping("/patient/{patientId}")
    public List<Prescription> getPrescriptionsByPatientId(
            @PathVariable Long patientId) {

        return prescriptionService
                .getPrescriptionsByPatientId(patientId);
    }

    // Get prescription by ID
    @GetMapping("/{id}")
    public ResponseEntity<Prescription> getPrescriptionById(
            @PathVariable Long id) {

        Optional<Prescription> prescription =
                prescriptionService
                        .getPrescriptionById(id);

        return prescription
                .map(ResponseEntity::ok)
                .orElseGet(
                        () -> ResponseEntity.notFound().build()
                );
    }

    // Update prescription
    @PutMapping("/{id}")
    public ResponseEntity<Prescription> updatePrescription(
            @PathVariable Long id,
            @RequestBody Prescription prescriptionDetails) {

        Optional<Prescription> updatedPrescription =
                prescriptionService.updatePrescription(
                        id,
                        prescriptionDetails
                );

        return updatedPrescription
                .map(ResponseEntity::ok)
                .orElseGet(
                        () -> ResponseEntity.notFound().build()
                );
    }

    // Delete prescription
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(
            @PathVariable Long id) {

        prescriptionService.deletePrescription(id);

        return ResponseEntity.noContent().build();
    }
}