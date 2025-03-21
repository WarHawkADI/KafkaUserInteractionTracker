package com.example.userinteraction.controller;

import com.example.userinteraction.model.UserInteractionDTO;
import com.example.userinteraction.service.KafkaProducerService;
import com.example.userinteraction.service.UserInteractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interactions")
@CrossOrigin(origins = "http://localhost:5500") // Allow frontend access
public class KafkaController {

    private final KafkaProducerService kafkaProducerService;
    private final UserInteractionService interactionService;

    public KafkaController(KafkaProducerService kafkaProducerService, UserInteractionService interactionService) {
        this.kafkaProducerService = kafkaProducerService;
        this.interactionService = interactionService;
    }

    /**
     * API to fetch all stored interactions.
     */
    @GetMapping
    public ResponseEntity<List<UserInteractionDTO>> getAllInteractions() {
        List<UserInteractionDTO> interactions = interactionService.getAllInteractions();
        System.out.println("🔄 Retrieved " + interactions.size() + " interactions.");
        return ResponseEntity.ok(interactions);
    }

    /**
     * API to fetch interactions for a specific user and page.
     */
    @GetMapping("/details")
    public ResponseEntity<List<UserInteractionDTO>> getInteractionsByUserAndPage(
            @RequestParam String user,
            @RequestParam String page
    ) {
        List<UserInteractionDTO> interactions = interactionService.getInteractionsByUserAndPage(user, page);
        System.out.println("🔄 Retrieved " + interactions.size() + " interactions for user " + user + " on page " + page + ".");
        return ResponseEntity.ok(interactions);
    }

    /**
     * API to send interactions from the file at 5-second intervals.
     */
    @PostMapping("/send-from-file")
    public ResponseEntity<String> sendInteractionsWithDelay() {
        kafkaProducerService.sendInteractionsWithDelay();
        return ResponseEntity.ok("✅ Sending interactions to Kafka...");
    }
}