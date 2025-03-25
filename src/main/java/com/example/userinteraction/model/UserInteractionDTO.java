package com.example.userinteraction.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(indexName = "user_interactions")
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserInteractionDTO {
    @Id
    private String id;
    private String userRole;
    private String userId;
    private String userName;
    private String actionType;
    private String pageName;
    private String elementId;
    private String elementLabel;
    private String actionDescription;
    private String ipAddress;
    private String deviceInfo;
    private String additionalData;
    private String sessionId;
    private String userAgent;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}