package com.example.userinteraction.controller;

import com.example.userinteraction.model.UserInteractionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketController {
    private static final Logger logger = LoggerFactory.getLogger(WebSocketController.class);

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Only send notification, don't trigger refresh
    public void sendNewDataNotification() {
        try {
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/notifications", "NEW_DATA_AVAILABLE");
            }
        } catch (Exception e) {
            logger.error("Error sending WebSocket notification", e);
        }
    }
}