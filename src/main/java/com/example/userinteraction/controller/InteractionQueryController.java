package com.example.userinteraction.controller;

import com.example.userinteraction.model.UserInteractionDTO;
import com.example.userinteraction.service.UserInteractionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/interactions")
@CrossOrigin(origins = "http://localhost:5500")
public class InteractionQueryController {

    private final UserInteractionService interactionService;

    public InteractionQueryController(UserInteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @GetMapping("/by-date-range")
    public ResponseEntity<List<UserInteractionDTO>> getInteractionsByDateRange(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime start,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime end) {

        List<UserInteractionDTO> interactions = interactionService.getInteractionsByDateRange(start, end);
        return ResponseEntity.ok(interactions);
    }
}