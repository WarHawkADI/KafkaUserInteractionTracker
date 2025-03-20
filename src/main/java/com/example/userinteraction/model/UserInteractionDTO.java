package com.example.userinteraction.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInteractionDTO {
    private String userId;
    private String userRole;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime timestamp;



    private String pageName;
    private String actionType;
    private String elementId;


    private String elementLabel;
    private String actionDescription;
    private String ipAddress;
    private String deviceInfo;
    private String additionalData;
    private String sessionId;
    private String userAgent;

}
