package com.healthcare.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.Patient;


public interface PatientRepository extends JpaRepository<Patient, Long> {
    
}
