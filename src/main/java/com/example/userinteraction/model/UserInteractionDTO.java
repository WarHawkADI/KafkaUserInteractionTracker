package com.example.userinteraction.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserInteractionDTO {
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

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp = LocalDateTime.now();
}
