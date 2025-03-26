package com.example.userinteraction.config;

import com.example.userinteraction.model.UserInteractionDTO;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;

@Configuration
public class ElasticsearchIndexConfig {

    private final ElasticsearchOperations elasticsearchOperations;

    public ElasticsearchIndexConfig(ElasticsearchOperations elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
    }

    @PostConstruct
    public void resetIndex() {
        // Delete the index for UserInteractionDTO if it exists
        IndexOperations indexOperations = elasticsearchOperations.indexOps( UserInteractionDTO.class);
        if (indexOperations.exists()) {
            indexOperations.delete();
        }
        // Recreate the index
        indexOperations.create();
        indexOperations.putMapping(indexOperations.createMapping());
    }
}