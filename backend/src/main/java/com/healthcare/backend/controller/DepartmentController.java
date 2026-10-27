package com.healthcare.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.service.DoctorService;

@RestController
public class DepartmentController {

    private final DoctorService doctorService;

    public DepartmentController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping({"/api/specializations", "/api/departments"})
    public ResponseEntity<List<String>> getSpecializations() {
        return ResponseEntity.ok(doctorService.getSpecializations());
    }
}

