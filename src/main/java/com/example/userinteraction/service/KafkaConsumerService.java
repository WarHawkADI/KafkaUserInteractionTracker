package com.example.userinteraction.service;

import com.example.userinteraction.controller.WebSocketController;
import com.example.userinteraction.model.UserInteractionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class KafkaConsumerService {
    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerService.class);

    private final ElasticsearchService elasticsearchService;
    private final WebSocketController webSocketController;

    public KafkaConsumerService(
            ElasticsearchService elasticsearchService,
            WebSocketController webSocketController) {
        this.elasticsearchService = elasticsearchService;
        this.webSocketController = webSocketController;
    }

    @KafkaListener(
            topics = "user-interactions",
            groupId = "user-group",
            containerFactory = "userKafkaListenerFactory"
    )
    public void consume(
            @Payload UserInteractionDTO interaction,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) Integer partition,
            @Header(KafkaHeaders.OFFSET) Long offset) {

        try {
            logger.info("Received message - Topic: {}, Partition: {}, Offset: {}, User: {}",
                    topic, partition, offset, interaction.getUserName());

            // Ensure timestamp is set
            if (interaction.getCreatedAt() == null) {
                interaction.setCreatedAt(LocalDateTime.now());
            }

            // Save to Elasticsearch
            String docId = elasticsearchService.indexInteraction(interaction);
            logger.info("Indexed interaction with ID: {}", docId);

            // Send notification only (no auto-refresh)
            webSocketController.sendNewDataNotification();

        } catch (Exception e) {
            logger.error("Failed to process interaction - Topic: {}, Partition: {}, Offset: {}",
                    topic, partition, offset, e);
        }
    }
}