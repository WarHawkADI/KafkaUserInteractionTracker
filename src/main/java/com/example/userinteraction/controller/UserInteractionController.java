package com.example.userinteraction.controller;

import com.example.userinteraction.model.UserInteractionDTO;
import com.example.userinteraction.service.KafkaProducerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/interactions")
public class UserInteractionController {

    private final KafkaProducerService kafkaProducerService;

    public UserInteractionController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendInteraction(@RequestBody UserInteractionDTO interaction) {
        if (interaction.getTimestamp() == null) {
            interaction.setTimestamp(LocalDateTime.now());
        }
        if (interaction.getSessionId() == null) {
            interaction.setSessionId( UUID.randomUUID().toString());
        }
        if (interaction.getUserAgent() == null) {
            interaction.setUserAgent("Unknown");
        }

        kafkaProducerService.sendInteraction(interaction);
        return ResponseEntity.ok("Message sent successfully.......");
    }
}

