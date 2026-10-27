package com.healthcare.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.healthcare.backend.model.Prescription;
import com.healthcare.backend.repository.PrescriptionRepository;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;

    public PrescriptionService(PrescriptionRepository prescriptionRepository) {
        this.prescriptionRepository = prescriptionRepository;
    }

    // Create prescription
    public Prescription createPrescription(Prescription prescription) {
        return prescriptionRepository.save(prescription);
    }

    // Get all prescriptions
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    // Get prescriptions by patient
    public List<Prescription> getPrescriptionsByPatientId(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    // Get prescription by ID
    public Optional<Prescription> getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id);
    }

    // Update prescription
    public Optional<Prescription> updatePrescription(
            Long id,
            Prescription prescriptionDetails) {

        return prescriptionRepository.findById(id)
                .map(prescription -> {

                    prescription.setPatientId(
                            prescriptionDetails.getPatientId()
                    );

                    prescription.setDoctorId(
                            prescriptionDetails.getDoctorId()
                    );

                    prescription.setMedicine(
                            prescriptionDetails.getMedicine()
                    );

                    prescription.setPurpose(
                            prescriptionDetails.getPurpose()
                    );

                    prescription.setDosage(
                            prescriptionDetails.getDosage()
                    );

                    prescription.setFrequency(
                            prescriptionDetails.getFrequency()
                    );

                    prescription.setDuration(
                            prescriptionDetails.getDuration()
                    );

                    prescription.setPrescriptionDate(
                            prescriptionDetails.getPrescriptionDate()
                    );

                    prescription.setStatus(
                            prescriptionDetails.getStatus()
                    );

                    return prescriptionRepository.save(prescription);
                });
    }

    // Delete prescription
    public void deletePrescription(Long id) {
        prescriptionRepository.deleteById(id);
    }
}