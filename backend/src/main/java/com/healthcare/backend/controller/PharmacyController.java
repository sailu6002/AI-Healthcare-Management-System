package com.healthcare.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.PharmacyDto;
import com.healthcare.backend.service.PharmacyService;

@RestController
@RequestMapping("/api/pharmacies")
public class PharmacyController {

    private final PharmacyService pharmacyService;

    public PharmacyController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    /**
     * Get nearby pharmacies based on GPS coordinates or default area
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<PharmacyDto>> getNearbyPharmacies(
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "radiusKm", required = false, defaultValue = "25.0") Double radiusKm,
            @RequestParam(value = "medicineQuery", required = false) String medicineQuery,
            @RequestParam(value = "sortBy", required = false, defaultValue = "distance") String sortBy
    ) {
        List<PharmacyDto> list = pharmacyService.getNearbyPharmacies(
                lat,
                lng,
                radiusKm,
                medicineQuery,
                sortBy
        );
        return ResponseEntity.ok(list);
    }

    /**
     * Search pharmacies by city, postal code, or area text
     */
    @GetMapping("/search")
    public ResponseEntity<List<PharmacyDto>> searchPharmacies(
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "medicineQuery", required = false) String medicineQuery
    ) {
        List<PharmacyDto> list = pharmacyService.searchPharmaciesByLocationText(location, medicineQuery);
        return ResponseEntity.ok(list);
    }
}

