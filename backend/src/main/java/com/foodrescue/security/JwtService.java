package com.foodrescue.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${app.jwt.expiration-minutes:60}")
    private long expirationMinutes;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.trim().getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "FATAL: JWT_SECRET environment variable is missing or shorter than 32 bytes (minimum 256 bits required for HMAC-SHA256). Please set JWT_SECRET in your environment with at least 32 characters."
            );
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.trim().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String userId, String email, String role, String name, String ngoId, String volunteerId) {
        long nowMillis = System.currentTimeMillis();
        long expMillis = nowMillis + (expirationMinutes * 60 * 1000L);

        JwtBuilder builder = Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .claim("role", role)
                .claim("name", name != null ? name : "")
                .issuedAt(new Date(nowMillis))
                .expiration(new Date(expMillis))
                .signWith(signingKey);

        if (ngoId != null && !ngoId.isBlank()) {
            builder.claim("ngoId", ngoId);
        }
        if (volunteerId != null && !volunteerId.isBlank()) {
            builder.claim("volunteerId", volunteerId);
        }

        return builder.compact();
    }

    public Claims parseAndValidateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
