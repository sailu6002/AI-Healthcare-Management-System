package com.healthcare.backend.dto;

import java.util.List;
import java.util.Map;

public class ChatResponseDto {

    private String reply;
    private String intent; // "BOOK_APPOINTMENT", "CHECK_APPOINTMENTS", "REMINDERS", "REPORT_ANALYSIS", "DISEASE_PREDICTION", "MEDICINE_INFO", "NEARBY_PHARMACY", "GENERAL_QUERY"
    private String suggestedModuleAction; // "open_booking", "open_reminders", "open_reports", "open_prediction", "open_medicines", "open_pharmacies", null
    private Map<String, Object> modulePayload;
    private List<String> quickReplies;
    private String safetyNotice;

    public ChatResponseDto() {
    }

    public ChatResponseDto(
            String reply,
            String intent,
            String suggestedModuleAction,
            Map<String, Object> modulePayload,
            List<String> quickReplies,
            String safetyNotice
    ) {
        this.reply = reply;
        this.intent = intent;
        this.suggestedModuleAction = suggestedModuleAction;
        this.modulePayload = modulePayload;
        this.quickReplies = quickReplies;
        this.safetyNotice = safetyNotice;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getSuggestedModuleAction() {
        return suggestedModuleAction;
    }

    public void setSuggestedModuleAction(String suggestedModuleAction) {
        this.suggestedModuleAction = suggestedModuleAction;
    }

    public Map<String, Object> getModulePayload() {
        return modulePayload;
    }

    public void setModulePayload(Map<String, Object> modulePayload) {
        this.modulePayload = modulePayload;
    }

    public List<String> getQuickReplies() {
        return quickReplies;
    }

    public void setQuickReplies(List<String> quickReplies) {
        this.quickReplies = quickReplies;
    }

    public String getSafetyNotice() {
        return safetyNotice;
    }

    public void setSafetyNotice(String safetyNotice) {
        this.safetyNotice = safetyNotice;
    }
}

