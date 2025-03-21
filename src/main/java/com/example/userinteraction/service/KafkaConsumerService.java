package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerService.class);
    private final UserInteractionService interactionService;

    public KafkaConsumerService(UserInteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @KafkaListener(topics = "user-interactions", groupId = "user-group", containerFactory = "userKafkaListenerFactory")
    public void consume(UserInteractionDTO interaction) {
        logger.info("✅ Received Kafka Message: {}", interaction);
        interactionService.storeInteraction(interaction); // Store in memory
    }
}
