package com.healthcare.backend.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.Patient;


import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
<<<<<<< HEAD
    Optional<Patient> findByEmail(String email);
    Optional<Patient> findByPhone(String phone);
    Optional<Patient> findByFullNameIgnoreCase(String fullName);
=======

    Optional<Patient> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
}
