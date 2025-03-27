package com.example.userinteraction.config;

import com.example.userinteraction.model.UserInteractionDTO;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.data.elasticsearch.core.document.Document;

import javax.annotation.PostConstruct;

@Configuration
public class ElasticsearchIndexConfig {

    private final ElasticsearchOperations elasticsearchOperations;

    public ElasticsearchIndexConfig(ElasticsearchOperations elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
    }

    @PostConstruct
    public void initializeIndex() {
        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(UserInteractionDTO.class);

            if (indexOps.exists()) {
                indexOps.delete();
                System.out.println("Deleted existing index");
            }

            indexOps.create();
            Document mapping = indexOps.createMapping(UserInteractionDTO.class);
            indexOps.putMapping(mapping);

            System.out.println("Created new index with mapping: " + mapping.toJson());
        } catch (Exception e) {
            System.err.println("Failed to initialize Elasticsearch index: " + e.getMessage());
        }
    }
}