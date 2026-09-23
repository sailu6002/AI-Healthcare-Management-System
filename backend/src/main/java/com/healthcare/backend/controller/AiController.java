package com.healthcare.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.healthcare.backend.dto.AiAssessmentRequest;
import com.healthcare.backend.service.AiService;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/health")
    public ResponseEntity<String> checkAiHealth() {
        return ResponseEntity.ok(aiService.checkHealth());
    }

    @PostMapping("/assess")
    public ResponseEntity<String> assessPatient(
            @RequestBody AiAssessmentRequest request) {

        return ResponseEntity.ok(
                aiService.assessPatient(request)
        );
    }
}