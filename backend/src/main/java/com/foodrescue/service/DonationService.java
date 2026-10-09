package com.foodrescue.service;

import com.foodrescue.model.Donation;
import com.foodrescue.model.StatusHistory;
import com.foodrescue.repository.DonationRepository;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class DonationService {

    private final DonationRepository donationRepository;

    public DonationService(DonationRepository donationRepository) {
        this.donationRepository = donationRepository;
    }

    public Donation createDonation(Donation donation) {
        if (donation.getStatus() == null) {
            donation.setStatus("AVAILABLE");
        }
        
        donation.setPriority(calculatePriority(donation.getExpiryAt()));
        
        if (donation.getStatusHistory() == null || donation.getStatusHistory().isEmpty()) {
            donation.getStatusHistory().add(new StatusHistory(donation.getStatus(), Instant.now()));
        }
        
        return donationRepository.save(donation);
    }

    public List<Donation> getAllDonations() {
        List<Donation> donations = donationRepository.findAll();
        donations.forEach(this::updatePriorityIfNeeded);
        return donations;
    }

    public List<Donation> getAvailableDonations() {
        List<Donation> donations = donationRepository.findByStatus("AVAILABLE");
        donations.forEach(this::updatePriorityIfNeeded);
        return donations;
    }

    public Optional<Donation> getDonationById(String id) {
        return donationRepository.findById(id).map(d -> {
            updatePriorityIfNeeded(d);
            return d;
        });
    }

    public List<Donation> getDonationsByCategory(String category) {
        return donationRepository.findByCategory(category);
    }

    public List<Donation> getDonationsByDonor(String donorId) {
        return donationRepository.findByDonorId(donorId);
    }

    public List<Donation> getExpiringSoonDonations() {
        Instant threeHoursLater = Instant.now().plus(Duration.ofHours(3));
        return donationRepository.findByExpiryAtBeforeAndStatus(threeHoursLater, "AVAILABLE");
    }

    public List<Donation> getNearbyDonations(double longitude, double latitude, double distanceInMeters) {
        Point point = new Point(longitude, latitude);
        Distance distance = new Distance(distanceInMeters / 1000.0, Metrics.KILOMETERS);
        List<Donation> nearby = donationRepository.findByLocationNearAndStatus(point, distance, "AVAILABLE");
        nearby.forEach(this::updatePriorityIfNeeded);
        return nearby;
    }

    public Donation updateStatus(String donationId, String newStatus) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found: " + donationId));
        
        donation.setStatus(newStatus);
        donation.getStatusHistory().add(new StatusHistory(newStatus, Instant.now()));
        updatePriorityIfNeeded(donation);
        
        return donationRepository.save(donation);
    }

    public Donation updateDonation(String id, Donation updated) {
        Donation existing = donationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Donation not found: " + id));
        
        existing.setFoodItems(updated.getFoodItems());
        existing.setCategory(updated.getCategory());
        existing.setPreparedAt(updated.getPreparedAt());
        existing.setExpiryAt(updated.getExpiryAt());
        existing.setLocation(updated.getLocation());
        existing.setAddress(updated.getAddress());
        
        existing.setPriority(calculatePriority(updated.getExpiryAt()));
        return donationRepository.save(existing);
    }

    public void deleteDonation(String id) {
        donationRepository.deleteById(id);
    }

    public String calculatePriority(Instant expiryAt) {
        if (expiryAt == null) return "NORMAL";
        Instant now = Instant.now();
        if (now.isAfter(expiryAt)) {
            return "EXPIRED";
        }
        long minutesLeft = Duration.between(now, expiryAt).toMinutes();
        if (minutesLeft > 180) {
            return "NORMAL";
        } else if (minutesLeft >= 60) {
            return "HIGH";
        } else if (minutesLeft >= 30) {
            return "URGENT";
        } else {
            return "CRITICAL";
        }
    }

    private void updatePriorityIfNeeded(Donation donation) {
        String calculated = calculatePriority(donation.getExpiryAt());
        if (!calculated.equals(donation.getPriority())) {
            donation.setPriority(calculated);
            if ("EXPIRED".equals(calculated) && "AVAILABLE".equals(donation.getStatus())) {
                donation.setStatus("EXPIRED");
                donation.getStatusHistory().add(new StatusHistory("EXPIRED", Instant.now()));
            }
            donationRepository.save(donation);
        }
    }
}
