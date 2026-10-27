package com.healthcare.backend.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.backend.model.AnalyzedReport;
import com.healthcare.backend.repository.AnalyzedReportRepository;

@Service
public class MedicalReportAnalysisService {

    public static final String CLINICAL_DISCLAIMER =
            "DISCLAIMER: This automated medical report analysis is an AI-assisted screening " +
            "and information extraction aid. It does NOT constitute a confirmed medical diagnosis, " +
            "clinical treatment plan, or laboratory certification. Reference ranges are based on " +
            "standard published medical guidelines and may vary by specific diagnostic laboratory. " +
            "Please present your original laboratory report to your physician for professional clinical evaluation.";

    private final AnalyzedReportRepository reportRepository;
    private final ObjectMapper objectMapper;
    private final Path uploadStorageDir;

    // Standard clinical reference range definitions
    public record ReferenceRange(
            String parameter,
            String aliasPattern,
            double minNormal,
            double maxNormal,
            String unit,
            String normalDescription,
            String category
    ) {}

    private final List<ReferenceRange> referenceRanges = List.of(
            new ReferenceRange("Fasting Blood Sugar (FBS)", "(?i)(?:fasting\\s*(?:blood)?\\s*sugar|fbs|fasting\\s*glucose)", 70.0, 99.0, "mg/dL", "70 - 99 mg/dL", "Glycemic Control"),
            new ReferenceRange("Postprandial Blood Sugar (PPBS)", "(?i)(?:postprandial|post\\s*meal|ppbs|pp\\s*glucose)", 70.0, 140.0, "mg/dL", "< 140 mg/dL", "Glycemic Control"),
            new ReferenceRange("Random Blood Sugar (RBS)", "(?i)(?:random\\s*(?:blood)?\\s*sugar|rbs|random\\s*glucose)", 70.0, 140.0, "mg/dL", "70 - 140 mg/dL", "Glycemic Control"),
            new ReferenceRange("Glycated Hemoglobin (HbA1c)", "(?i)(?:hba1c|glycated\\s*hemoglobin|a1c)", 4.0, 5.6, "%", "4.0 - 5.6% (Normal)", "Glycemic Control"),
            new ReferenceRange("Total Cholesterol", "(?i)(?:total\\s*cholesterol|serum\\s*cholesterol|cholesterol\\s*total)", 100.0, 199.0, "mg/dL", "< 200 mg/dL (Desirable)", "Lipid Panel"),
            new ReferenceRange("Serum Triglycerides", "(?i)(?:triglycerides|serum\\s*triglycerides|tg)", 50.0, 149.0, "mg/dL", "< 150 mg/dL (Normal)", "Lipid Panel"),
            new ReferenceRange("HDL Cholesterol (Good)", "(?i)(?:hdl(?:\\s*cholesterol)?|high\\s*density\\s*lipoprotein)", 40.0, 100.0, "mg/dL", ">= 40 mg/dL (Optimal >= 50)", "Lipid Panel"),
            new ReferenceRange("LDL Cholesterol (Bad)", "(?i)(?:ldl(?:\\s*cholesterol)?|low\\s*density\\s*lipoprotein)", 50.0, 99.0, "mg/dL", "< 100 mg/dL (Optimal)", "Lipid Panel"),
            new ReferenceRange("Serum Creatinine", "(?i)(?:serum\\s*creatinine|creatinine)", 0.6, 1.3, "mg/dL", "0.6 - 1.3 mg/dL", "Renal Function"),
            new ReferenceRange("Blood Urea Nitrogen (BUN)", "(?i)(?:blood\\s*urea\\s*nitrogen|bun|blood\\s*urea)", 7.0, 20.0, "mg/dL", "7 - 20 mg/dL", "Renal Function"),
            new ReferenceRange("Hemoglobin", "(?i)(?:hemoglobin|haemoglobin|hb)", 12.0, 17.5, "g/dL", "12.0 - 17.5 g/dL", "Complete Blood Count"),
            new ReferenceRange("White Blood Cells (WBC)", "(?i)(?:white\\s*blood\\s*cells|wbc|total\\s*leukocyte\\s*count|tlc)", 4000.0, 11000.0, "/mcL", "4,000 - 11,000 /mcL", "Complete Blood Count"),
            new ReferenceRange("Platelet Count", "(?i)(?:platelet(?:\\s*count)?|plt)", 150000.0, 450000.0, "/mcL", "150,000 - 450,000 /mcL", "Complete Blood Count"),
            new ReferenceRange("Systolic Blood Pressure", "(?i)(?:systolic(?:\\s*bp)?|systolic\\s*blood\\s*pressure)", 90.0, 120.0, "mmHg", "90 - 120 mmHg", "Cardiovascular"),
            new ReferenceRange("Diastolic Blood Pressure", "(?i)(?:diastolic(?:\\s*bp)?|diastolic\\s*blood\\s*pressure)", 60.0, 80.0, "mmHg", "60 - 80 mmHg", "Cardiovascular"),
            new ReferenceRange("Serum Potassium", "(?i)(?:serum\\s*potassium|potassium|k\\+)", 3.5, 5.1, "mEq/L", "3.5 - 5.1 mEq/L", "Electrolytes"),
            new ReferenceRange("Serum Sodium", "(?i)(?:serum\\s*sodium|sodium|na\\+)", 135.0, 145.0, "mEq/L", "135 - 145 mEq/L", "Electrolytes"),
            new ReferenceRange("Thyroid Stimulating Hormone (TSH)", "(?i)(?:thyroid\\s*stimulating\\s*hormone|tsh)", 0.4, 4.2, "mIU/L", "0.4 - 4.2 mIU/L", "Endocrine"),
            new ReferenceRange("Uric Acid", "(?i)(?:uric\\s*acid)", 3.0, 7.2, "mg/dL", "3.0 - 7.2 mg/dL", "Metabolic"),
            new ReferenceRange("SGPT / ALT", "(?i)(?:sgpt|alt|alanine\\s*aminotransferase)", 7.0, 56.0, "U/L", "7 - 56 U/L", "Liver Function"),
            new ReferenceRange("SGOT / AST", "(?i)(?:sgot|ast|aspartate\\s*aminotransferase)", 10.0, 40.0, "U/L", "10 - 40 U/L", "Liver Function")
    );

