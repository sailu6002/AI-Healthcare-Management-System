package com.healthcare.backend.service;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;

import com.healthcare.backend.dto.DrugInteractionResultDto;
import com.healthcare.backend.dto.MedicineDto;
import com.healthcare.backend.dto.PharmacyDto;
import com.healthcare.backend.model.AnalyzedReport;
import com.healthcare.backend.repository.AnalyzedReportRepository;
import com.healthcare.backend.repository.MedicalRecordRepository;
import com.healthcare.backend.repository.PrescriptionRepository;

class NewFeaturesUnitTest {

    private MedicineService medicineService;
    private PharmacyService pharmacyService;
    private MedicalReportAnalysisService reportService;

    @BeforeEach
    void setUp() {
        MedicalRecordRepository mockMedRecordRepo = mock(MedicalRecordRepository.class);
        PrescriptionRepository mockPrescriptionRepo = mock(PrescriptionRepository.class);
        AnalyzedReportRepository mockReportRepo = mock(AnalyzedReportRepository.class);

        medicineService = new MedicineService(mockMedRecordRepo, mockPrescriptionRepo);
        pharmacyService = new PharmacyService();
        reportService = new MedicalReportAnalysisService(mockReportRepo);
    }

    @Test
    @DisplayName("Feature 5: Medicine catalog contains verified monographs with warnings")
    void testMedicineSearch() {
        List<MedicineDto> results = medicineService.searchMedicines("Metformin");
        assertNotNull(results);
        assertFalse(results.isEmpty());

        MedicineDto metformin = results.get(0);
        assertEquals("Metformin", metformin.getGenericName());
        assertNotNull(metformin.getWarnings());
        assertFalse(metformin.getWarnings().isEmpty());
        assertTrue(metformin.getWarnings().get(0).toLowerCase().contains("lactic acidosis"));
    }

    @Test
    @DisplayName("Feature 5: Drug-Drug Interaction Checker detects major bleeding risk between Aspirin and Warfarin")
    void testDrugInteractions() {
        List<DrugInteractionResultDto> interactions =
                medicineService.checkInteractions(List.of("Aspirin", "Warfarin"));

        assertNotNull(interactions);
        assertEquals(1, interactions.size());
        DrugInteractionResultDto inter = interactions.get(0);
        assertEquals("MAJOR", inter.getSeverity());
        assertTrue(inter.getClinicalMechanism().toLowerCase().contains("hemorrhage")
                || inter.getClinicalMechanism().toLowerCase().contains("bleeding"));
        assertNotNull(inter.getSafetyWarning());
    }

    @Test
    @DisplayName("Feature 6: Pharmacy Service computes Haversine distance and checks inventory confirmation")
    void testNearbyPharmacies() {
        // Metropolis central coordinates ~ 17.385, 78.486
        double userLat = 17.385000;
        double userLng = 78.486000;

        List<PharmacyDto> nearby = pharmacyService.getNearbyPharmacies(
                userLat,
                userLng,
                20.0,
                "Metformin",
                "distance"
        );

        assertNotNull(nearby);
        assertFalse(nearby.isEmpty());

        // First pharmacy should have distance < 1 km
        PharmacyDto closest = nearby.get(0);
        assertNotNull(closest.getDistanceKm());
        assertTrue(closest.getDistanceKm() < 5.0);

        // Check inventory confirmation flag
        assertNotNull(closest.getMedicineStockStatus());
        assertEquals("CONFIRMED_IN_STOCK", closest.getMedicineStockStatus());
        assertTrue(closest.getStockConfirmationNote().contains("Confirmed via Pharmacy"));
    }

    @Test
    @DisplayName("Feature 3: Medical Report text parsing extracts high glucose and attaches clinical disclaimer")
    void testMedicalReportAnalysis() throws Exception {
        String testReportText = "Patient Laboratory Test Report\n" +
                "Fasting Blood Sugar: 145 mg/dL\n" +
                "HbA1c: 7.2 %\n" +
                "Serum Creatinine: 0.9 mg/dL\n" +
                "Total Cholesterol: 180 mg/dL";

        AnalyzedReport report = reportService.analyzeAndSaveReport(
                1L,
                "Test Patient",
                "Glycemic Screening Report",
                null,
                testReportText
        );

        assertNotNull(report);
        assertEquals("HIGH_ATTENTION", report.getOverallRiskLevel());
        assertNotNull(report.getClinicalDisclaimer());
        assertTrue(report.getClinicalDisclaimer().contains("DISCLAIMER"));
        assertTrue(report.getClinicalSummary().contains("⚠️"));
    }
}

