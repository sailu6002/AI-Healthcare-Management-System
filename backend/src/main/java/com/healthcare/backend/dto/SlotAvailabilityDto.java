package com.healthcare.backend.dto;

public class SlotAvailabilityDto {

    private String slotTime;
    private String formattedTime;
    private boolean available;
    private boolean recommended;
    private String recommendationReason;

    public SlotAvailabilityDto() {
    }

    public SlotAvailabilityDto(String slotTime, String formattedTime, boolean available, boolean recommended, String recommendationReason) {
        this.slotTime = slotTime;
        this.formattedTime = formattedTime;
        this.available = available;
        this.recommended = recommended;
        this.recommendationReason = recommendationReason;
    }

    public String getSlotTime() {
        return slotTime;
    }

    public void setSlotTime(String slotTime) {
        this.slotTime = slotTime;
    }

    public String getFormattedTime() {
        return formattedTime;
    }

    public void setFormattedTime(String formattedTime) {
        this.formattedTime = formattedTime;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public boolean isRecommended() {
        return recommended;
    }

    public void setRecommended(boolean recommended) {
        this.recommended = recommended;
    }

    public String getRecommendationReason() {
        return recommendationReason;
    }

    public void setRecommendationReason(String recommendationReason) {
        this.recommendationReason = recommendationReason;
    }
}

