package com.healthcare.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.model.Appointment;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.model.MedicalRecord;
import com.healthcare.backend.model.Patient;
import com.healthcare.backend.service.AppointmentService;
import com.healthcare.backend.service.DoctorService;
import com.healthcare.backend.service.MedicalRecordService;
import com.healthcare.backend.service.PatientService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final PatientService patientService;
    private final DoctorService doctorService;
    private final AppointmentService appointmentService;
    private final MedicalRecordService medicalRecordService;

    public AdminController(
            PatientService patientService,
            DoctorService doctorService,
            AppointmentService appointmentService,
            MedicalRecordService medicalRecordService) {

        this.patientService = patientService;
        this.doctorService = doctorService;
        this.appointmentService = appointmentService;
        this.medicalRecordService = medicalRecordService;
    }

    // Test Admin access
    @GetMapping("/test")
    public ResponseEntity<String> adminTest() {
        return ResponseEntity.ok("Admin access successful");
    }

    // Admin can view all patients
    @GetMapping("/patients")
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    // Admin can view all doctors
    @GetMapping("/doctors")
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    // Admin can view all appointments
    @GetMapping("/appointments")
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    // Admin can view all medical records
    @GetMapping("/medical-records")
    public ResponseEntity<List<MedicalRecord>> getAllMedicalRecords() {
        return ResponseEntity.ok(
                medicalRecordService.getAllMedicalRecords()
        );
    }
}