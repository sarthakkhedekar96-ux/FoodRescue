package com.foodrescue.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "pickups")
public class Pickup {
    @Id
    private String id;
    private String donationId;
    private String ngoId;
    private String volunteerId;
    private String status;
    private Instant assignedAt = Instant.now();
    private Instant pickedUpAt;
    private Instant deliveredAt;

    public Pickup() {}

    public Pickup(String id, String donationId, String ngoId, String volunteerId, String status, Instant assignedAt, Instant pickedUpAt, Instant deliveredAt) {
        this.id = id;
        this.donationId = donationId;
        this.ngoId = ngoId;
        this.volunteerId = volunteerId;
        this.status = status;
        this.assignedAt = assignedAt != null ? assignedAt : Instant.now();
        this.pickedUpAt = pickedUpAt;
        this.deliveredAt = deliveredAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDonationId() {
        return donationId;
    }

    public void setDonationId(String donationId) {
        this.donationId = donationId;
    }

    public String getNgoId() {
        return ngoId;
    }

    public void setNgoId(String ngoId) {
        this.ngoId = ngoId;
    }

    public String getVolunteerId() {
        return volunteerId;
    }

    public void setVolunteerId(String volunteerId) {
        this.volunteerId = volunteerId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Instant assignedAt) {
        this.assignedAt = assignedAt;
    }

    public Instant getPickedUpAt() {
        return pickedUpAt;
    }

    public void setPickedUpAt(Instant pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(Instant deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
}
