package com.example.userinteraction.controller;

import com.example.userinteraction.model.UserInteractionDTO;
import com.example.userinteraction.service.UserInteractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.stream.Collectors;

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

    public void sendInteractionUpdates(List<UserInteractionDTO> interactions) {
        // Ensure consistent data format before sending
        List<UserInteractionDTO> sanitizedInteractions = interactions.stream()
                .map(this::sanitizeInteraction)
                .collect(Collectors.toList());

        messagingTemplate.convertAndSend("/topic/interactions", sanitizedInteractions);
    }

    private UserInteractionDTO sanitizeInteraction(UserInteractionDTO interaction) {
        if (interaction.getUserName() == null) interaction.setUserName("Unknown");
        if (interaction.getUserRole() == null) interaction.setUserRole("Unknown");
        if (interaction.getActionType() == null) interaction.setActionType("Unknown");
        if (interaction.getPageName() == null) interaction.setPageName("Unknown");
        return interaction;
    }
}