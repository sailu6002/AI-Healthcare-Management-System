package com.healthcare.backend.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.List;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.healthcare.backend.model.AnalyzedReport;
import com.healthcare.backend.service.MedicalReportAnalysisService;

@RestController
@RequestMapping("/api/medical-reports")
public class MedicalReportAnalysisController {

    private final MedicalReportAnalysisService reportService;

    public MedicalReportAnalysisController(MedicalReportAnalysisService reportService) {
        this.reportService = reportService;
    }

    /**
     * Upload and analyze a medical report (PDF, Image, Text, or Manual Lab Entries)
     */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAndAnalyzeReport(
            @RequestParam(value = "patientId", required = false) Long patientId,
            @RequestParam(value = "patientName", required = false) String patientName,
            @RequestParam(value = "reportTitle", required = false) String reportTitle,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "manualTextInput", required = false) String manualTextInput
    ) {
        try {
            if ((file == null || file.isEmpty()) && (manualTextInput == null || manualTextInput.trim().isEmpty())) {
                return ResponseEntity.badRequest().body("Please provide either a report file or clinical report text to analyze.");
            }

            AnalyzedReport report = reportService.analyzeAndSaveReport(
                    patientId != null ? patientId : 1L,
                    patientName,
                    reportTitle,
                    file,
                    manualTextInput
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(report);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process and analyze report: " + e.getMessage());
        }
    }

    /**
     * Fetch all analyzed reports for a patient
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AnalyzedReport>> getReportsByPatientId(@PathVariable Long patientId) {
        if (patientId == null || patientId <= 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(reportService.getReportsByPatientId(patientId));
    }

    /**
     * Fetch a single analyzed report by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getReportById(@PathVariable Long id) {
        AnalyzedReport report = reportService.getReportById(id);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Medical report not found.");
        }
        return ResponseEntity.ok(report);
    }

    /**
     * Securely download or view the original uploaded report file
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadOriginalFile(@PathVariable Long id) {
        AnalyzedReport report = reportService.getReportById(id);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Report record not found.");
        }

        File file = reportService.getStoredFile(id);
        if (file == null || !file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Original file attachment is not available on server.");
        }

        try {
            InputStreamResource resource = new InputStreamResource(new FileInputStream(file));
            String contentType = report.getFileType() != null ? report.getFileType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(file.length())
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error reading report file: " + e.getMessage());
        }
    }
}

