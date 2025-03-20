package com.example.userinteraction.service;

import com.example.userinteraction.model.UserInteractionDTO;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    @KafkaListener(topics = "user_interactions", groupId = "user-interaction-group", containerFactory = "userKafkaListenerFactory")
    public void consume(UserInteractionDTO userInteraction) {
        System.out.println("Received Message: " + userInteraction);
    }
}
