package com.healthcare.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.Prescription;

public interface PrescriptionRepository
        extends JpaRepository<Prescription, Long> {

    List<Prescription> findByPatientId(Long patientId);
        }