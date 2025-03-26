package com.example.userinteraction.repository;

import com.example.userinteraction.model.UserInteractionDTO;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserInteractionRepository extends ElasticsearchRepository<UserInteractionDTO, String> {
    List<UserInteractionDTO> findByUserName(String userName);
    List<UserInteractionDTO> findByPageName(String pageName);
    List<UserInteractionDTO> findByUserNameAndPageName(String userName, String pageName);

    List< UserInteractionDTO> findByCreatedAtBetween ( LocalDateTime start , LocalDateTime end );
}


