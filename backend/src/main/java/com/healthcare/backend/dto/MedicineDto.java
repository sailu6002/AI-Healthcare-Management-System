package com.healthcare.backend.dto;

import java.util.List;

public class MedicineDto {

    private String id;
    private String name;
    private String genericName;
    private List<String> brandNames;
    private String therapeuticClass;
    private List<String> approvedUses;
    private List<String> warnings;
    private List<String> contraindications;
    private List<String> commonSideEffects;
    private String storageGuidelines;
    private String foodAndAlcoholWarning;
    private String verifiedSourceCitation;

    public MedicineDto() {
    }

    public MedicineDto(
            String id,
            String name,
            String genericName,
            List<String> brandNames,
            String therapeuticClass,
            List<String> approvedUses,
            List<String> warnings,
            List<String> contraindications,
            List<String> commonSideEffects,
            String storageGuidelines,
            String foodAndAlcoholWarning,
            String verifiedSourceCitation
    ) {
        this.id = id;
        this.name = name;
        this.genericName = genericName;
        this.brandNames = brandNames;
        this.therapeuticClass = therapeuticClass;
        this.approvedUses = approvedUses;
        this.warnings = warnings;
        this.contraindications = contraindications;
        this.commonSideEffects = commonSideEffects;
        this.storageGuidelines = storageGuidelines;
        this.foodAndAlcoholWarning = foodAndAlcoholWarning;
        this.verifiedSourceCitation = verifiedSourceCitation;
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

    public String getGenericName() {
        return genericName;
    }

    public void setGenericName(String genericName) {
        this.genericName = genericName;
    }

    public List<String> getBrandNames() {
        return brandNames;
    }

    public void setBrandNames(List<String> brandNames) {
        this.brandNames = brandNames;
    }

    public String getTherapeuticClass() {
        return therapeuticClass;
    }

    public void setTherapeuticClass(String therapeuticClass) {
        this.therapeuticClass = therapeuticClass;
    }

    public List<String> getApprovedUses() {
        return approvedUses;
    }

    public void setApprovedUses(List<String> approvedUses) {
        this.approvedUses = approvedUses;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public List<String> getContraindications() {
        return contraindications;
    }

    public void setContraindications(List<String> contraindications) {
        this.contraindications = contraindications;
    }

    public List<String> getCommonSideEffects() {
        return commonSideEffects;
    }

    public void setCommonSideEffects(List<String> commonSideEffects) {
        this.commonSideEffects = commonSideEffects;
    }

    public String getStorageGuidelines() {
        return storageGuidelines;
    }

    public void setStorageGuidelines(String storageGuidelines) {
        this.storageGuidelines = storageGuidelines;
    }

    public String getFoodAndAlcoholWarning() {
        return foodAndAlcoholWarning;
    }

    public void setFoodAndAlcoholWarning(String foodAndAlcoholWarning) {
        this.foodAndAlcoholWarning = foodAndAlcoholWarning;
    }

    public String getVerifiedSourceCitation() {
        return verifiedSourceCitation;
    }

    public void setVerifiedSourceCitation(String verifiedSourceCitation) {
        this.verifiedSourceCitation = verifiedSourceCitation;
    }
}

