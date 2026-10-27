package com.healthcare.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.DrugInteractionResultDto;
import com.healthcare.backend.dto.MedicineDto;
import com.healthcare.backend.service.MedicineService;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    /**
     * Search verified medicines by name, brand, or therapeutic category
     */
    @GetMapping
    public ResponseEntity<List<MedicineDto>> searchMedicines(
            @RequestParam(value = "query", required = false) String query
    ) {
        return ResponseEntity.ok(medicineService.searchMedicines(query));
    }

    /**
     * Get specific medicine details
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getMedicineById(@PathVariable String id) {
        MedicineDto med = medicineService.getMedicineByIdOrName(id);
        if (med == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(med);
    }

    /**
     * Check drug-drug interactions across a list of medications
     */
    @PostMapping("/check-interactions")
    public ResponseEntity<List<DrugInteractionResultDto>> checkInteractions(
            @RequestBody List<String> drugNames
    ) {
        if (drugNames == null || drugNames.size() < 2) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(medicineService.checkInteractions(drugNames));
    }

    /**
     * Retrieve medications recorded in the patient's medical records
     */
    @GetMapping("/patient/{patientId}/recorded")
    public ResponseEntity<Map<String, Object>> getRecordedMedications(
            @PathVariable Long patientId
    ) {
        if (patientId == null || patientId <= 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(medicineService.getRecordedMedicationsForPatient(patientId));
    }
}

