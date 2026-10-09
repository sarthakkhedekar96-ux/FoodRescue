package com.foodrescue.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.foodrescue.model.FoodItem;
import com.foodrescue.model.Location;
import com.foodrescue.model.StatusHistory;

import java.time.Instant;
import java.util.List;

/**
 * Data Transfer Object for Donations.
 * Exact address, location, donor phone, and donor email are sanitized for unclaimed donations
 * until an NGO claims the pickup (or volunteer assigned, donor themselves, or admin).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DonationResponseDto {

    private String id;
    private String donorId;
    private List<FoodItem> foodItems;
    private String category;
    private Instant preparedAt;
    private Instant expiryAt;
    private Location location;
    private String address;
    private String status;
    private String priority;
    private List<StatusHistory> statusHistory;
    private Instant createdAt;

    // Contact details revealed only after claim or to authorized roles
    private String donorName;
    private String donorEmail;
    private String donorPhone;

    public DonationResponseDto() {}

    public DonationResponseDto(String id, String donorId, List<FoodItem> foodItems, String category,
                               Instant preparedAt, Instant expiryAt, Location location, String address,
                               String status, String priority, List<StatusHistory> statusHistory, Instant createdAt) {
        this(id, donorId, foodItems, category, preparedAt, expiryAt, location, address, status, priority, statusHistory, createdAt, null, null, null);
    }

    public DonationResponseDto(String id, String donorId, List<FoodItem> foodItems, String category,
                               Instant preparedAt, Instant expiryAt, Location location, String address,
                               String status, String priority, List<StatusHistory> statusHistory, Instant createdAt,
                               String donorName, String donorEmail, String donorPhone) {
        this.id = id;
        this.donorId = donorId;
        this.foodItems = foodItems;
        this.category = category;
        this.preparedAt = preparedAt;
        this.expiryAt = expiryAt;
        this.location = location;
        this.address = address;
        this.status = status;
        this.priority = priority;
        this.statusHistory = statusHistory;
        this.createdAt = createdAt;
        this.donorName = donorName;
        this.donorEmail = donorEmail;
        this.donorPhone = donorPhone;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDonorId() { return donorId; }
    public void setDonorId(String donorId) { this.donorId = donorId; }

    public List<FoodItem> getFoodItems() { return foodItems; }
    public void setFoodItems(List<FoodItem> foodItems) { this.foodItems = foodItems; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Instant getPreparedAt() { return preparedAt; }
    public void setPreparedAt(Instant preparedAt) { this.preparedAt = preparedAt; }

    public Instant getExpiryAt() { return expiryAt; }
    public void setExpiryAt(Instant expiryAt) { this.expiryAt = expiryAt; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public List<StatusHistory> getStatusHistory() { return statusHistory; }
    public void setStatusHistory(List<StatusHistory> statusHistory) { this.statusHistory = statusHistory; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getDonorName() { return donorName; }
    public void setDonorName(String donorName) { this.donorName = donorName; }

    public String getDonorEmail() { return donorEmail; }
    public void setDonorEmail(String donorEmail) { this.donorEmail = donorEmail; }

    public String getDonorPhone() { return donorPhone; }
    public void setDonorPhone(String donorPhone) { this.donorPhone = donorPhone; }
}
