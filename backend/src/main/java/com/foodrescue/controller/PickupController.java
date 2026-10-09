package com.foodrescue.controller;

import com.foodrescue.model.Donation;
import com.foodrescue.model.Ngo;
import com.foodrescue.model.Pickup;
import com.foodrescue.model.Volunteer;
import com.foodrescue.repository.NgoRepository;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.repository.VolunteerRepository;
import com.foodrescue.security.SecurityUtils;
import com.foodrescue.service.DonationService;
import com.foodrescue.service.PickupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pickups")
public class PickupController {

    private final PickupService pickupService;
    private final DonationService donationService;
    private final NgoRepository ngoRepository;
    private final VolunteerRepository volunteerRepository;
    private final PickupRepository pickupRepository;

    public PickupController(PickupService pickupService,
                            DonationService donationService,
                            NgoRepository ngoRepository,
                            VolunteerRepository volunteerRepository,
                            PickupRepository pickupRepository) {
        this.pickupService = pickupService;
        this.donationService = donationService;
        this.ngoRepository = ngoRepository;
        this.volunteerRepository = volunteerRepository;
        this.pickupRepository = pickupRepository;
    }

    private String resolveNgoId() {
        String ngoId = SecurityUtils.getCurrentUser().getNgoId();
        if (ngoId == null || ngoId.isBlank()) {
            ngoId = ngoRepository.findByUserId(SecurityUtils.getCurrentUserId())
                    .map(Ngo::getId)
                    .orElse(null);
        }
        return ngoId;
    }

