package com.example.userinteraction.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch.core.*;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.example.userinteraction.model.UserInteractionDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ElasticsearchService {
    private static final Logger logger = LoggerFactory.getLogger(ElasticsearchService.class);
    private final ElasticsearchClient client;
    private static final String INDEX_NAME = "user_interactions";

    public ElasticsearchService(ElasticsearchClient client) {
        this.client = client;
    }

    public String indexInteraction(UserInteractionDTO interaction) throws IOException {
        if (interaction.getCreatedAt() == null) {
            interaction.setCreatedAt(LocalDateTime.now());
        }

        IndexResponse response = client.index(i -> i
                .index(INDEX_NAME)
                .document(interaction)
        );
        return response.id();
    }

    public List<UserInteractionDTO> getLatestInteractions(int size) {
        try {
            SearchResponse<UserInteractionDTO> response = client.search(s -> s
                            .index(INDEX_NAME)
                            .sort(so -> so.field(f -> f.field("createdAt").order(SortOrder.Desc)))
                            .size(size),
                    UserInteractionDTO.class
            );

            return response.hits().hits().stream()
                    .map(Hit::source)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            logger.error("Error fetching latest interactions", e);
            throw new RuntimeException("Failed to fetch interactions", e);
        }
    }

}