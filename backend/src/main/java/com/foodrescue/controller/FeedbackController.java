package com.foodrescue.controller;

import com.foodrescue.model.Donation;
import com.foodrescue.model.Feedback;
import com.foodrescue.model.Pickup;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.FeedbackRepository;
import com.foodrescue.repository.NgoRepository;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.repository.VolunteerRepository;
import com.foodrescue.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final DonationRepository donationRepository;
    private final PickupRepository pickupRepository;
    private final NgoRepository ngoRepository;
    private final VolunteerRepository volunteerRepository;

    public FeedbackController(FeedbackRepository feedbackRepository,
                              DonationRepository donationRepository,
                              PickupRepository pickupRepository,
                              NgoRepository ngoRepository,
                              VolunteerRepository volunteerRepository) {
        this.feedbackRepository = feedbackRepository;
        this.donationRepository = donationRepository;
        this.pickupRepository = pickupRepository;
        this.ngoRepository = ngoRepository;
        this.volunteerRepository = volunteerRepository;
    }

    @PostMapping
    public ResponseEntity<Feedback> createFeedback(@RequestBody Feedback feedback) {
        if (feedback.getRating() < 1 || feedback.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }

        if (!SecurityUtils.isAdmin()) {
            feedback.setFromUserId(SecurityUtils.getCurrentUserId());

            if (SecurityUtils.isVolunteer()) {
                String volId = volunteerRepository.findByUserId(SecurityUtils.getCurrentUserId())
                        .map(v -> v.getId()).orElse(SecurityUtils.getCurrentUser().getVolunteerId());
                Pickup pickup = pickupRepository.findByDonationId(feedback.getDonationId()).orElse(null);
                if (pickup == null || volId == null || !volId.equals(pickup.getVolunteerId())) {
                    throw new AccessDeniedException("Access denied: Volunteers can only create feedback for donations they handled");
                }
            } else if (SecurityUtils.isNgo()) {
                String ngoId = ngoRepository.findByUserId(SecurityUtils.getCurrentUserId())
                        .map(n -> n.getId()).orElse(SecurityUtils.getCurrentUser().getNgoId());
                Pickup pickup = pickupRepository.findByDonationId(feedback.getDonationId()).orElse(null);
                if (pickup == null || ngoId == null || !ngoId.equals(pickup.getNgoId())) {
                    throw new AccessDeniedException("Access denied: NGOs can only create feedback for donations they handled");
                }
            } else if (SecurityUtils.isDonor()) {
                Donation donation = donationRepository.findById(feedback.getDonationId()).orElse(null);
                if (donation == null || !SecurityUtils.getCurrentUserId().equals(donation.getDonorId())) {
                    throw new AccessDeniedException("Access denied: Donors can only create feedback for their own donations");
                }
            }
        }

        if (feedback.getCreatedAt() == null) {
            feedback.setCreatedAt(Instant.now());
        }

        return ResponseEntity.ok(feedbackRepository.save(feedback));
    }

    @GetMapping
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        if (SecurityUtils.isAdmin()) {
            return ResponseEntity.ok(feedbackRepository.findAll());
        }
        if (SecurityUtils.isDonor()) {
            List<String> userDonationIds = donationRepository.findByDonorId(SecurityUtils.getCurrentUserId())
                    .stream().map(Donation::getId).toList();
            return ResponseEntity.ok(feedbackRepository.findAll().stream()
                    .filter(f -> userDonationIds.contains(f.getDonationId()) || SecurityUtils.getCurrentUserId().equals(f.getFromUserId()))
                    .toList());
        }
        return ResponseEntity.ok(feedbackRepository.findAll().stream()
                .filter(f -> SecurityUtils.getCurrentUserId().equals(f.getFromUserId()))
                .toList());
    }

    @GetMapping("/donation/{donationId}")
    public ResponseEntity<List<Feedback>> getFeedbackByDonation(@PathVariable String donationId) {
        if (SecurityUtils.isDonor()) {
            Donation donation = donationRepository.findById(donationId).orElse(null);
            if (donation == null || !SecurityUtils.getCurrentUserId().equals(donation.getDonorId())) {
                throw new AccessDeniedException("Access denied: Donors can only view feedback for their own donations");
            }
        }
        return ResponseEntity.ok(feedbackRepository.findByDonationId(donationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable String id) {
        return feedbackRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Feedback> updateFeedback(@PathVariable String id, @RequestBody Feedback feedback) {
        if (feedback.getRating() < 1 || feedback.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }
        Feedback existing = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feedback not found"));

        if (!SecurityUtils.isAdmin() && !existing.getFromUserId().equals(SecurityUtils.getCurrentUserId())) {
            throw new AccessDeniedException("Access denied: You can only edit your own feedback");
        }

        existing.setRating(feedback.getRating());
        existing.setComment(feedback.getComment());
        return ResponseEntity.ok(feedbackRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable String id) {
        Feedback existing = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feedback not found"));

        if (!SecurityUtils.isAdmin() && !existing.getFromUserId().equals(SecurityUtils.getCurrentUserId())) {
            throw new AccessDeniedException("Access denied: You can only delete your own feedback");
        }

        feedbackRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
