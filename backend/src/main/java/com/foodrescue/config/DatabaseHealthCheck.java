package com.foodrescue.config;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DatabaseHealthCheck implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseHealthCheck.class);
    private final MongoTemplate mongoTemplate;

    public DatabaseHealthCheck(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) {
        log.info("------------------------------------------------------------------");
        log.info("[MongoDB Atlas Check] Pinging MongoDB Atlas cluster...");
        try {
            Document pingResult = mongoTemplate.getDb().runCommand(new Document("ping", 1));
            log.info("[MongoDB Atlas Check] Ping response: {}", pingResult.toJson());
            log.info("[MongoDB Atlas Check] Database: '{}'", mongoTemplate.getDb().getName());
            log.info("[MongoDB Atlas Check] >>> MongoDB Atlas connection is SUCCESSFUL! <<<");
        } catch (Exception e) {
            log.error("[MongoDB Atlas Check] >>> MongoDB Atlas connection FAILED! <<<");
            log.error("[MongoDB Atlas Check] Failure reason: {}", e.getMessage());
        }
        log.info("------------------------------------------------------------------");
    }
}
