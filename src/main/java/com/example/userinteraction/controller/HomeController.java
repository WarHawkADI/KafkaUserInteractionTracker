package com.example.userinteraction.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/status")
    public String status() {
        return "User Interaction Service is running!<br>" +
                "Available endpoints:<br>" +
                "- GET /interactions - List all interactions<br>" +
                "- GET /interactions/details?user={user}&page={page} - Filter interactions<br>" +
                "- POST /interactions/send-from-file - Send test data<br>" +
                "- WebSocket: /ws - For real-time updates";
    }
}