package com.foodrescue.controller;

import com.foodrescue.dto.UserResponseDto;
import com.foodrescue.model.User;
import com.foodrescue.repository.NgoRepository;
import com.foodrescue.repository.UserRepository;
import com.foodrescue.repository.VolunteerRepository;
import com.foodrescue.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final NgoRepository ngoRepository;
    private final VolunteerRepository volunteerRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository,
                          NgoRepository ngoRepository,
                          VolunteerRepository volunteerRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.ngoRepository = ngoRepository;
        this.volunteerRepository = volunteerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private UserResponseDto toDto(User user) {
        if (user == null) return null;
        String ngoId = "NGO".equalsIgnoreCase(user.getRole())
                ? ngoRepository.findByUserId(user.getId()).map(n -> n.getId()).orElse(null) : null;
        String volId = "VOLUNTEER".equalsIgnoreCase(user.getRole())
                ? volunteerRepository.findByUserId(user.getId()).map(v -> v.getId()).orElse(null) : null;
        return new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                ngoId,
                volId,
                user.getCreatedAt()
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> createUser(@RequestBody User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String lowerEmail = user.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(lowerEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered");
        }
        user.setEmail(lowerEmail);
        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        }
        if (user.getCreatedAt() == null) {
            user.setCreatedAt(Instant.now());
        }
        User saved = userRepository.save(user);
        return ResponseEntity.ok(toDto(saved));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        List<UserResponseDto> dtos = userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable String id) {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.getCurrentUserId().equals(id)) {
            throw new AccessDeniedException("Access denied: You cannot view other users' profiles");
        }
        return userRepository.findById(id)
                .map(u -> ResponseEntity.ok(toDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponseDto> getUserByEmail(@PathVariable String email) {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.getCurrentUser().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Access denied: You cannot view other users' profiles");
        }
        return userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .map(u -> ResponseEntity.ok(toDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable String id, @RequestBody com.foodrescue.dto.UserUpdateRequest req) {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.getCurrentUserId().equals(id)) {
            throw new AccessDeniedException("Access denied: You cannot modify other users' profiles");
        }

        return userRepository.findById(id).map(existing -> {
            if (req.getName() != null && !req.getName().isBlank()) {
                existing.setName(req.getName().trim());
            }
            if (req.getPhone() != null && !req.getPhone().isBlank()) {
                existing.setPhone(req.getPhone().trim());
            }

            User saved = userRepository.save(existing);
            return ResponseEntity.ok(toDto(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
