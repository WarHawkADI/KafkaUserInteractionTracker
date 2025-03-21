package com.example.userinteraction.runner;

import com.example.userinteraction.service.KafkaProducerService;
import com.example.userinteraction.model.UserInteractionDTO;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class KafkaStartupRunner implements CommandLineRunner {

    private final KafkaProducerService kafkaProducerService;

    public KafkaStartupRunner(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    @Override
    public void run(String... args) {
        // Read interactions from file
        //List<UserInteractionDTO> interactions = kafkaProducerService.readInteractionsFromFile();

        // Send interactions to Kafka
        //kafkaProducerService.sendInteractionsWithDelay();
    }
}
