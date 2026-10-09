package com.foodrescue.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "volunteers")
public class Volunteer {
    @Id
    private String id;
    private String userId;
    private String name;
    private String phone;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private Location location;

    private String availability;
    private String vehicleType;
    private int completedPickups = 0;
    private Instant createdAt = Instant.now();

    public Volunteer() {}

    public Volunteer(String id, String userId, String name, String phone, Location location, String availability, String vehicleType, int completedPickups, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.location = location;
        this.availability = availability;
        this.vehicleType = vehicleType;
        this.completedPickups = completedPickups;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public int getCompletedPickups() {
        return completedPickups;
    }

    public void setCompletedPickups(int completedPickups) {
        this.completedPickups = completedPickups;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
