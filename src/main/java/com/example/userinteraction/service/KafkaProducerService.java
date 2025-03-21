package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.kafka.core.KafkaTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class KafkaProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    private final KafkaTemplate<String, UserInteractionDTO> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public KafkaProducerService(KafkaTemplate<String, UserInteractionDTO> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Reads JSON file and converts it to a list of UserInteractionDTO objects.
     */
    public List<UserInteractionDTO> readInteractionsFromFile() {
        logger.info("📂 Attempting to read interactions.json...");

        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("interactions.json")) {
            if (inputStream == null) {
                logger.error("❌ interactions.json file not found in resources!");
                throw new RuntimeException("❌ interactions.json file not found!");
            }

            List<UserInteractionDTO> interactions = objectMapper.readValue(inputStream, new TypeReference<>() {});
            logger.info("✅ Successfully read {} interactions from interactions.json", interactions.size());
            return interactions;
        } catch (Exception e) {
            logger.error("❌ Error reading interactions.json", e);
            throw new RuntimeException("Error parsing interactions.json", e);
        }
    }

    /**
     * Sends interactions from the file at 5-second intervals.
     */
    public void sendInteractionsWithDelay() {
        logger.info("📤 Starting to send interactions at 5s intervals...");
        List<UserInteractionDTO> interactions = readInteractionsFromFile();

        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

        for (int i = 0; i < interactions.size(); i++) {
            UserInteractionDTO interaction = interactions.get(i);
            scheduler.schedule(() -> sendInteraction(interaction), i * 5L, TimeUnit.SECONDS);
        }

        scheduler.schedule(() -> {
            logger.info("✅ All interactions have been sent.");
            scheduler.shutdown();
        }, interactions.size() * 5L, TimeUnit.SECONDS);
    }

    /**
     * Sends a single UserInteractionDTO to Kafka.
     */
    public void sendInteraction(UserInteractionDTO interaction) {
        try {
            String key = (interaction.getUserId() != null && !interaction.getUserId().isEmpty()) ? interaction.getUserId() : "guest";

            kafkaTemplate.send(new ProducerRecord<>("user-interactions", key, interaction));
            logger.info("✅ Kafka Message Sent: [User: {} | Page: {} | Action: {}]",
                    interaction.getUserName(), interaction.getPageName(), interaction.getActionType());
        } catch (Exception e) {
            logger.error("❌ Error sending Kafka message for user: {}", interaction.getUserName(), e);
        }
    }
}
