package com.healthcare.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.model.AppointmentReminder;
import com.healthcare.backend.service.AppointmentReminderService;

@RestController
@RequestMapping("/api/reminders")
public class AppointmentReminderController {

    private final AppointmentReminderService reminderService;

    public AppointmentReminderController(AppointmentReminderService reminderService) {
        this.reminderService = reminderService;
    }

    /**
     * Get all active and delivered reminders for a specific patient
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentReminder>> getRemindersForPatient(@PathVariable Long patientId) {
        List<AppointmentReminder> reminders = reminderService.getRemindersForPatient(patientId);
        return ResponseEntity.ok(reminders);
    }

    /**
     * On-demand trigger to scan active appointments and generate 24h & 1h reminders immediately.
     * Useful for automated testing and interactive live demonstration.
     */
    @PostMapping("/scan-now")
    public ResponseEntity<Map<String, Object>> scanAndGenerateRemindersNow() {
        int generatedCount = reminderService.scanAndGenerateReminders();
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "newRemindersGenerated", generatedCount,
            "message", generatedCount > 0
                ? "Scanned active appointments and generated " + generatedCount + " new reminder(s)."
                : "Reminder scan complete. All upcoming appointments already have notifications or are outside the 24h/1h window."
        ));
    }
}

