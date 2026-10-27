package com.healthcare.backend.repository;
<<<<<<< HEAD

import java.util.List;
import java.util.Optional;
=======
import java.time.LocalDate;
import java.util.List;
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1

import org.springframework.data.jpa.repository.JpaRepository;

import com.healthcare.backend.model.Appointment;

<<<<<<< HEAD
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Get appointments for a specific patient
    List<Appointment> findByPatientId(Long patientId);

    // Get appointments for a specific doctor
    List<Appointment> findByDoctorId(Long doctorId);

    // Get all appointments for a doctor on a specific date
    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, String appointmentDate);

    // Get all appointments for a patient on a specific date
    List<Appointment> findByPatientIdAndAppointmentDate(Long patientId, String appointmentDate);

    // Find duplicate appointment
    Optional<Appointment> findByPatientIdAndDoctorIdAndAppointmentDateAndAppointmentTime(
            Long patientId, Long doctorId, String appointmentDate, String appointmentTime);

    // Find active appointments for a doctor on a specific date (excluding cancelled)
    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusNot(
            Long doctorId, String appointmentDate, String status);

    // Double booking check: Check if doctor has an active booking at specific date and time
    Optional<Appointment> findByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
            Long doctorId, String appointmentDate, String appointmentTime, String status);

    // Patient conflict check: Check if patient already has an active appointment at specific date and time
    Optional<Appointment> findByPatientIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
            Long patientId, String appointmentDate, String appointmentTime, String status);

    // Find all active appointments for reminder processing
    List<Appointment> findByStatusNot(String status);
=======
public interface AppointmentRepository extends JpaRepository<Appointment, Long>{

    List<Appointment> findByPatientIdOrderByAppointmentDateDescAppointmentTimeDesc(
            Long patientId);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatus(
            Long doctorId, LocalDate appointmentDate, String status);
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
}
