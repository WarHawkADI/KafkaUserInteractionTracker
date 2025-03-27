package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class KafkaProducerService {
    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    private final KafkaTemplate<String, UserInteractionDTO> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public KafkaProducerService(KafkaTemplate<String, UserInteractionDTO> kafkaTemplate,
                                ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public void sendInteraction(UserInteractionDTO interaction) {
        try {
            if (interaction.getCreatedAt() == null) {
                interaction.setCreatedAt(LocalDateTime.now());
            }

            String key = interaction.getUserId() != null ? interaction.getUserId() : "guest";

            CompletableFuture<SendResult<String, UserInteractionDTO>> future =
                    kafkaTemplate.send("user-interactions", key, interaction);

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    logger.info("Sent interaction - User: {}, Action: {}, Page: {}",
                            interaction.getUserName(),
                            interaction.getActionType(),
                            interaction.getPageName());
                } else {
                    logger.error("Error sending interaction - User: {}",
                            interaction.getUserName(), ex);
                }
            });
        } catch (Exception e) {
            logger.error("Error preparing interaction - User: {}",
                    interaction.getUserName() != null ? interaction.getUserName() : "unknown", e);
        }
    }

    public List<UserInteractionDTO> readInteractionsFromFile() {
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("interactions.json")) {
            if (inputStream == null) {
                throw new RuntimeException("interactions.json file not found!");
            }

            List<UserInteractionDTO> interactions = objectMapper.readValue(inputStream, new TypeReference<>() {});

            interactions.forEach(interaction -> {
                if (interaction.getCreatedAt() == null) {
                    interaction.setCreatedAt(LocalDateTime.now());
                }
            });

            return interactions;
        } catch (Exception e) {
            throw new RuntimeException("Error parsing interactions.json", e);
        }
    }

    public void sendInteractionsWithDelay() {
        List<UserInteractionDTO> interactions = readInteractionsFromFile();
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

        for (int i = 0; i < interactions.size(); i++) {
            UserInteractionDTO interaction = interactions.get(i);
            scheduler.schedule(() -> sendInteraction(interaction), i * 2L, TimeUnit.SECONDS);
        }

        scheduler.schedule(scheduler::shutdown, interactions.size() * 2L, TimeUnit.SECONDS);
    }
}