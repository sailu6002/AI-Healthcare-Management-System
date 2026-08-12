package com.healthcare.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long>{
    
}
