package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class KafkaProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    private static final String TOPIC = "user_interactions";

    private final KafkaTemplate<String, UserInteractionDTO> kafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, UserInteractionDTO> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendInteraction(UserInteractionDTO interaction) {
        logger.info("🔄 Sending interaction to Kafka: {}", interaction);

        CompletableFuture<SendResult<String, UserInteractionDTO>> future = kafkaTemplate.send(TOPIC, interaction);

        future.thenAccept(result -> {
            logger.info("✅ Message sent successfully to Kafka. Topic: {}, Partition: {}, Offset: {}",
                    result.getRecordMetadata().topic(),
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
        }).exceptionally(ex -> {
            logger.error("❌ Failed to send message to Kafka", ex);
            return null;
        });
    }
}
