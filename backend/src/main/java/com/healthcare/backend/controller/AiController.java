package com.healthcare.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/model-metrics")
    public ResponseEntity<Map<String, Object>> getModelMetrics() {
        return ResponseEntity.ok(aiService.getModelMetrics());
    }

    @PostMapping("/assess")
    public ResponseEntity<String> assessPatient(
            @RequestBody AiAssessmentRequest request) {

        return ResponseEntity.ok(
                aiService.assessPatient(request)
        );
    }
}
