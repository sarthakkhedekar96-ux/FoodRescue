package com.foodrescue.model;

public class Location {
    private String type = "Point";
    // GeoJSON standard: [longitude, latitude]
    private double[] coordinates;

    public Location() {
        this.type = "Point";
    }

    public Location(String type, double[] coordinates) {
        this.type = type != null ? type : "Point";
        this.coordinates = coordinates;
    }

    public Location(double longitude, double latitude) {
        this.type = "Point";
        this.coordinates = new double[]{longitude, latitude};
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public double[] getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(double[] coordinates) {
        this.coordinates = coordinates;
    }

    public double getLongitude() {
        return (coordinates != null && coordinates.length >= 2) ? coordinates[0] : 0.0;
    }

    public double getLatitude() {
        return (coordinates != null && coordinates.length >= 2) ? coordinates[1] : 0.0;
    }
}
