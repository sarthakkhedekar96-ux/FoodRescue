package com.foodrescue.dto;

public class DonorStat {
    private String donorId;
    private String donorName;
    private long donationCount;

    public DonorStat() {}

    public DonorStat(String donorId, String donorName, long donationCount) {
        this.donorId = donorId;
        this.donorName = donorName;
        this.donationCount = donationCount;
    }

    public String getDonorId() {
        return donorId;
    }

    public void setDonorId(String donorId) {
        this.donorId = donorId;
    }

    public String getDonorName() {
        return donorName;
    }

    public void setDonorName(String donorName) {
        this.donorName = donorName;
    }

    public long getDonationCount() {
        return donationCount;
    }

    public void setDonationCount(long donationCount) {
        this.donationCount = donationCount;
    }
}
