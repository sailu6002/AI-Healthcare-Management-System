package com.healthcare.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "analyzed_reports")
public class AnalyzedReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    private String patientName;

    @Column(nullable = false)
    private String reportTitle;

    private String fileName;

    private String fileType;

    private Long fileSizeBytes;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    @Column(columnDefinition = "LONGTEXT")
    private String rawExtractedText;

    @Column(columnDefinition = "LONGTEXT")
    private String clinicalSummary;

    @Column(columnDefinition = "LONGTEXT")
    private String extractedLabValuesJson;

    @Column(columnDefinition = "LONGTEXT")
    private String abnormalFindingsJson;

    private String overallRiskLevel; // NORMAL, ATTENTION_RECOMMENDED, HIGH_ATTENTION

    @Column(columnDefinition = "LONGTEXT")
    private String storedFilePath;

    @Column(columnDefinition = "TEXT")
    private String clinicalDisclaimer;

    public AnalyzedReport() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getReportTitle() {
        return reportTitle;
    }

    public void setReportTitle(String reportTitle) {
        this.reportTitle = reportTitle;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public void setFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getRawExtractedText() {
        return rawExtractedText;
    }

    public void setRawExtractedText(String rawExtractedText) {
        this.rawExtractedText = rawExtractedText;
    }

    public String getClinicalSummary() {
        return clinicalSummary;
    }

    public void setClinicalSummary(String clinicalSummary) {
        this.clinicalSummary = clinicalSummary;
    }

    public String getExtractedLabValuesJson() {
        return extractedLabValuesJson;
    }

    public void setExtractedLabValuesJson(String extractedLabValuesJson) {
        this.extractedLabValuesJson = extractedLabValuesJson;
    }

    public String getAbnormalFindingsJson() {
        return abnormalFindingsJson;
    }

    public void setAbnormalFindingsJson(String abnormalFindingsJson) {
        this.abnormalFindingsJson = abnormalFindingsJson;
    }

    public String getOverallRiskLevel() {
        return overallRiskLevel;
    }

    public void setOverallRiskLevel(String overallRiskLevel) {
        this.overallRiskLevel = overallRiskLevel;
    }

    public String getStoredFilePath() {
        return storedFilePath;
    }

    public void setStoredFilePath(String storedFilePath) {
        this.storedFilePath = storedFilePath;
    }

    public String getClinicalDisclaimer() {
        return clinicalDisclaimer;
    }

    public void setClinicalDisclaimer(String clinicalDisclaimer) {
        this.clinicalDisclaimer = clinicalDisclaimer;
    }
}

