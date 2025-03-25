package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import com.example.userinteraction.controller.WebSocketController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class KafkaConsumerService {

    private static final Logger logger = LoggerFactory.getLogger ( KafkaConsumerService.class );
    private final UserInteractionService interactionService;
    private final WebSocketController webSocketController;

    public KafkaConsumerService (
            UserInteractionService interactionService ,
            WebSocketController webSocketController
    ) {
        this.interactionService = interactionService;
        this.webSocketController = webSocketController;
    }

    @KafkaListener(
            topics = "user-interactions",
            groupId = "user-group",
            containerFactory = "userKafkaListenerFactory"
    )
    public void consume ( UserInteractionDTO interaction ) {
        try {
            logger.info ( "Processing interaction from user: {}" , interaction.getUserName ( ) );

            // 1. Store the interaction
            interactionService.storeInteraction ( interaction );

            // 2. Get updated interactions
            List < UserInteractionDTO > allInteractions = interactionService.getAllInteractions ( );

            // 3. Broadcast via WebSocket
            webSocketController.sendInteractionUpdates ( allInteractions );

            logger.debug ( "Successfully processed interaction from {}" , interaction.getUserName ( ) );
        } catch (Exception e) {
            logger.error ( "Failed to process interaction: {}" , e.getMessage ( ) , e );
        }
    }
}