package com.example.userinteraction.dao;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.RangeQuery;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.json.JsonData;
import com.example.userinteraction.model.UserInteractionDTO;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class ElasticsearchDAO {

    private final ElasticsearchClient elasticsearchClient;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ElasticsearchDAO(ElasticsearchClient elasticsearchClient) {
        this.elasticsearchClient = elasticsearchClient;
    }

    public List<UserInteractionDTO> findByDateRange(LocalDateTime startDate, LocalDateTime endDate) throws IOException {
        // Build the range query
        Query rangeQuery = RangeQuery.of(r -> r
                .field("createdAt")
                .gte( JsonData.fromJson ( startDate.format(FORMATTER) ) )
                .lte( JsonData.fromJson ( endDate.format(FORMATTER) ) )
        )._toQuery();

        // Execute the search
        SearchResponse<UserInteractionDTO> response = elasticsearchClient.search(s -> s
                        .index("user_interactions")
                        .query(q -> q
                                .bool(b -> b
                                        .must(rangeQuery)
                                )
                        )
                        .sort(so -> so
                                .field(f -> f
                                        .field("createdAt")
                                        .order(SortOrder.Desc)
                                )
                        ),
                UserInteractionDTO.class
        );

        // Process and return results
        return response.hits().hits().stream()
                .map(Hit::source)
                .collect(Collectors.toList());
    }

    public void save(UserInteractionDTO interaction) throws IOException {
        elasticsearchClient.index(i -> i
                .index("user_interactions")
                .document(interaction)
        );
    }

    // Add this method to ElasticsearchDAO class
    public List<UserInteractionDTO> findAll() throws IOException {
        SearchResponse<UserInteractionDTO> response = elasticsearchClient.search(s -> s
                        .index("user_interactions")
                        .query(q -> q.matchAll(m -> m))
                        .sort(so -> so
                                .field(f -> f
                                        .field("createdAt")
                                        .order(SortOrder.Desc)
                                )
                        ),
                UserInteractionDTO.class
        );

        return response.hits().hits().stream()
                .map(Hit::source)
                .collect(Collectors.toList());
    }

    // Additional methods can be added for update, delete, etc.
}