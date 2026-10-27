package com.healthcare.backend.controller;
<<<<<<< HEAD

=======
import java.time.LocalDate;
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
import java.util.List;
import java.util.Optional;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.AvailabilitySlot;
import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.service.AvailabilityService;
import com.healthcare.backend.service.DoctorService;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {
    private final DoctorService doctorService;
    private final AvailabilityService availabilityService;

    public DoctorController(
            DoctorService doctorService,
            AvailabilityService availabilityService) {
        this.doctorService = doctorService;
        this.availabilityService = availabilityService;
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
<<<<<<< HEAD
    public ResponseEntity<Doctor> createDoctor(@RequestBody Doctor doctor) {
        return ResponseEntity.ok(doctorService.createDoctor(doctor));
=======
    @PreAuthorize("hasRole('ADMIN')")
    public Doctor createDoctor(@RequestBody Doctor doctor) {
        return doctorService.createDoctor(doctor);
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
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

    // Real, bookable slots for a doctor on a given date. Read-only for any
    // authenticated role; a doctor with no configured schedule returns [].
    @GetMapping("/{doctorId}/availability")
    public List<AvailabilitySlot> getAvailability(
            @PathVariable Long doctorId,
            @RequestParam("date")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return availabilityService.getAvailability(doctorId, date);
    }

    // Update doctor
<<<<<<< HEAD
    @PutMapping("/{id:\\d+}")
=======
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
    public ResponseEntity<Doctor> updateDoctor(
            @PathVariable Long id,
            @RequestBody Doctor doctorDetails) {
        Optional<Doctor> updatedDoctor = doctorService.updateDoctor(id, doctorDetails);
        return updatedDoctor.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete doctor
<<<<<<< HEAD
    @DeleteMapping("/{id:\\d+}")
=======
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
>>>>>>> 3c0ee2c79f132e522dff7a4eab30667464e81af1
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }
}
