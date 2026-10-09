package com.foodrescue.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "feedback")
public class Feedback {
    @Id
    private String id;
    private String donationId;
    private String fromUserId;
    private int rating;
    private String comment;
    private Instant createdAt = Instant.now();

    public Feedback() {}

    public Feedback(String id, String donationId, String fromUserId, int rating, String comment, Instant createdAt) {
        this.id = id;
        this.donationId = donationId;
        this.fromUserId = fromUserId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
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

    public String getFromUserId() {
        return fromUserId;
    }

    public void setFromUserId(String fromUserId) {
        this.fromUserId = fromUserId;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
