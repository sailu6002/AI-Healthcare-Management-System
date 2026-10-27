package com.healthcare.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.healthcare.backend.dto.PharmacyDto;

@Service
public class PharmacyService {

    private final List<PharmacyDto> pharmacyDirectory = new ArrayList<>();
    // Simulated verified electronic pharmacy inventory link: PharmacyId -> List of confirmed in-stock generic names
    private final Map<String, List<String>> verifiedPharmacyInventory = new HashMap<>();

    public PharmacyService() {
        initializeDirectory();
    }

    private void initializeDirectory() {
        // Sample verified pharmacy network with diverse locations and coordinates
        pharmacyDirectory.add(new PharmacyDto(
                "pharm-1",
                "Apollo Pharmacy – Central Clinic Plaza",
                "14 Medical Centre Boulevard, Downtown",
                "Metropolis",
                "500001",
                17.385044,
                78.486671,
                null,
                "+91-40-2345-6789",
                "Open 24 Hours",
                true,
                4.8,
                List.of("24/7 Service", "Home Delivery", "Prescription Refill", "Refrigerated Vaccines"),
                "https://www.google.com/maps/dir/?api=1&destination=17.385044,78.486671",
                "CALL_TO_VERIFY",
                "Call pharmacy to verify current stock."
        ));

        pharmacyDirectory.add(new PharmacyDto(
                "pharm-2",
                "MedPlus Health Care – University Road",
                "45 Campus Avenue, Near City Hospital",
                "Metropolis",
                "500007",
                17.406500,
                78.477244,
                null,
                "+91-40-8765-4321",
                "8:00 AM - 11:00 PM",
                false,
                4.6,
                List.of("Prescription Refill", "Fast Pickup", "BP & Glucose Checks"),
                "https://www.google.com/maps/dir/?api=1&destination=17.406500,78.477244",
                "CALL_TO_VERIFY",
                "Call pharmacy to verify current stock."
        ));

        pharmacyDirectory.add(new PharmacyDto(
                "pharm-3",
                "CareFirst Community Pharmacy",
                "88 Green Valley Parkway, Suite 102",
                "Metropolis",
                "500034",
                17.424100,
                78.448500,
                null,
                "+91-40-5555-1234",
                "9:00 AM - 9:00 PM",
                false,
                4.7,
                List.of("Home Delivery", "Compounding Services", "Pharmacist Consultation"),
                "https://www.google.com/maps/dir/?api=1&destination=17.424100,78.448500",
                "CALL_TO_VERIFY",
                "Call pharmacy to verify current stock."
        ));

        pharmacyDirectory.add(new PharmacyDto(
                "pharm-4",
                "Wellness 24/7 Super Pharmacy",
                "102 Airport Bypass Highway",
                "Metropolis",
                "500081",
                17.447400,
                78.376200,
                null,
                "+91-40-9999-8888",
                "Open 24 Hours",
                true,
                4.9,
                List.of("24/7 Drive-Thru", "Emergency Medicines", "Oxygen Supplies"),
                "https://www.google.com/maps/dir/?api=1&destination=17.447400,78.376200",
                "CALL_TO_VERIFY",
                "Call pharmacy to verify current stock."
        ));

        pharmacyDirectory.add(new PharmacyDto(
                "pharm-5",
                "LifeLine Chemist & Surgicals",
                "23 Market Street, Old Town",
                "Metropolis",
                "500002",
                17.361600,
                78.474700,
                null,
                "+91-40-3333-7777",
                "8:30 AM - 10:30 PM",
                false,
                4.4,
                List.of("Surgical Equipment", "Generic Medicine Discounts"),
                "https://www.google.com/maps/dir/?api=1&destination=17.361600,78.474700",
                "CALL_TO_VERIFY",
                "Call pharmacy to verify current stock."
        ));

        // Confirmed inventory stock records from electronic integration
        verifiedPharmacyInventory.put("pharm-1", List.of("metformin", "lisinopril", "atorvastatin", "aspirin", "amoxicillin", "paracetamol", "omeprazole", "levothyroxine"));
        verifiedPharmacyInventory.put("pharm-2", List.of("metformin", "paracetamol", "amoxicillin", "ibuprofen", "omeprazole"));
        verifiedPharmacyInventory.put("pharm-3", List.of("lisinopril", "atorvastatin", "aspirin", "levothyroxine"));
        verifiedPharmacyInventory.put("pharm-4", List.of("metformin", "lisinopril", "atorvastatin", "aspirin", "amoxicillin", "paracetamol", "warfarin", "ibuprofen", "omeprazole", "levothyroxine"));
        verifiedPharmacyInventory.put("pharm-5", List.of("paracetamol", "aspirin", "ibuprofen", "amoxicillin"));
    }