    private String resolveVolunteerId() {
        String volId = SecurityUtils.getCurrentUser().getVolunteerId();
        if (volId == null || volId.isBlank()) {
            volId = volunteerRepository.findByUserId(SecurityUtils.getCurrentUserId())
                    .map(Volunteer::getId)
                    .orElse(null);
        }
        return volId;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('NGO', 'ADMIN')")
    public ResponseEntity<Pickup> createPickup(@RequestBody Pickup pickup) {
        if (!SecurityUtils.isAdmin()) {
            String currentNgoId = resolveNgoId();
            if (currentNgoId == null) {
                throw new AccessDeniedException("Access denied: No NGO profile linked to current user");
            }
            pickup.setNgoId(currentNgoId);
        }
        return ResponseEntity.ok(pickupService.createPickup(pickup));
    }

    @GetMapping
    public ResponseEntity<List<Pickup>> getAllPickups() {
        if (SecurityUtils.isAdmin()) {
            return ResponseEntity.ok(pickupService.getAllPickups());
        }
        if (SecurityUtils.isNgo()) {
            String ngoId = resolveNgoId();
            return ResponseEntity.ok(ngoId != null ? pickupService.getPickupsByNgo(ngoId) : List.of());
        }
        if (SecurityUtils.isVolunteer()) {
            String volId = resolveVolunteerId();
            List<Pickup> myPickups = volId != null ? pickupService.getPickupsByVolunteer(volId) : List.of();
            List<Pickup> unassigned = pickupRepository.findAll().stream()
                    .filter(p -> p.getVolunteerId() == null || p.getVolunteerId().isBlank())
                    .toList();
            List<Pickup> combined = new java.util.ArrayList<>(myPickups);
            for (Pickup p : unassigned) {
                if (combined.stream().noneMatch(x -> x.getId().equals(p.getId()))) {
                    combined.add(p);
                }
            }
            return ResponseEntity.ok(combined);
        }
        if (SecurityUtils.isDonor()) {
            List<Donation> userDonations = donationService.getDonationsByDonor(SecurityUtils.getCurrentUserId());
            List<String> donationIds = userDonations.stream().map(Donation::getId).toList();
            List<Pickup> all = pickupService.getAllPickups();
            return ResponseEntity.ok(all.stream().filter(p -> donationIds.contains(p.getDonationId())).toList());
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pickup> getPickupById(@PathVariable String id) {
        Pickup pickup = pickupService.getPickupById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pickup not found"));

        if (!SecurityUtils.isAdmin()) {
            if (SecurityUtils.isNgo()) {
                String ngoId = resolveNgoId();
                if (ngoId == null || !ngoId.equals(pickup.getNgoId())) {
                    throw new AccessDeniedException("Access denied: You cannot view pickups belonging to other NGOs");
                }
            } else if (SecurityUtils.isVolunteer()) {
                String volId = resolveVolunteerId();
                if (pickup.getVolunteerId() != null && !pickup.getVolunteerId().isBlank()) {
                    if (volId == null || !volId.equals(pickup.getVolunteerId())) {
                        throw new AccessDeniedException("Access denied: You can only view pickups assigned to you");
                    }
                }
            } else if (SecurityUtils.isDonor()) {
                Donation d = donationService.getDonationById(pickup.getDonationId()).orElse(null);
                if (d == null || !SecurityUtils.getCurrentUserId().equals(d.getDonorId())) {
                    throw new AccessDeniedException("Access denied: You can only view pickups for your own donations");
                }
            }
        }

        return ResponseEntity.ok(pickup);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Pickup> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Pickup pickup = pickupService.getPickupById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pickup not found"));

        if (!SecurityUtils.isAdmin()) {
            if (SecurityUtils.isNgo()) {
                String ngoId = resolveNgoId();
                if (ngoId == null || !ngoId.equals(pickup.getNgoId())) {
                    throw new AccessDeniedException("Access denied: NGOs can only update status of their own pickups");
                }
            } else if (SecurityUtils.isVolunteer()) {
                String volId = resolveVolunteerId();
                if (pickup.getVolunteerId() == null || pickup.getVolunteerId().isBlank()) {
                    pickup.setVolunteerId(volId);
                    pickupRepository.save(pickup);
                } else if (volId == null || !volId.equals(pickup.getVolunteerId())) {
                    throw new AccessDeniedException("Access denied: Volunteers can only update status of pickups assigned to them");
                }
            } else {
                throw new AccessDeniedException("Access denied: You do not have permission to update pickup status");
            }
        }

        return ResponseEntity.ok(pickupService.updateStatus(id, status));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pickup> updatePickup(@PathVariable String id, @RequestBody Pickup pickup) {
        Pickup existing = pickupService.getPickupById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pickup not found"));

        if (!SecurityUtils.isAdmin()) {
            if (!SecurityUtils.isNgo()) {
                throw new AccessDeniedException("Access denied: Only NGOs or Admins can update pickups");
            }
            String ngoId = resolveNgoId();
            if (ngoId == null || !ngoId.equals(existing.getNgoId())) {
                throw new AccessDeniedException("Access denied: NGOs can only update their own pickups");
            }
            pickup.setNgoId(ngoId);
        }

        pickup.setId(id);
        return ResponseEntity.ok(pickupService.updatePickup(id, pickup));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePickup(@PathVariable String id) {
        pickupService.deletePickup(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ngo/{ngoId}")
    public ResponseEntity<List<Pickup>> getPickupsByNgo(@PathVariable String ngoId) {
        if (!SecurityUtils.isAdmin()) {
            String currentNgoId = resolveNgoId();
            if (currentNgoId == null || !currentNgoId.equals(ngoId)) {
                throw new AccessDeniedException("Access denied: Cannot view pickups belonging to another NGO");
            }
        }
        return ResponseEntity.ok(pickupService.getPickupsByNgo(ngoId));
    }

    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<List<Pickup>> getPickupsByVolunteer(@PathVariable String volunteerId) {
        if (!SecurityUtils.isAdmin()) {
            String currentVolId = resolveVolunteerId();
            if (currentVolId == null || !currentVolId.equals(volunteerId)) {
                throw new AccessDeniedException("Access denied: Cannot view pickups assigned to another volunteer");
            }
        }
        return ResponseEntity.ok(pickupService.getPickupsByVolunteer(volunteerId));
    }
}
