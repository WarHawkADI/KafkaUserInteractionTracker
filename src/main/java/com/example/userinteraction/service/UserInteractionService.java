package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserInteractionService {

    private final List<UserInteractionDTO> interactionStorage = new ArrayList<>();

    public void storeInteraction(UserInteractionDTO interaction) {
        interactionStorage.add(interaction);
    }

    public List<UserInteractionDTO> getAllInteractions() {
        return new ArrayList<>(interactionStorage);
    }
}
