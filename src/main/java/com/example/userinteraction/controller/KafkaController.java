package com.example.userinteraction.controller;

import com.example.userinteraction.service.KafkaProducerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interactions")
public class KafkaController {

    private final KafkaProducerService kafkaProducerService;

    public KafkaController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    /**
     * API to send interactions from the file at 5-second intervals.
     * 👉 Will ONLY run when the user clicks a button or calls the endpoint.
     */
    @PostMapping("/send-from-file")
    public ResponseEntity<String> sendInteractionsWithDelay() {
        kafkaProducerService.sendInteractionsWithDelay(); // ✅ Trigger only on request
        return ResponseEntity.ok("✅ Sending interactions to Kafka at 5-second intervals...");
    }
}
