package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserInteractionService {

    private final List<UserInteractionDTO> interactionStorage = new ArrayList<>();

    /**
     * Store a new interaction in memory.
     */
    public void storeInteraction(UserInteractionDTO interaction) {
        interactionStorage.add(interaction);
    }

    /**
     * Get all stored interactions.
     */
    public List<UserInteractionDTO> getAllInteractions() {
        return new ArrayList<>(interactionStorage);
    }

    /**
     * Get interactions for a specific user and page.
     */
    public List<UserInteractionDTO> getInteractionsByUserAndPage(String user, String page) {
        return interactionStorage.stream()
                .filter(interaction -> interaction.getUserName().equals(user) && interaction.getPageName().equals(page))
                .collect(Collectors.toList());
    }
}