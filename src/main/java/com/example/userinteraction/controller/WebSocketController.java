package com.example.userinteraction.controller;

import com.example.userinteraction.model.UserInteractionDTO;
import com.example.userinteraction.service.UserInteractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.List;

@Controller
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserInteractionService interactionService;

    @Autowired
    public WebSocketController(SimpMessagingTemplate messagingTemplate,
                               UserInteractionService interactionService) {
        this.messagingTemplate = messagingTemplate;
        this.interactionService = interactionService;
    }

    /**
     * Broadcasts all interactions to WebSocket clients
     * @param interactions List of UserInteractionDTO to broadcast
     */
    public void sendInteractionUpdates(List<UserInteractionDTO> interactions) {
        messagingTemplate.convertAndSend("/topic/interactions", interactions);
    }
}