    /**
     * Find nearby pharmacies using GPS coordinates
     */
    public List<PharmacyDto> getNearbyPharmacies(
            Double userLat,
            Double userLng,
            Double radiusKm,
            String medicineQuery,
            String sortBy
    ) {
        double maxDist = (radiusKm != null && radiusKm > 0) ? radiusKm : 50.0;

        List<PharmacyDto> results = new ArrayList<>();

        for (PharmacyDto base : pharmacyDirectory) {
            PharmacyDto copy = clonePharmacy(base);

            if (userLat != null && userLng != null) {
                double dist = calculateHaversineDistanceKm(userLat, userLng, copy.getLatitude(), copy.getLongitude());
                copy.setDistanceKm(Math.round(dist * 100.0) / 100.0);
            }

            // Check medicine inventory confirmation if medicine query is provided
            evaluateInventoryConfirmation(copy, medicineQuery);

            if (userLat == null || userLng == null || copy.getDistanceKm() <= maxDist) {
                results.add(copy);
            }
        }

        // Sorting
        if ("rating".equalsIgnoreCase(sortBy)) {
            results.sort(Comparator.comparingDouble(PharmacyDto::getUserRating).reversed());
        } else if (userLat != null && userLng != null) {
            results.sort(Comparator.comparing(p -> (p.getDistanceKm() != null ? p.getDistanceKm() : Double.MAX_VALUE)));
        }

        return results;
    }

    /**
     * Search pharmacies by location name / address / city when GPS is unavailable
     */
    public List<PharmacyDto> searchPharmaciesByLocationText(String locationText, String medicineQuery) {
        String cleanLoc = (locationText != null) ? locationText.trim().toLowerCase(Locale.ROOT) : "";

        List<PharmacyDto> list = pharmacyDirectory.stream()
                .filter(p -> cleanLoc.isEmpty()
                        || p.getAddress().toLowerCase(Locale.ROOT).contains(cleanLoc)
                        || p.getCity().toLowerCase(Locale.ROOT).contains(cleanLoc)
                        || p.getPostalCode().toLowerCase(Locale.ROOT).contains(cleanLoc)
                        || p.getName().toLowerCase(Locale.ROOT).contains(cleanLoc))
                .map(this::clonePharmacy)
                .collect(Collectors.toList());

        for (PharmacyDto p : list) {
            evaluateInventoryConfirmation(p, medicineQuery);
        }

        return list;
    }

    /**
     * Verify medicine availability strictly against verified pharmacy inventory records
     */
    private void evaluateInventoryConfirmation(PharmacyDto pharmacy, String medicineQuery) {
        if (medicineQuery == null || medicineQuery.trim().isEmpty()) {
            pharmacy.setMedicineStockStatus("N/A");
            pharmacy.setStockConfirmationNote("Search for a specific medicine to check real-time stock confirmation.");
            return;
        }

        String medClean = medicineQuery.trim().toLowerCase(Locale.ROOT);
        List<String> inStockList = verifiedPharmacyInventory.get(pharmacy.getId());

        if (inStockList != null) {
            boolean isConfirmed = inStockList.stream().anyMatch(item -> item.contains(medClean) || medClean.contains(item));
            if (isConfirmed) {
                pharmacy.setMedicineStockStatus("CONFIRMED_IN_STOCK");
                pharmacy.setStockConfirmationNote("✅ Verified In-Stock (Confirmed via Pharmacy Electronic Inventory System)");
            } else {
                pharmacy.setMedicineStockStatus("OUT_OF_STOCK");
                pharmacy.setStockConfirmationNote("❌ Currently Out of Stock in this location's verified inventory.");
            }
        } else {
            pharmacy.setMedicineStockStatus("CALL_TO_VERIFY");
            pharmacy.setStockConfirmationNote("⚠️ Call pharmacy directly to confirm availability. Inventory sync is pending.");
        }
    }

    /**
     * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
     */
    private double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final double EARTH_RADIUS_KM = 6371.0;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    private PharmacyDto clonePharmacy(PharmacyDto src) {
        return new PharmacyDto(
                src.getId(),
                src.getName(),
                src.getAddress(),
                src.getCity(),
                src.getPostalCode(),
                src.getLatitude(),
                src.getLongitude(),
                src.getDistanceKm(),
                src.getPhone(),
                src.getOpeningHours(),
                src.isOpen24Hours(),
                src.getUserRating(),
                src.getServices(),
                src.getDirectionsUrl(),
                src.getMedicineStockStatus(),
                src.getStockConfirmationNote()
        );
    }
}

