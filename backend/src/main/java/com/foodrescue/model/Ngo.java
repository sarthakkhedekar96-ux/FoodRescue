package com.foodrescue.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "ngos")
public class Ngo {
    @Id
    private String id;
    private String userId;
    private String organizationName;
    private String registrationNumber;
    private String contactPerson;
    private String phone;
    private String address;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private Location location;

    private List<String> acceptedFoodTypes = new ArrayList<>();
    private Instant createdAt = Instant.now();

    public Ngo() {}

    public Ngo(String id, String userId, String organizationName, String registrationNumber, String contactPerson, String phone, String address, Location location, List<String> acceptedFoodTypes, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.organizationName = organizationName;
        this.registrationNumber = registrationNumber;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.address = address;
        this.location = location;
        this.acceptedFoodTypes = acceptedFoodTypes != null ? acceptedFoodTypes : new ArrayList<>();
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

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Location getLocation() {
        return location;
    }

    public void setLocation(Location location) {
        this.location = location;
    }

    public List<String> getAcceptedFoodTypes() {
        return acceptedFoodTypes;
    }

    public void setAcceptedFoodTypes(List<String> acceptedFoodTypes) {
        this.acceptedFoodTypes = acceptedFoodTypes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
