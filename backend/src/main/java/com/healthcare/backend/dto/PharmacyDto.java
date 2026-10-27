package com.healthcare.backend.dto;

import java.util.List;

public class PharmacyDto {

    private String id;
    private String name;
    private String address;
    private String city;
    private String postalCode;
    private double latitude;
    private double longitude;
    private Double distanceKm;
    private String phone;
    private String openingHours;
    private boolean open24Hours;
    private double userRating;
    private List<String> services; // Home Delivery, Prescription Refill, Drive-Thru, Rapid Testing
    private String directionsUrl;
    
    // Inventory confirmation: CONFIRMED_IN_STOCK, OUT_OF_STOCK, CALL_TO_VERIFY
    private String medicineStockStatus;
    private String stockConfirmationNote;

    public PharmacyDto() {
    }

    public PharmacyDto(
            String id,
            String name,
            String address,
            String city,
            String postalCode,
            double latitude,
            double longitude,
            Double distanceKm,
            String phone,
            String openingHours,
            boolean open24Hours,
            double userRating,
            List<String> services,
            String directionsUrl,
            String medicineStockStatus,
            String stockConfirmationNote
    ) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.city = city;
        this.postalCode = postalCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distanceKm = distanceKm;
        this.phone = phone;
        this.openingHours = openingHours;
        this.open24Hours = open24Hours;
        this.userRating = userRating;
        this.services = services;
        this.directionsUrl = directionsUrl;
        this.medicineStockStatus = medicineStockStatus;
        this.stockConfirmationNote = stockConfirmationNote;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getOpeningHours() {
        return openingHours;
    }

    public void setOpeningHours(String openingHours) {
        this.openingHours = openingHours;
    }

    public boolean isOpen24Hours() {
        return open24Hours;
    }

    public void setOpen24Hours(boolean open24Hours) {
        this.open24Hours = open24Hours;
    }

    public double getUserRating() {
        return userRating;
    }

    public void setUserRating(double userRating) {
        this.userRating = userRating;
    }

    public List<String> getServices() {
        return services;
    }

    public void setServices(List<String> services) {
        this.services = services;
    }

    public String getDirectionsUrl() {
        return directionsUrl;
    }

    public void setDirectionsUrl(String directionsUrl) {
        this.directionsUrl = directionsUrl;
    }

    public String getMedicineStockStatus() {
        return medicineStockStatus;
    }

    public void setMedicineStockStatus(String medicineStockStatus) {
        this.medicineStockStatus = medicineStockStatus;
    }

    public String getStockConfirmationNote() {
        return stockConfirmationNote;
    }

    public void setStockConfirmationNote(String stockConfirmationNote) {
        this.stockConfirmationNote = stockConfirmationNote;
    }
}

