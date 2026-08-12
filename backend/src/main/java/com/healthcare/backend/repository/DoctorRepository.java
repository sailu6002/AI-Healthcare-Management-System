package com.healthcare.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.Doctor;
public interface DoctorRepository extends JpaRepository<Doctor, Long>{
    
}
