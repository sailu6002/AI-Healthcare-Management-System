package com.healthcare.backend.repository;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, Long>{

    List<Appointment> findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(
            Long patientId);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatus(
            Long doctorId, LocalDate appointmentDate, String status);
}
