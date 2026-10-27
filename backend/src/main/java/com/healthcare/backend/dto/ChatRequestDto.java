package com.healthcare.backend.dto;

import java.util.List;

public class ChatRequestDto {

    private String message;
    private Long patientId;
    private String patientName;
    private String activeModule;
    private List<ChatMessage> conversationHistory;

    public ChatRequestDto() {
    }

    public static class ChatMessage {
        private String sender; // "user" or "assistant"
        private String text;

        public ChatMessage() {
        }

        public ChatMessage(String sender, String text) {
            this.sender = sender;
            this.text = text;
        }

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public String getActiveModule() {
        return activeModule;
    }

    public void setActiveModule(String activeModule) {
        this.activeModule = activeModule;
    }

    public List<ChatMessage> getConversationHistory() {
        return conversationHistory;
    }

    public void setConversationHistory(List<ChatMessage> conversationHistory) {
        this.conversationHistory = conversationHistory;
    }
}

