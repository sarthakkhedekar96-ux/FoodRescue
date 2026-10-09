package com.foodrescue.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.foodrescue.model.Location;

/**
 * Dedicated DTO for updating volunteer profiles.
 * Intentionally excludes id, userId, completedPickups, and createdAt to prevent mass-assignment attacks on ownership fields.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class VolunteerUpdateRequest {

    private String name;
    private String phone;
    private Location location;
    private String availability;
    private String vehicleType;

    public VolunteerUpdateRequest() {}

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

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }
}
