package com.healthcare.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.service.DoctorService;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {
    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // Get all available clinical departments / specializations
    @GetMapping({"/specializations", "/departments"})
    public ResponseEntity<List<String>> getSpecializations() {
        return ResponseEntity.ok(doctorService.getSpecializations());
    }

    // Get doctors filtered by specialization (or all doctors if not specified)
    @GetMapping(value = {"/specialization", "/specialization/{specialization}", "/department/{specialization}"})
    public ResponseEntity<List<Doctor>> getDoctorsBySpecialization(@PathVariable(required = false) String specialization) {
        return ResponseEntity.ok(doctorService.getDoctorsBySpecialization(specialization));
    }

    // Create doctor
    @PostMapping
    public ResponseEntity<Doctor> createDoctor(@RequestBody Doctor doctor) {
        return ResponseEntity.ok(doctorService.createDoctor(doctor));
    }

    // Get all doctors
    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    // Get doctor by ID (explicit numeric path variable to avoid collision with sub-routes)
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Long id) {
        Optional<Doctor> doctor = doctorService.getDoctorById(id);
        return doctor.map(ResponseEntity::ok)
                     .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update doctor
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<Doctor> updateDoctor(
            @PathVariable Long id,
            @RequestBody Doctor doctorDetails) {
        Optional<Doctor> updatedDoctor = doctorService.updateDoctor(id, doctorDetails);
        return updatedDoctor.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete doctor
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }
}
