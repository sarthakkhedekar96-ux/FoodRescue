package com.foodrescue.dto;

import java.util.List;
import java.util.Map;

public class StatsDto {
    private long totalDonations;
    private double totalFoodQuantity;
    private double averageRating;
    private Map<String, Long> statusDistribution;
    private List<CategoryStat> categoryDistribution;
    private List<DonorStat> topDonors;

    public StatsDto() {}

    public StatsDto(long totalDonations, double totalFoodQuantity, double averageRating, Map<String, Long> statusDistribution, List<CategoryStat> categoryDistribution, List<DonorStat> topDonors) {
        this.totalDonations = totalDonations;
        this.totalFoodQuantity = totalFoodQuantity;
        this.averageRating = averageRating;
        this.statusDistribution = statusDistribution;
        this.categoryDistribution = categoryDistribution;
        this.topDonors = topDonors;
    }

    public long getTotalDonations() {
        return totalDonations;
    }

    public void setTotalDonations(long totalDonations) {
        this.totalDonations = totalDonations;
    }

    public double getTotalFoodQuantity() {
        return totalFoodQuantity;
    }

    public void setTotalFoodQuantity(double totalFoodQuantity) {
        this.totalFoodQuantity = totalFoodQuantity;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public Map<String, Long> getStatusDistribution() {
        return statusDistribution;
    }

    public void setStatusDistribution(Map<String, Long> statusDistribution) {
        this.statusDistribution = statusDistribution;
    }

    public List<CategoryStat> getCategoryDistribution() {
        return categoryDistribution;
    }

    public void setCategoryDistribution(List<CategoryStat> categoryDistribution) {
        this.categoryDistribution = categoryDistribution;
    }

    public List<DonorStat> getTopDonors() {
        return topDonors;
    }

    public void setTopDonors(List<DonorStat> topDonors) {
        this.topDonors = topDonors;
    }
}
