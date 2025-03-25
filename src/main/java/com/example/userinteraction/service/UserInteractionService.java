package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import com.example.userinteraction.repository.UserInteractionRepository;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserInteractionService {

    private final UserInteractionRepository interactionRepository;

    public UserInteractionService(UserInteractionRepository interactionRepository) {
        this.interactionRepository = interactionRepository;
    }

    public void storeInteraction(UserInteractionDTO interaction) {
        interactionRepository.save(interaction);
    }

    public List<UserInteractionDTO> getAllInteractions() {
        // Convert Page to List
        Page<UserInteractionDTO> page = interactionRepository.findAll(org.springframework.data.domain.Pageable.unpaged());
        return page.getContent(); // This returns a List
    }

    public List<UserInteractionDTO> getInteractionsByUserAndPage(String user, String page) {
        return interactionRepository.findByUserNameAndPageName(user, page);
    }

    public List<UserInteractionDTO> getInteractionsByDateRange(LocalDateTime start, LocalDateTime end) {
        return interactionRepository.findByCreatedAtBetween(start, end);
    }
}