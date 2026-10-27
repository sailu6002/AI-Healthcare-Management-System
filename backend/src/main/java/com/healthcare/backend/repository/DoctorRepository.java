package com.healthcare.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.healthcare.backend.model.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    // Find a doctor using the email associated with their account
    Optional<Doctor> findByEmail(String email);

    // Find a doctor using their full name
    Optional<Doctor> findByFullNameIgnoreCase(String fullName);

    // Find doctors by specialization case-insensitively with trimmed matching
    @Query("SELECT d FROM Doctor d WHERE LOWER(TRIM(d.specialization)) = LOWER(TRIM(:specialization))")
    List<Doctor> findBySpecializationIgnoreCase(@Param("specialization") String specialization);

    // Retrieve distinct non-empty specializations/departments sorted alphabetically
    @Query("SELECT DISTINCT TRIM(d.specialization) FROM Doctor d WHERE d.specialization IS NOT NULL AND TRIM(d.specialization) <> '' ORDER BY TRIM(d.specialization) ASC")
    List<String> findDistinctSpecializations();
}
