package com.healthcare.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.Patient;


import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByPhone(String phone);
    Optional<Patient> findByFullNameIgnoreCase(String fullName);
}