    public MedicalReportAnalysisService(AnalyzedReportRepository reportRepository) {
        this.reportRepository = reportRepository;
        this.objectMapper = new ObjectMapper();
        this.uploadStorageDir = Paths.get("uploads", "medical_reports").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadStorageDir);
        } catch (IOException e) {
            System.err.println("Could not initialize medical reports upload dir: " + e.getMessage());
        }
    }

    /**
     * Process an uploaded report file or raw text input
     */
    public AnalyzedReport analyzeAndSaveReport(
            Long patientId,
            String patientName,
            String reportTitle,
            MultipartFile file,
            String manualTextInput
    ) throws IOException {

        String originalFileName = "manual_entry.txt";
        String fileType = "text/plain";
        long fileSizeBytes = 0;
        String storedFilePath = null;
        String rawExtractedText = "";

        // 1. Process uploaded file if present
        if (file != null && !file.isEmpty()) {
            originalFileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "medical_report";
            fileType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            fileSizeBytes = file.getSize();

            // Store securely to disk
            String safePrefix = "pat_" + (patientId != null ? patientId : "guest") + "_" + System.currentTimeMillis() + "_";
            String savedFilename = safePrefix + UUID.randomUUID().toString().substring(0, 8) + "_" + sanitizeFileName(originalFileName);
            Path targetPath = uploadStorageDir.resolve(savedFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            storedFilePath = targetPath.toString();

            // Extract text from file content
            rawExtractedText = extractTextFromFile(file.getBytes(), originalFileName, fileType);
        }

        // If manual text was also provided or primary, append or use it
        if (manualTextInput != null && !manualTextInput.trim().isEmpty()) {
            if (!rawExtractedText.trim().isEmpty()) {
                rawExtractedText += "\n\n--- Additional Clinical Notes ---\n" + manualTextInput.trim();
            } else {
                rawExtractedText = manualTextInput.trim();
                fileType = "text/plain";
                fileSizeBytes = manualTextInput.getBytes(StandardCharsets.UTF_8).length;
            }
        }

        if (rawExtractedText.trim().isEmpty()) {
            rawExtractedText = "No extractable text found in uploaded document. Please check file format or provide text summary.";
        }

        // 2. Parse lab values against reliable reference ranges
        List<Map<String, Object>> extractedLabValues = extractLabValues(rawExtractedText);
        List<Map<String, Object>> abnormalFindings = new ArrayList<>();

        int highCount = 0;
        int lowCount = 0;

        for (Map<String, Object> lab : extractedLabValues) {
            String status = (String) lab.get("status");
            if ("HIGH".equals(status) || "ELEVATED".equals(status)) {
                abnormalFindings.add(lab);
                highCount++;
            } else if ("LOW".equals(status)) {
                abnormalFindings.add(lab);
                lowCount++;
            }
        }

        // 3. Determine overall status
        String overallRiskLevel;
        if (highCount >= 2 || (highCount >= 1 && lowCount >= 1)) {
            overallRiskLevel = "HIGH_ATTENTION";
        } else if (highCount >= 1 || lowCount >= 1) {
            overallRiskLevel = "ATTENTION_RECOMMENDED";
        } else {
            overallRiskLevel = "NORMAL";
        }

        // 4. Generate structured clinical findings summary (without hallucination)
        String clinicalSummary = generateClinicalSummary(
                reportTitle,
                extractedLabValues,
                abnormalFindings,
                overallRiskLevel
        );

        // 5. Build and persist entity
        AnalyzedReport entity = new AnalyzedReport();
        entity.setPatientId(patientId != null ? patientId : 0L);
        entity.setPatientName(patientName != null && !patientName.isBlank() ? patientName : "Patient #" + patientId);
        entity.setReportTitle(reportTitle != null && !reportTitle.isBlank() ? reportTitle : "Laboratory Report (" + originalFileName + ")");
        entity.setFileName(originalFileName);
        entity.setFileType(fileType);
        entity.setFileSizeBytes(fileSizeBytes);
        entity.setUploadedAt(LocalDateTime.now());
        entity.setRawExtractedText(rawExtractedText);
        entity.setClinicalSummary(clinicalSummary);
        entity.setExtractedLabValuesJson(objectMapper.writeValueAsString(extractedLabValues));
        entity.setAbnormalFindingsJson(objectMapper.writeValueAsString(abnormalFindings));
        entity.setOverallRiskLevel(overallRiskLevel);
        entity.setStoredFilePath(storedFilePath);
        entity.setClinicalDisclaimer(CLINICAL_DISCLAIMER);

        return reportRepository.save(entity);
    }

    /**
     * Retrieve all analyzed reports for a patient
     */
    public List<AnalyzedReport> getReportsByPatientId(Long patientId) {
        if (patientId == null) return Collections.emptyList();
        return reportRepository.findByPatientIdOrderByUploadedAtDesc(patientId);
    }

    /**
     * Retrieve a specific report by id
     */
    public AnalyzedReport getReportById(Long id) {
        return reportRepository.findById(id).orElse(null);
    }

    /**
     * Retrieve stored original file for secure download
     */
    public File getStoredFile(Long id) {
        AnalyzedReport report = getReportById(id);
        if (report == null || report.getStoredFilePath() == null) {
            return null;
        }
        File file = new File(report.getStoredFilePath());
        return file.exists() ? file : null;
    }

    /**
     * Extract laboratory test values by searching for known medical parameters
     */
    private List<Map<String, Object>> extractLabValues(String text) {
        List<Map<String, Object>> results = new ArrayList<>();
        if (text == null || text.isBlank()) return results;

        for (ReferenceRange ref : referenceRanges) {
            // Regex to find parameter name followed by optional delimiters (: , = - is) and a numeric value
            String regex = ref.aliasPattern() + "\\s*[:=–\\-]?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(?:mg/dL|g/dL|mEq/L|mIU/L|%|mmHg|/mcL|U/L)?";
            Pattern pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(text);

            if (matcher.find()) {
                try {
                    double val = Double.parseDouble(matcher.group(1));

                    String status;
                    String interpretation;
                    String badgeClass;

                    if (val > ref.maxNormal()) {
                        status = "HIGH";
                        badgeClass = "danger";
                        interpretation = String.format("Above standard reference threshold (%s). Normal range: %s.", ref.unit(), ref.normalDescription());
                    } else if (val < ref.minNormal()) {
                        status = "LOW";
                        badgeClass = "warning";
                        interpretation = String.format("Below standard reference threshold (%s). Normal range: %s.", ref.unit(), ref.normalDescription());
                    } else {
                        status = "NORMAL";
                        badgeClass = "success";
                        interpretation = String.format("Within standard physiological range (%s).", ref.normalDescription());
                    }

                    Map<String, Object> map = new HashMap<>();
                    map.put("parameter", ref.parameter());
                    map.put("category", ref.category());
                    map.put("value", val);
                    map.put("unit", ref.unit());
                    map.put("referenceRange", ref.normalDescription());
                    map.put("status", status);
                    map.put("badgeClass", badgeClass);
                    map.put("interpretation", interpretation);

                    results.add(map);
                } catch (NumberFormatException ignored) {}
            }
        }

        return results;
    }

    /**
     * Generate an honest, synthesis clinical summary of extracted parameters
     */
    private String generateClinicalSummary(
            String reportTitle,
            List<Map<String, Object>> allValues,
            List<Map<String, Object>> abnormalValues,
            String overallRiskLevel
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("### Automated Clinical Extraction Summary\n");
        sb.append("**Report Focus:** ").append(reportTitle).append("\n\n");

        if (allValues.isEmpty()) {
            sb.append("No standardized diagnostic laboratory parameters with recognized units were matched from the uploaded document text. ")
              .append("The document may contain narrative clinical notes, imaging impressions, or non-standard laboratory format. ")
              .append("Original report text has been preserved below for direct physician review.\n");
            return sb.toString();
        }

        sb.append(String.format("Identified **%d** standardized laboratory parameter(s) from document text.\n\n", allValues.size()));

        if (abnormalValues.isEmpty()) {
            sb.append("✅ **All extracted parameters are within their respective standard reference ranges.**\n")
              .append("- No out-of-range biomarkers detected among matched parameters.\n")
              .append("- Continue recommended routine periodic screenings as advised by your healthcare provider.\n");
        } else {
            sb.append(String.format("⚠️ **%d parameter(s) warrant clinical attention based on established reference ranges:**\n\n", abnormalValues.size()));
            for (Map<String, Object> ab : abnormalValues) {
                sb.append(String.format("- **%s**: `%s %s` (%s) — %s\n",
                        ab.get("parameter"),
                        ab.get("value"),
                        ab.get("unit"),
                        ab.get("status"),
                        ab.get("interpretation")
                ));
            }
            sb.append("\n**Recommended Clinical Action:** Share these specific findings with your treating physician for diagnostic context, clinical correlation, and appropriate follow-up testing.\n");
        }

        return sb.toString();
    }

    /**
     * Extract readable text from common document types (PDF stream extraction, Text, CSV, etc.)
     */
    private String extractTextFromFile(byte[] bytes, String fileName, String contentType) {
        String lowerName = fileName.toLowerCase();

        // 1. Plain text or CSV files
        if (lowerName.endsWith(".txt") || lowerName.endsWith(".csv") || lowerName.endsWith(".json") ||
            (contentType != null && (contentType.contains("text") || contentType.contains("csv")))) {
            return new String(bytes, StandardCharsets.UTF_8);
        }

        // 2. PDF extraction: extract text content streams from PDF byte array
        if (lowerName.endsWith(".pdf") || (contentType != null && contentType.contains("pdf"))) {
            return extractTextFromPdfBytes(bytes);
        }

        // 3. Image file (PNG, JPG, etc.)
        if (lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
            return "Image report uploaded: " + fileName + " (" + (bytes.length / 1024) + " KB).\n" +
                   "Original document image is securely archived. For non-OCR images, please also verify or paste lab numeric values in the manual entry field for automated reference range checking.";
        }

        return new String(bytes, StandardCharsets.ISO_8859_1);
    }

    /**
     * Native PDF stream text parser: extracts literal strings enclosed in () inside text blocks
     */
    private String extractTextFromPdfBytes(byte[] bytes) {
        try {
            String rawPdf = new String(bytes, StandardCharsets.ISO_8859_1);
            StringBuilder extracted = new StringBuilder();

            // Match PDF text strings like (Text here) Tj or [(T) (e) (x) (t)] TJ
            Pattern pattern = Pattern.compile("\\(([^()]*)\\)\\s*(?:Tj|'|\")");
            Matcher matcher = pattern.matcher(rawPdf);

            int matchCount = 0;
            while (matcher.find()) {
                String textSegment = matcher.group(1)
                        .replace("\\(", "(")
                        .replace("\\)", ")")
                        .replace("\\n", "\n")
                        .replace("\\r", "\r")
                        .replace("\\t", " ");
                extracted.append(textSegment).append(" ");
                matchCount++;
            }

            if (matchCount > 5) {
                return extracted.toString();
            }

            // Fallback: search for words in uncompressed streams
            Pattern wordPattern = Pattern.compile("[a-zA-Z0-9.:/%\\-]{2,}");
            Matcher wordMatcher = wordPattern.matcher(rawPdf);
            StringBuilder wordBuf = new StringBuilder();
            int words = 0;
            while (wordMatcher.find() && words < 500) {
                String w = wordMatcher.group(0);
                if (!w.matches("^(?:endobj|xref|trailer|startxref|FlateDecode|Font|Type|Subtype)$")) {
                    wordBuf.append(w).append(" ");
                    words++;
                }
            }
            if (words > 20) {
                return wordBuf.toString();
            }

            return "PDF report (" + bytes.length + " bytes) securely uploaded and preserved. " +
                   "If this is a scanned PDF, please input the key lab numbers in the text notes field.";
        } catch (Exception e) {
            return "Uploaded PDF file preserved. Extraction error: " + e.getMessage();
        }
    }

    private String sanitizeFileName(String input) {
        if (input == null) return "file";
        return input.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}

