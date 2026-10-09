package com.foodrescue.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "donations")
@CompoundIndex(name = "status_expiry_idx", def = "{'status': 1, 'expiryAt': 1}")
public class Donation {
    @Id
    private String id;
    private String donorId;
    private List<FoodItem> foodItems = new ArrayList<>();
    private String category;
    private Instant preparedAt;
    
    @Indexed
    private Instant expiryAt;
    
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private Location location;
    
    private String address;
    
    @Indexed
    private String status;
    
    private String priority;
    private List<StatusHistory> statusHistory = new ArrayList<>();
    private Instant createdAt = Instant.now();

    public Donation() {}

    public Donation(String id, String donorId, List<FoodItem> foodItems, String category, Instant preparedAt, Instant expiryAt, Location location, String address, String status, String priority, List<StatusHistory> statusHistory, Instant createdAt) {
        this.id = id;
        this.donorId = donorId;
        this.foodItems = foodItems != null ? foodItems : new ArrayList<>();
        this.category = category;
        this.preparedAt = preparedAt;
        this.expiryAt = expiryAt;
        this.location = location;
        this.address = address;
        this.status = status;
        this.priority = priority;
        this.statusHistory = statusHistory != null ? statusHistory : new ArrayList<>();
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDonorId() {
        return donorId;
    }

    public void setDonorId(String donorId) {
        this.donorId = donorId;
    }

    public List<FoodItem> getFoodItems() {
        return foodItems;
    }

    public void setFoodItems(List<FoodItem> foodItems) {
        this.foodItems = foodItems;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Instant getPreparedAt() {
        return preparedAt;
    }

    public void setPreparedAt(Instant preparedAt) {
        this.preparedAt = preparedAt;
    }

    public Instant getExpiryAt() {
        return expiryAt;
    }

    public void setExpiryAt(Instant expiryAt) {
        this.expiryAt = expiryAt;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public List<StatusHistory> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<StatusHistory> statusHistory) {
        this.statusHistory = statusHistory;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
