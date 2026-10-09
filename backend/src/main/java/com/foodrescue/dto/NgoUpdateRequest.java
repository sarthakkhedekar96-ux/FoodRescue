package com.foodrescue.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.foodrescue.model.Location;

import java.util.List;

/**
 * Dedicated DTO for updating NGO profiles.
 * Intentionally excludes id, userId, and createdAt to prevent mass-assignment attacks on ownership fields.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class NgoUpdateRequest {

    private String organizationName;
    private String registrationNumber;
    private String contactPerson;
    private String phone;
    private String address;
    private Location location;
    private List<String> acceptedFoodTypes;

    public NgoUpdateRequest() {}

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
}
