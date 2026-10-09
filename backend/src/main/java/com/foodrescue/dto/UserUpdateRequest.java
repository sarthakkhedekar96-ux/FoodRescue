package com.foodrescue.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Dedicated DTO for updating user profiles.
 * Intentionally excludes role, passwordHash, id, and email to prevent mass-assignment attacks.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserUpdateRequest {

    private String name;
    private String phone;

    public UserUpdateRequest() {}

    public UserUpdateRequest(String name, String phone) {
        this.name = name;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
