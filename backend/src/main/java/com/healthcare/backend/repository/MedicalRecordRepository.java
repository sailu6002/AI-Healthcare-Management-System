package com.healthcare.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.MedicalRecord;
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long>{
    
}
