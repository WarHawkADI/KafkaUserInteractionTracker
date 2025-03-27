package com.example.userinteraction.controller;

import com.example.userinteraction.model.UserInteractionDTO;
import com.example.userinteraction.service.KafkaProducerService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/interactions")
public class UserInteractionController {

    private final KafkaProducerService kafkaProducerService;

    public UserInteractionController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    /**
     * Send **a single user interaction** to Kafka.
     */
    @PostMapping("/send-single")
    public String sendInteraction(@RequestBody UserInteractionDTO interaction) {
        kafkaProducerService.sendInteraction(interaction);
        return "✅ Single interaction sent to Kafka!";
    }
}
