package com.foodrescue.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.foodrescue.model.Location;

import java.time.Instant;

/**
 * Data Transfer Object for Volunteer profiles to prevent data over-exposure.
 * Sensitive fields (phone, userId, exact location) are never exposed to unauthorized roles.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VolunteerResponseDto {

    private String id;
    private String name;
    private String vehicleType;
    private String availability;
    private Integer completedPickups;

    // Sensitive / ownership fields - restricted to ADMIN or the Volunteer themselves
    private String phone;
    private String userId;
    private Location location;
    private Instant createdAt;

    public VolunteerResponseDto() {}

    public VolunteerResponseDto(String id, String name, String vehicleType, String availability, Integer completedPickups) {
        this.id = id;
        this.name = name;
        this.vehicleType = vehicleType;
        this.availability = availability;
        this.completedPickups = completedPickups;
    }

    public VolunteerResponseDto(String id, String name, String vehicleType, String availability, Integer completedPickups,
                                String phone, String userId, Location location, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.vehicleType = vehicleType;
        this.availability = availability;
        this.completedPickups = completedPickups;
        this.phone = phone;
        this.userId = userId;
        this.location = location;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public Integer getCompletedPickups() { return completedPickups; }
    public void setCompletedPickups(Integer completedPickups) { this.completedPickups = completedPickups; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
