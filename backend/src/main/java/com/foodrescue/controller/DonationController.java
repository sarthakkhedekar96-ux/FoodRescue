package com.foodrescue.controller;

import com.foodrescue.dto.DonationResponseDto;
import com.foodrescue.model.Donation;
import com.foodrescue.model.Location;
import com.foodrescue.model.Ngo;
import com.foodrescue.model.Pickup;
import com.foodrescue.model.User;
import com.foodrescue.model.Volunteer;
import com.foodrescue.repository.NgoRepository;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.repository.UserRepository;
import com.foodrescue.repository.VolunteerRepository;
import com.foodrescue.security.SecurityUtils;
import com.foodrescue.service.DonationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

    private final DonationService donationService;
    private final PickupRepository pickupRepository;
    private final NgoRepository ngoRepository;
    private final VolunteerRepository volunteerRepository;
    private final UserRepository userRepository;

    public DonationController(DonationService donationService,
                              PickupRepository pickupRepository,
                              NgoRepository ngoRepository,
                              VolunteerRepository volunteerRepository,
                              UserRepository userRepository) {
        this.donationService = donationService;
        this.pickupRepository = pickupRepository;
        this.ngoRepository = ngoRepository;
        this.volunteerRepository = volunteerRepository;
        this.userRepository = userRepository;
    }

    private String resolveNgoId() {
        if (!SecurityUtils.isNgo()) return null;
        String ngoId = SecurityUtils.getCurrentUser().getNgoId();
        if (ngoId == null || ngoId.isBlank()) {
            ngoId = ngoRepository.findByUserId(SecurityUtils.getCurrentUserId())
                    .map(Ngo::getId)
                    .orElse(null);
        }
        return ngoId;
    }

    private String resolveVolunteerId() {
        if (!SecurityUtils.isVolunteer()) return null;
        String volId = SecurityUtils.getCurrentUser().getVolunteerId();
        if (volId == null || volId.isBlank()) {
            volId = volunteerRepository.findByUserId(SecurityUtils.getCurrentUserId())
                    .map(Volunteer::getId)
                    .orElse(null);
        }
        return volId;
    }

    private DonationResponseDto toDto(Donation d) {
        if (d == null) return null;
        boolean canSeeFullDetails = SecurityUtils.isAdmin();

        if (SecurityUtils.isDonor() && d.getDonorId() != null && d.getDonorId().equals(SecurityUtils.getCurrentUserId())) {
            canSeeFullDetails = true;
        }

        if (SecurityUtils.isNgo()) {
            String currentNgoId = resolveNgoId();
            if (currentNgoId != null) {
                boolean isClaimedByMe = pickupRepository.findByDonationId(d.getId())
                        .map(p -> currentNgoId.equals(p.getNgoId()))
                        .orElse(false);
                if (isClaimedByMe) {
                    canSeeFullDetails = true;
                }
            }
        }

        if (SecurityUtils.isVolunteer()) {
            String currentVolId = resolveVolunteerId();
            if (currentVolId != null) {
                boolean isAssignedToMe = pickupRepository.findByDonationId(d.getId())
                        .map(p -> currentVolId.equals(p.getVolunteerId()))
                        .orElse(false);
                if (isAssignedToMe) {
                    canSeeFullDetails = true;
                }
            }
        }

        String address = canSeeFullDetails ? d.getAddress() : "[Address revealed upon claiming pickup]";
        Location location = canSeeFullDetails ? d.getLocation() : null;

        String donorPhone = null;
        String donorEmail = null;
        String donorName = null;

        if (canSeeFullDetails && d.getDonorId() != null) {
            User donorUser = userRepository.findById(d.getDonorId()).orElse(null);
            if (donorUser != null) {
                donorPhone = donorUser.getPhone();
                donorEmail = donorUser.getEmail();
                donorName = donorUser.getName();
            }
        }

        return new DonationResponseDto(
                d.getId(),
                d.getDonorId(),
                d.getFoodItems(),
                d.getCategory(),
                d.getPreparedAt(),
                d.getExpiryAt(),
                location,
                address,
                d.getStatus(),
                d.getPriority(),
                d.getStatusHistory(),
                d.getCreatedAt(),
                donorName,
                donorEmail,
                donorPhone
        );
    }

    private List<DonationResponseDto> filterAndMapDonations(List<Donation> list) {
        if (SecurityUtils.isAdmin()) {
            return list.stream().map(this::toDto).toList();
        }

        if (SecurityUtils.isDonor()) {
            String currentUserId = SecurityUtils.getCurrentUserId();
            return list.stream()
                    .filter(d -> currentUserId.equals(d.getDonorId()))
                    .map(this::toDto)
                    .toList();
        }

        if (SecurityUtils.isNgo()) {
            String currentNgoId = resolveNgoId();
            Set<String> myClaimedDonationIds = currentNgoId != null
                    ? pickupRepository.findByNgoId(currentNgoId).stream().map(Pickup::getDonationId).collect(Collectors.toSet())
                    : Set.of();

            return list.stream()
                    .filter(d -> "AVAILABLE".equalsIgnoreCase(d.getStatus()) || myClaimedDonationIds.contains(d.getId()))
                    .map(this::toDto)
                    .toList();
        }

        if (SecurityUtils.isVolunteer()) {
            String currentVolId = resolveVolunteerId();
            Set<String> myAssignedDonationIds = currentVolId != null
                    ? pickupRepository.findByVolunteerId(currentVolId).stream().map(Pickup::getDonationId).collect(Collectors.toSet())
                    : Set.of();

            return list.stream()
                    .filter(d -> "AVAILABLE".equalsIgnoreCase(d.getStatus()) || myAssignedDonationIds.contains(d.getId()))
                    .map(this::toDto)
                    .toList();
        }

        return list.stream()
                .filter(d -> "AVAILABLE".equalsIgnoreCase(d.getStatus()))
                .map(this::toDto)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DONOR', 'ADMIN')")
    public ResponseEntity<DonationResponseDto> createDonation(@RequestBody Donation donation) {
        if (!SecurityUtils.isAdmin()) {
            donation.setDonorId(SecurityUtils.getCurrentUserId());
        } else if (donation.getDonorId() == null || donation.getDonorId().isBlank()) {
            donation.setDonorId(SecurityUtils.getCurrentUserId());
        }
        return ResponseEntity.ok(toDto(donationService.createDonation(donation)));
    }

    @GetMapping
    public ResponseEntity<List<DonationResponseDto>> getAllDonations() {
        if (SecurityUtils.isAdmin()) {
            return ResponseEntity.ok(donationService.getAllDonations().stream().map(this::toDto).toList());
        }
        if (SecurityUtils.isDonor()) {
            return ResponseEntity.ok(donationService.getDonationsByDonor(SecurityUtils.getCurrentUserId())
                    .stream().map(this::toDto).toList());
        }
        if (SecurityUtils.isNgo()) {
            String currentNgoId = resolveNgoId();
            Set<String> myClaimedDonationIds = currentNgoId != null
                    ? pickupRepository.findByNgoId(currentNgoId).stream().map(Pickup::getDonationId).collect(Collectors.toSet())
                    : Set.of();

            List<DonationResponseDto> list = donationService.getAllDonations().stream()
                    .filter(d -> "AVAILABLE".equalsIgnoreCase(d.getStatus()) || myClaimedDonationIds.contains(d.getId()))
                    .map(this::toDto)
                    .toList();
            return ResponseEntity.ok(list);
        }
        if (SecurityUtils.isVolunteer()) {
            String currentVolId = resolveVolunteerId();
            Set<String> myAssignedDonationIds = currentVolId != null
                    ? pickupRepository.findByVolunteerId(currentVolId).stream().map(Pickup::getDonationId).collect(Collectors.toSet())
                    : Set.of();

            List<DonationResponseDto> list = donationService.getAllDonations().stream()
                    .filter(d -> "AVAILABLE".equalsIgnoreCase(d.getStatus()) || myAssignedDonationIds.contains(d.getId()))
                    .map(this::toDto)
                    .toList();
            return ResponseEntity.ok(list);
        }
        return ResponseEntity.ok(donationService.getAvailableDonations().stream().map(this::toDto).toList());
    }

    @GetMapping("/available")
    public ResponseEntity<List<DonationResponseDto>> getAvailableDonations() {
        if (SecurityUtils.isAdmin()) {
            return ResponseEntity.ok(donationService.getAvailableDonations().stream().map(this::toDto).toList());
        }
        if (SecurityUtils.isDonor()) {
            String currentUserId = SecurityUtils.getCurrentUserId();
            return ResponseEntity.ok(donationService.getAvailableDonations().stream()
                    .filter(d -> currentUserId.equals(d.getDonorId()))
                    .map(this::toDto)
                    .toList());
        }
        if (SecurityUtils.isNgo()) {
            String currentNgoId = resolveNgoId();
            Set<String> myClaimedDonationIds = currentNgoId != null
                    ? pickupRepository.findByNgoId(currentNgoId).stream().map(Pickup::getDonationId).collect(Collectors.toSet())
                    : Set.of();

            List<Donation> all = donationService.getAllDonations();
            return ResponseEntity.ok(all.stream()
                    .filter(d -> "AVAILABLE".equalsIgnoreCase(d.getStatus()) || myClaimedDonationIds.contains(d.getId()))
                    .map(this::toDto)
                    .toList());
        }
        if (SecurityUtils.isVolunteer()) {
            String currentVolId = resolveVolunteerId();
            Set<String> myAssignedDonationIds = currentVolId != null
                    ? pickupRepository.findByVolunteerId(currentVolId).stream().map(Pickup::getDonationId).collect(Collectors.toSet())
                    : Set.of();

            List<Donation> all = donationService.getAllDonations();
            return ResponseEntity.ok(all.stream()
                    .filter(d -> "AVAILABLE".equalsIgnoreCase(d.getStatus()) || myAssignedDonationIds.contains(d.getId()))
                    .map(this::toDto)
                    .toList());
        }
        return ResponseEntity.ok(donationService.getAvailableDonations().stream().map(this::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DonationResponseDto> getDonationById(@PathVariable String id) {
        Donation donation = donationService.getDonationById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donation not found"));

        if (!SecurityUtils.isAdmin()) {
            if (SecurityUtils.isDonor()) {
                if (donation.getDonorId() == null || !donation.getDonorId().equals(SecurityUtils.getCurrentUserId())) {
                    throw new AccessDeniedException("Access denied: Donors cannot view other donors' donations");
                }
            } else if (SecurityUtils.isNgo()) {
                if (!"AVAILABLE".equalsIgnoreCase(donation.getStatus())) {
                    String currentNgoId = resolveNgoId();
                    boolean isMyClaim = currentNgoId != null && pickupRepository.findByDonationId(id)
                            .map(p -> currentNgoId.equals(p.getNgoId()))
                            .orElse(false);
                    if (!isMyClaim) {
                        throw new AccessDeniedException("Access denied: You cannot view donations claimed by another NGO");
                    }
                }
            } else if (SecurityUtils.isVolunteer()) {
                if (!"AVAILABLE".equalsIgnoreCase(donation.getStatus())) {
                    String currentVolId = resolveVolunteerId();
                    boolean isMyPickup = currentVolId != null && pickupRepository.findByDonationId(id)
                            .map(p -> currentVolId.equals(p.getVolunteerId()))
                            .orElse(false);
                    if (!isMyPickup) {
                        throw new AccessDeniedException("Access denied: You cannot view donations handled by another volunteer");
                    }
                }
            }
        }

        return ResponseEntity.ok(toDto(donation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DonationResponseDto> updateDonation(@PathVariable String id, @RequestBody Donation donation) {
        Donation existing = donationService.getDonationById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donation not found"));

        if (!SecurityUtils.isAdmin()) {
            if (!SecurityUtils.isDonor()) {
                throw new AccessDeniedException("Access denied: Only donors can update donations");
            }
            if (existing.getDonorId() == null || !existing.getDonorId().equals(SecurityUtils.getCurrentUserId())) {
                throw new AccessDeniedException("Access denied: Donors can only update their own donations");
            }
            if (!"AVAILABLE".equalsIgnoreCase(existing.getStatus())) {
                throw new AccessDeniedException("Access denied: Donations can only be modified while status is AVAILABLE");
            }
            if (pickupRepository.findByDonationId(id).isPresent()) {
                throw new AccessDeniedException("Access denied: Cannot update donation because a pickup has already been created for it");
            }
            donation.setDonorId(SecurityUtils.getCurrentUserId());
        }

        return ResponseEntity.ok(toDto(donationService.updateDonation(id, donation)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDonation(@PathVariable String id) {
        Donation existing = donationService.getDonationById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donation not found"));

        if (!SecurityUtils.isAdmin()) {
            if (!SecurityUtils.isDonor()) {
                throw new AccessDeniedException("Access denied: Only donors can delete donations");
            }
            if (existing.getDonorId() == null || !existing.getDonorId().equals(SecurityUtils.getCurrentUserId())) {
                throw new AccessDeniedException("Access denied: Donors can only delete their own donations");
            }
            if (!"AVAILABLE".equalsIgnoreCase(existing.getStatus())) {
                throw new AccessDeniedException("Access denied: Donations can only be deleted while status is AVAILABLE");
            }
            if (pickupRepository.findByDonationId(id).isPresent()) {
                throw new AccessDeniedException("Access denied: Cannot delete donation because a pickup exists for it");
            }
        }

        donationService.deleteDonation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/nearby")
    @PreAuthorize("hasAnyRole('NGO', 'ADMIN', 'VOLUNTEER')")
    public ResponseEntity<List<DonationResponseDto>> getNearbyDonations(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "5000") double distance) {
        List<Donation> nearby = donationService.getNearbyDonations(longitude, latitude, distance);
        return ResponseEntity.ok(filterAndMapDonations(nearby));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<DonationResponseDto>> getDonationsByCategory(@PathVariable String category) {
        List<Donation> byCat = donationService.getDonationsByCategory(category);
        return ResponseEntity.ok(filterAndMapDonations(byCat));
    }

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<List<DonationResponseDto>> getDonationsByDonor(@PathVariable String donorId) {
        if (!SecurityUtils.isAdmin() && !donorId.equals(SecurityUtils.getCurrentUserId())) {
            throw new AccessDeniedException("Access denied: Cannot view other donors' donations");
        }
        return ResponseEntity.ok(donationService.getDonationsByDonor(donorId).stream().map(this::toDto).toList());
    }

    @GetMapping("/expiring-soon")
    public ResponseEntity<List<DonationResponseDto>> getExpiringSoonDonations() {
        if (SecurityUtils.isAdmin()) {
            return ResponseEntity.ok(donationService.getExpiringSoonDonations().stream().map(this::toDto).toList());
        }
        if (SecurityUtils.isDonor()) {
            String currentUserId = SecurityUtils.getCurrentUserId();
            return ResponseEntity.ok(donationService.getExpiringSoonDonations().stream()
                    .filter(d -> currentUserId.equals(d.getDonorId()))
                    .map(this::toDto)
                    .toList());
        }
        if (SecurityUtils.isNgo()) {
            String currentNgoId = resolveNgoId();
            Set<String> myClaimedDonationIds = currentNgoId != null
                    ? pickupRepository.findByNgoId(currentNgoId).stream().map(Pickup::getDonationId).collect(Collectors.toSet())
                    : Set.of();
            List<Donation> expiring = donationService.getExpiringSoonDonations();
            List<Donation> myClaimedExpiring = myClaimedDonationIds.isEmpty() ? List.of() :
                    donationService.getAllDonations().stream().filter(d -> myClaimedDonationIds.contains(d.getId())).toList();
            Set<String> seen = new HashSet<>();
            List<DonationResponseDto> result = new ArrayList<>();
            for (Donation d : expiring) {
                if (seen.add(d.getId())) result.add(toDto(d));
            }
            for (Donation d : myClaimedExpiring) {
                if (seen.add(d.getId())) result.add(toDto(d));
            }
            return ResponseEntity.ok(result);
        }
        if (SecurityUtils.isVolunteer()) {
            String currentVolId = resolveVolunteerId();
            Set<String> myAssignedDonationIds = currentVolId != null
                    ? pickupRepository.findByVolunteerId(currentVolId).stream().map(Pickup::getDonationId).collect(Collectors.toSet())
                    : Set.of();
            List<Donation> expiring = donationService.getExpiringSoonDonations();
            List<Donation> myAssignedExpiring = myAssignedDonationIds.isEmpty() ? List.of() :
                    donationService.getAllDonations().stream().filter(d -> myAssignedDonationIds.contains(d.getId())).toList();
            Set<String> seen = new HashSet<>();
            List<DonationResponseDto> result = new ArrayList<>();
            for (Donation d : expiring) {
                if (seen.add(d.getId())) result.add(toDto(d));
            }
            for (Donation d : myAssignedExpiring) {
                if (seen.add(d.getId())) result.add(toDto(d));
            }
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.ok(donationService.getExpiringSoonDonations().stream().map(this::toDto).toList());
    }
}
