package com.foodrescue.controller;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class DatabaseHealthController {

    private final MongoTemplate mongoTemplate;

    public DatabaseHealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping({"/health/db", "/api/health/db"})
    public ResponseEntity<Map<String, String>> getDatabaseHealth() {
        Map<String, String> body = new LinkedHashMap<>();
        try {
            mongoTemplate.getDb().runCommand(new Document("ping", 1));
            body.put("status", "UP");
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            body.put("status", "DOWN");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
        }
    }
}
