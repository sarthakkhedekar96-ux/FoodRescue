package com.foodrescue.controller;

import com.foodrescue.dto.NgoResponseDto;
import com.foodrescue.dto.NgoUpdateRequest;
import com.foodrescue.model.Ngo;
import com.foodrescue.repository.NgoRepository;
import com.foodrescue.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/ngos")
public class NgoController {

    private final NgoRepository ngoRepository;

    public NgoController(NgoRepository ngoRepository) {
        this.ngoRepository = ngoRepository;
    }

    private NgoResponseDto toDto(Ngo ngo) {
        if (ngo == null) return null;
        if (SecurityUtils.isAdmin() || SecurityUtils.getCurrentUserId().equals(ngo.getUserId())) {
            return new NgoResponseDto(
                    ngo.getId(),
                    ngo.getOrganizationName(),
                    ngo.getAddress(),
                    ngo.getAcceptedFoodTypes(),
                    ngo.getContactPerson(),
                    ngo.getPhone(),
                    ngo.getUserId(),
                    ngo.getLocation(),
                    ngo.getCreatedAt()
            );
        }
        // Non-admin / other roles receive only minimum necessary fields
        return new NgoResponseDto(
                ngo.getId(),
                ngo.getOrganizationName(),
                ngo.getAddress(),
                ngo.getAcceptedFoodTypes()
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NgoResponseDto> createNgo(@RequestBody Ngo ngo) {
        return ResponseEntity.ok(toDto(ngoRepository.save(ngo)));
    }

    @GetMapping
    public ResponseEntity<List<NgoResponseDto>> getAllNgos() {
        return ResponseEntity.ok(ngoRepository.findAll().stream().map(this::toDto).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgoResponseDto> getNgoById(@PathVariable String id) {
        return ngoRepository.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgoResponseDto> updateNgo(@PathVariable String id, @RequestBody com.foodrescue.dto.NgoUpdateRequest req) {
        Ngo existing = ngoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "NGO not found"));

        if (!SecurityUtils.isAdmin()) {
            if (!existing.getUserId().equals(SecurityUtils.getCurrentUserId())) {
                throw new AccessDeniedException("Access denied: You can only update your own NGO profile");
            }
        }

        if (req.getOrganizationName() != null && !req.getOrganizationName().isBlank()) {
            existing.setOrganizationName(req.getOrganizationName().trim());
        }
        if (req.getRegistrationNumber() != null && !req.getRegistrationNumber().isBlank()) {
            existing.setRegistrationNumber(req.getRegistrationNumber().trim());
        }
        if (req.getContactPerson() != null && !req.getContactPerson().isBlank()) {
            existing.setContactPerson(req.getContactPerson().trim());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            existing.setPhone(req.getPhone().trim());
        }
        if (req.getAddress() != null && !req.getAddress().isBlank()) {
            existing.setAddress(req.getAddress().trim());
        }
        if (req.getLocation() != null) {
            existing.setLocation(req.getLocation());
        }
        if (req.getAcceptedFoodTypes() != null) {
            existing.setAcceptedFoodTypes(req.getAcceptedFoodTypes());
        }

        return ResponseEntity.ok(toDto(ngoRepository.save(existing)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteNgo(@PathVariable String id) {
        if (!ngoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        ngoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
