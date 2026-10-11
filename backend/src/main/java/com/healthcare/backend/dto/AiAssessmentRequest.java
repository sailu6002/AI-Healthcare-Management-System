package com.healthcare.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class AiAssessmentRequest {

    private PatientHealthProfile patient;

    public AiAssessmentRequest() {
    }

    public PatientHealthProfile getPatient() {
        return patient;
    }

    public void setPatient(PatientHealthProfile patient) {
        this.patient = patient;
    }

    public static class PatientHealthProfile {

        private int age;
        private String gender;
        private Double height_cm;
        private Double weight_kg;
        private Double bmi;
        private Double systolic_bp;
        private Double diastolic_bp;
        private Double fasting_glucose;
        private Double hba1c;
        private Double cholesterol;
        private Double serum_creatinine;
        private Double blood_urea;
        private Double hemoglobin;
        private Double urine_specific_gravity;
        private Integer urine_albumin;
        private Integer urine_sugar;
        private Integer chest_pain_type;
        private Double max_heart_rate;
        private Boolean exercise_angina;
        private Double st_depression;
        private Integer pregnancies;
        private boolean smoker;
        private boolean hypertension;
        private Boolean has_diabetes;
        private boolean family_history_diabetes;
        private boolean family_history_heart_disease;
        // Defaults to an empty list so it is never serialized as null; the AI
        // service rejects a null list (its schema is list[str], not optional),
        // which used to turn a missing-symptoms assessment into a 502.
        private List<String> symptoms = new ArrayList<>();

        public PatientHealthProfile() {
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }

        public String getGender() {
            return gender;
        }

        public void setGender(String gender) {
            this.gender = gender;
        }

        public Double getHeight_cm() {
            return height_cm;
        }

        public void setHeight_cm(Double height_cm) {
            this.height_cm = height_cm;
        }

        public Double getWeight_kg() {
            return weight_kg;
        }

        public void setWeight_kg(Double weight_kg) {
            this.weight_kg = weight_kg;
        }

        public Double getBmi() {
            return bmi;
        }

        public void setBmi(Double bmi) {
            this.bmi = bmi;
        }

        public Double getSystolic_bp() {
            return systolic_bp;
        }

        public void setSystolic_bp(Double systolic_bp) {
            this.systolic_bp = systolic_bp;
        }

        public Double getDiastolic_bp() {
            return diastolic_bp;
        }

        public void setDiastolic_bp(Double diastolic_bp) {
            this.diastolic_bp = diastolic_bp;
        }

        public Double getFasting_glucose() {
            return fasting_glucose;
        }

        public void setFasting_glucose(Double fasting_glucose) {
            this.fasting_glucose = fasting_glucose;
        }

        public Double getHba1c() {
            return hba1c;
        }

        public void setHba1c(Double hba1c) {
            this.hba1c = hba1c;
        }

        public Double getCholesterol() {
            return cholesterol;
        }

        public void setCholesterol(Double cholesterol) {
            this.cholesterol = cholesterol;
        }

        public Double getSerum_creatinine() {
            return serum_creatinine;
        }

        public void setSerum_creatinine(Double serum_creatinine) {
            this.serum_creatinine = serum_creatinine;
        }

        public Double getBlood_urea() {
            return blood_urea;
        }

        public void setBlood_urea(Double blood_urea) {
            this.blood_urea = blood_urea;
        }

        public Double getHemoglobin() {
            return hemoglobin;
        }

        public void setHemoglobin(Double hemoglobin) {
            this.hemoglobin = hemoglobin;
        }

        public Double getUrine_specific_gravity() {
            return urine_specific_gravity;
        }

        public void setUrine_specific_gravity(Double urine_specific_gravity) {
            this.urine_specific_gravity = urine_specific_gravity;
        }

        public Integer getUrine_albumin() {
            return urine_albumin;
        }

        public void setUrine_albumin(Integer urine_albumin) {
            this.urine_albumin = urine_albumin;
        }

        public Integer getUrine_sugar() {
            return urine_sugar;
        }

        public void setUrine_sugar(Integer urine_sugar) {
            this.urine_sugar = urine_sugar;
        }

        public Integer getChest_pain_type() {
            return chest_pain_type;
        }

        public void setChest_pain_type(Integer chest_pain_type) {
            this.chest_pain_type = chest_pain_type;
        }

        public Double getMax_heart_rate() {
            return max_heart_rate;
        }

        public void setMax_heart_rate(Double max_heart_rate) {
            this.max_heart_rate = max_heart_rate;
        }

        public Boolean getExercise_angina() {
            return exercise_angina;
        }

        public void setExercise_angina(Boolean exercise_angina) {
            this.exercise_angina = exercise_angina;
        }

        public Double getSt_depression() {
            return st_depression;
        }

        public void setSt_depression(Double st_depression) {
            this.st_depression = st_depression;
        }

        public Integer getPregnancies() {
            return pregnancies;
        }

        public void setPregnancies(Integer pregnancies) {
            this.pregnancies = pregnancies;
        }

        public boolean isSmoker() {
            return smoker;
        }

        public void setSmoker(boolean smoker) {
            this.smoker = smoker;
        }

        public boolean isHypertension() {
            return hypertension;
        }

        public void setHypertension(boolean hypertension) {
            this.hypertension = hypertension;
        }

        public Boolean getHas_diabetes() {
            return has_diabetes;
        }

        public void setHas_diabetes(Boolean has_diabetes) {
            this.has_diabetes = has_diabetes;
        }

        public boolean isFamily_history_diabetes() {
            return family_history_diabetes;
        }

        public void setFamily_history_diabetes(boolean family_history_diabetes) {
            this.family_history_diabetes = family_history_diabetes;
        }

        public boolean isFamily_history_heart_disease() {
            return family_history_heart_disease;
        }

        public void setFamily_history_heart_disease(boolean family_history_heart_disease) {
            this.family_history_heart_disease = family_history_heart_disease;
        }

        public List<String> getSymptoms() {
            return symptoms;
        }

        public void setSymptoms(List<String> symptoms) {
            this.symptoms = symptoms;
        }
    }
}
