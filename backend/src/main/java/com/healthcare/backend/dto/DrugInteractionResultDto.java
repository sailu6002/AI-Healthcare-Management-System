package com.healthcare.backend.dto;

import java.util.List;

public class DrugInteractionResultDto {

    private String drugA;
    private String drugB;
    private String severity; // MAJOR, MODERATE, MINOR
    private String clinicalMechanism;
    private String recommendedAction;
    private String safetyWarning;

    public DrugInteractionResultDto() {
    }

    public DrugInteractionResultDto(
            String drugA,
            String drugB,
            String severity,
            String clinicalMechanism,
            String recommendedAction,
            String safetyWarning
    ) {
        this.drugA = drugA;
        this.drugB = drugB;
        this.severity = severity;
        this.clinicalMechanism = clinicalMechanism;
        this.recommendedAction = recommendedAction;
        this.safetyWarning = safetyWarning;
    }

    public String getDrugA() {
        return drugA;
    }

    public void setDrugA(String drugA) {
        this.drugA = drugA;
    }

    public String getDrugB() {
        return drugB;
    }

    public void setDrugB(String drugB) {
        this.drugB = drugB;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getClinicalMechanism() {
        return clinicalMechanism;
    }

    public void setClinicalMechanism(String clinicalMechanism) {
        this.clinicalMechanism = clinicalMechanism;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public String getSafetyWarning() {
        return safetyWarning;
    }

    public void setSafetyWarning(String safetyWarning) {
        this.safetyWarning = safetyWarning;
    }
}

