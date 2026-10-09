package com.foodrescue.service;

import com.foodrescue.model.Pickup;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.repository.VolunteerRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class PickupService {

    private final PickupRepository pickupRepository;
    private final DonationService donationService;
    private final VolunteerRepository volunteerRepository;

    public PickupService(PickupRepository pickupRepository, DonationService donationService, VolunteerRepository volunteerRepository) {
        this.pickupRepository = pickupRepository;
        this.donationService = donationService;
        this.volunteerRepository = volunteerRepository;
    }

    public Pickup createPickup(Pickup pickup) {
        pickup.setStatus("ASSIGNED");
        pickup.setAssignedAt(Instant.now());
        
        donationService.updateStatus(pickup.getDonationId(), "ACCEPTED");
        
        if (pickup.getVolunteerId() != null) {
            volunteerRepository.findById(pickup.getVolunteerId()).ifPresent(v -> {
                v.setAvailability("BUSY");
                volunteerRepository.save(v);
            });
        }
        
        return pickupRepository.save(pickup);
    }

    public List<Pickup> getAllPickups() {
        return pickupRepository.findAll();
    }

    public Optional<Pickup> getPickupById(String id) {
        return pickupRepository.findById(id);
    }

    public List<Pickup> getPickupsByNgo(String ngoId) {
        return pickupRepository.findByNgoId(ngoId);
    }

    public List<Pickup> getPickupsByVolunteer(String volunteerId) {
        return pickupRepository.findByVolunteerId(volunteerId);
    }

    public Pickup updateStatus(String pickupId, String newStatus) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new RuntimeException("Pickup not found: " + pickupId));
        
        pickup.setStatus(newStatus);
        
        if ("PICKED_UP".equalsIgnoreCase(newStatus)) {
            pickup.setPickedUpAt(Instant.now());
            donationService.updateStatus(pickup.getDonationId(), "PICKED_UP");
        } else if ("DELIVERED".equalsIgnoreCase(newStatus)) {
            pickup.setDeliveredAt(Instant.now());
            donationService.updateStatus(pickup.getDonationId(), "COMPLETED");
            
            if (pickup.getVolunteerId() != null) {
                volunteerRepository.findById(pickup.getVolunteerId()).ifPresent(v -> {
                    v.setAvailability("AVAILABLE");
                    v.setCompletedPickups(v.getCompletedPickups() + 1);
                    volunteerRepository.save(v);
                });
            }
        } else if ("CANCELLED".equalsIgnoreCase(newStatus)) {
            donationService.updateStatus(pickup.getDonationId(), "AVAILABLE");
            if (pickup.getVolunteerId() != null) {
                volunteerRepository.findById(pickup.getVolunteerId()).ifPresent(v -> {
                    v.setAvailability("AVAILABLE");
                    volunteerRepository.save(v);
                });
            }
        }
        
        return pickupRepository.save(pickup);
    }

    public Pickup updatePickup(String id, Pickup updated) {
        Pickup existing = pickupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pickup not found: " + id));
        existing.setStatus(updated.getStatus());
        existing.setVolunteerId(updated.getVolunteerId());
        existing.setNgoId(updated.getNgoId());
        if (updated.getPickedUpAt() != null) {
            existing.setPickedUpAt(updated.getPickedUpAt());
        }
        if (updated.getDeliveredAt() != null) {
            existing.setDeliveredAt(updated.getDeliveredAt());
        }
        return pickupRepository.save(existing);
    }

    public void deletePickup(String id) {
        pickupRepository.deleteById(id);
    }
}
