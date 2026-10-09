package com.foodrescue.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.foodrescue.model.Location;

import java.time.Instant;
import java.util.List;

/**
 * Data Transfer Object for NGO profiles to prevent data over-exposure.
 * Sensitive fields (phone, contactPerson, userId, exact location) are exposed only to ADMIN or the owner NGO.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NgoResponseDto {

    private String id;
    private String organizationName;
    private String address;
    private List<String> acceptedFoodTypes;

    // Sensitive / ownership fields - restricted to ADMIN or the NGO itself
    private String contactPerson;
    private String phone;
    private String userId;
    private Location location;
    private Instant createdAt;

    public NgoResponseDto() {}

    public NgoResponseDto(String id, String organizationName, String address, List<String> acceptedFoodTypes) {
        this.id = id;
        this.organizationName = organizationName;
        this.address = address;
        this.acceptedFoodTypes = acceptedFoodTypes;
    }

    public NgoResponseDto(String id, String organizationName, String address, List<String> acceptedFoodTypes,
                          String contactPerson, String phone, String userId, Location location, Instant createdAt) {
        this.id = id;
        this.organizationName = organizationName;
        this.address = address;
        this.acceptedFoodTypes = acceptedFoodTypes;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.userId = userId;
        this.location = location;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public List<String> getAcceptedFoodTypes() { return acceptedFoodTypes; }
    public void setAcceptedFoodTypes(List<String> acceptedFoodTypes) { this.acceptedFoodTypes = acceptedFoodTypes; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
