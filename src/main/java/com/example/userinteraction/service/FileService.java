package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Service
public class FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileService.class);
    private final ObjectMapper objectMapper;

    public FileService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public List<UserInteractionDTO> readInteractionsFromFile() {
        try {
            File file = new File("src/main/resources/interactions.json");
            JsonNode rootNode = objectMapper.readTree(file);

            if (rootNode.isArray()) {
                return objectMapper.readValue(file, objectMapper.getTypeFactory().constructCollectionType(List.class, UserInteractionDTO.class));
            } else if (rootNode.isObject()) {
                return List.of(objectMapper.treeToValue(rootNode, UserInteractionDTO.class));
            } else {
                logger.error("Unexpected JSON format: Root element is neither an object nor an array.");
                return List.of();
            }
        } catch (Exception e) {
            logger.error("Error reading interactions from file: {}", e.getMessage(), e);
            return List.of();
        }
    }
}
