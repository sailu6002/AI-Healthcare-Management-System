package com.healthcare.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.healthcare.backend.model.Doctor;
import com.healthcare.backend.repository.DoctorRepository;

@Service
public class DoctorService {
    private final DoctorRepository doctorRepository;

    private static final List<String> DEFAULT_SPECIALIZATIONS = List.of(
            "Cardiology",
            "Dermatology",
            "Endocrinology",
            "General Medicine",
            "Neurology",
            "Orthopedics",
            "Pediatrics"
    );

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    // Create doctor without duplicates
    public Doctor createDoctor(Doctor doctor) {
        if (doctor.getEmail() != null && !doctor.getEmail().trim().isEmpty()) {
            Optional<Doctor> byEmail = doctorRepository.findByEmail(doctor.getEmail().trim());
            if (byEmail.isPresent()) {
                return byEmail.get();
            }
        }

        if (doctor.getFullName() != null && !doctor.getFullName().trim().isEmpty()) {
            Optional<Doctor> byName = doctorRepository.findByFullNameIgnoreCase(doctor.getFullName().trim());
            if (byName.isPresent()) {
                return byName.get();
            }
        }

        return doctorRepository.save(doctor);
    }

    // Get all doctors
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    // Get all distinct available specializations / departments
    public List<String> getSpecializations() {
        try {
            List<String> specializations = doctorRepository.findDistinctSpecializations();
            if (specializations != null && !specializations.isEmpty()) {
                return specializations;
            }
        } catch (Exception e) {
            // Log and fallback to findAll() below
        }

        // Fallback from existing doctors in database if custom query fails or returns empty
        List<String> fromDoctors = doctorRepository.findAll().stream()
                .map(Doctor::getSpecialization)
                .filter(s -> s != null && !s.trim().isEmpty())
                .map(String::trim)
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        if (!fromDoctors.isEmpty()) {
            return fromDoctors;
        }

        return DEFAULT_SPECIALIZATIONS;
    }

    // Get doctors by specialization with flexible matching
    public List<Doctor> getDoctorsBySpecialization(String specialization) {
        if (specialization == null || specialization.trim().isEmpty() || "all".equalsIgnoreCase(specialization.trim())) {
            return doctorRepository.findAll();
        }
        String cleanSpec = specialization.trim();
        try {
            List<Doctor> docs = doctorRepository.findBySpecializationIgnoreCase(cleanSpec);
            if (docs != null && !docs.isEmpty()) {
                return docs;
            }
        } catch (Exception e) {
            // Fallback to in-memory filter
        }

        // Flexible matching if terminology differs (e.g. "Cardiology" vs "Cardiologist")
        return doctorRepository.findAll().stream()
                .filter(d -> d.getSpecialization() != null &&
                        (d.getSpecialization().trim().equalsIgnoreCase(cleanSpec) ||
                         d.getSpecialization().toLowerCase().contains(cleanSpec.toLowerCase()) ||
                         cleanSpec.toLowerCase().contains(d.getSpecialization().toLowerCase())))
                .toList();
    }

    // Get doctor by ID
    public Optional<Doctor> getDoctorById(Long id) {
        return doctorRepository.findById(id);
    }

    // Update doctor
    public Optional<Doctor> updateDoctor(Long id, Doctor doctorDetails) {
        return doctorRepository.findById(id).map(doctor -> {
            doctor.setFullName(doctorDetails.getFullName());
            doctor.setSpecialization(doctorDetails.getSpecialization());
            doctor.setEmail(doctorDetails.getEmail());
            doctor.setPhone(doctorDetails.getPhone());
            doctor.setExperience(doctorDetails.getExperience());
            doctor.setAddress(doctorDetails.getAddress());

            return doctorRepository.save(doctor);
        });
    }

    // Delete doctor
    public void deleteDoctor(Long id) {
        doctorRepository.deleteById(id);
    }
}
