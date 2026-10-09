package com.foodrescue.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;

    @Indexed(unique = true)
    private String email;
    private String phone;
    private String role; // DONOR, NGO, VOLUNTEER, ADMIN

    @JsonIgnore
    private String passwordHash;

    private Instant createdAt = Instant.now();

    public User() {}

    public User(String id, String name, String email, String phone, String role, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.email = email != null ? email.trim().toLowerCase() : null;
        this.phone = phone;
        this.role = role;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public User(String id, String name, String email, String phone, String role, String passwordHash, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.email = email != null ? email.trim().toLowerCase() : null;
        this.phone = phone;
        this.role = role;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.trim().toLowerCase() : null;
    }

    @JsonIgnore
    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
