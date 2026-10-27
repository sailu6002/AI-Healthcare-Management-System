package com.healthcare.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.healthcare.backend.dto.ChatRequestDto;
import com.healthcare.backend.dto.ChatResponseDto;
import com.healthcare.backend.service.ChatbotService;

/**
 * REST controller for the conversational AI Healthcare Assistant.
 * Routes patient prompts, intent classification, and clinical safety guidance.
 */
@RestController
@RequestMapping("/api/ai/chat")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDto> processChat(@RequestBody ChatRequestDto request) {
        return ResponseEntity.ok(chatbotService.processMessage(request));
    }
}

