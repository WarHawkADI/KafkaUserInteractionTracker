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
@Setting(settingPath = "elasticsearch-settings.json")
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserInteractionDTO {
    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String userRole;

    @Field(type = FieldType.Keyword)
    private String userId;

    @Field(type = FieldType.Keyword)
    private String userName;

    @Field(type = FieldType.Keyword)
    private String actionType;

    @Field(type = FieldType.Keyword)
    private String pageName;

    @Field(type = FieldType.Keyword)
    private String elementId;

    @Field(type = FieldType.Keyword)
    private String elementLabel;

    @Field(type = FieldType.Text)
    private String actionDescription;

    @Field(type = FieldType.Keyword)
    private String ipAddress;

    @Field(type = FieldType.Text)
    private String deviceInfo;

    @Field(type = FieldType.Text)
    private String additionalData;

    @Field(type = FieldType.Keyword)
    private String sessionId;

    @Field(type = FieldType.Text)
    private String userAgent;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}