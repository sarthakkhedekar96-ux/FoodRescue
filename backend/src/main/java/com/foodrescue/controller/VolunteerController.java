package com.foodrescue.controller;

import com.foodrescue.dto.VolunteerResponseDto;
import com.foodrescue.dto.VolunteerUpdateRequest;
import com.foodrescue.model.Ngo;
import com.foodrescue.model.Pickup;
import com.foodrescue.model.Volunteer;
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

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/volunteers")
public class VolunteerController {

    private final VolunteerRepository volunteerRepository;
    private final PickupRepository pickupRepository;
    private final NgoRepository ngoRepository;

    public VolunteerController(VolunteerRepository volunteerRepository,
                               PickupRepository pickupRepository,
                               NgoRepository ngoRepository) {
        this.volunteerRepository = volunteerRepository;
        this.pickupRepository = pickupRepository;
        this.ngoRepository = ngoRepository;
    }

    private VolunteerResponseDto toDto(Volunteer v, boolean isFull) {
        if (v == null) return null;
        if (isFull) {
            return new VolunteerResponseDto(
                    v.getId(),
                    v.getName(),
                    v.getVehicleType(),
                    v.getAvailability(),
                    v.getCompletedPickups(),
                    v.getPhone(),
                    v.getUserId(),
                    v.getLocation(),
                    v.getCreatedAt()
            );
        }
        // Sanitized view: phone, userId, and exact GPS coordinates are excluded
        return new VolunteerResponseDto(
                v.getId(),
                v.getName(),
                v.getVehicleType(),
                v.getAvailability(),
                v.getCompletedPickups()
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VolunteerResponseDto> createVolunteer(@RequestBody Volunteer volunteer) {
        return ResponseEntity.ok(toDto(volunteerRepository.save(volunteer), true));
    }

    @GetMapping
    public ResponseEntity<List<VolunteerResponseDto>> getAllVolunteers() {
        if (SecurityUtils.isAdmin()) {
            return ResponseEntity.ok(volunteerRepository.findAll().stream()
                    .map(v -> toDto(v, true))
                    .toList());
        }

        if (SecurityUtils.isNgo()) {
            String ngoId = ngoRepository.findByUserId(SecurityUtils.getCurrentUserId())
                    .map(Ngo::getId)
                    .orElse(SecurityUtils.getCurrentUser().getNgoId());

            if (ngoId == null) {
                return ResponseEntity.ok(List.of());
            }

            // NGOs can only see volunteers assigned to their own pickups
            List<String> assignedVolIds = pickupRepository.findByNgoId(ngoId).stream()
                    .map(Pickup::getVolunteerId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();

            List<VolunteerResponseDto> dtos = volunteerRepository.findAllById(assignedVolIds).stream()
                    .map(v -> toDto(v, false))
                    .toList();
            return ResponseEntity.ok(dtos);
        }

        // Donors and Volunteers are forbidden from listing other volunteers
        throw new AccessDeniedException("Access denied: You do not have permission to list volunteers");
    }

    @GetMapping("/{id}")
    public ResponseEntity<VolunteerResponseDto> getVolunteerById(@PathVariable String id) {
        Volunteer vol = volunteerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volunteer not found"));

        if (SecurityUtils.isAdmin()) {
            return ResponseEntity.ok(toDto(vol, true));
        }

        if (vol.getUserId().equals(SecurityUtils.getCurrentUserId())) {
            return ResponseEntity.ok(toDto(vol, true));
        }

        if (SecurityUtils.isNgo()) {
            String ngoId = ngoRepository.findByUserId(SecurityUtils.getCurrentUserId())
                    .map(Ngo::getId)
                    .orElse(SecurityUtils.getCurrentUser().getNgoId());

            boolean isAssignedToNgo = ngoId != null && pickupRepository.findByNgoId(ngoId).stream()
                    .anyMatch(p -> id.equals(p.getVolunteerId()));

            if (isAssignedToNgo) {
                return ResponseEntity.ok(toDto(vol, false));
            }
        }

        throw new AccessDeniedException("Access denied: You cannot view other volunteers' profiles");
    }

    @PutMapping("/{id}")
    public ResponseEntity<VolunteerResponseDto> updateVolunteer(@PathVariable String id, @RequestBody VolunteerUpdateRequest req) {
        Volunteer existing = volunteerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Volunteer not found"));

        if (!SecurityUtils.isAdmin()) {
            if (!existing.getUserId().equals(SecurityUtils.getCurrentUserId())) {
                throw new AccessDeniedException("Access denied: You can only update your own volunteer profile");
            }
        }

        if (req.getName() != null && !req.getName().isBlank()) {
            existing.setName(req.getName().trim());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            existing.setPhone(req.getPhone().trim());
        }
        if (req.getLocation() != null) {
            existing.setLocation(req.getLocation());
        }
        if (req.getAvailability() != null && !req.getAvailability().isBlank()) {
            existing.setAvailability(req.getAvailability().trim());
        }
        if (req.getVehicleType() != null && !req.getVehicleType().isBlank()) {
            existing.setVehicleType(req.getVehicleType().trim());
        }

        boolean isFull = SecurityUtils.isAdmin() || existing.getUserId().equals(SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(toDto(volunteerRepository.save(existing), isFull));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVolunteer(@PathVariable String id) {
        if (!volunteerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        volunteerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
