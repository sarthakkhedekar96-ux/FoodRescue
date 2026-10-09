package com.foodrescue.controller;

import com.foodrescue.dto.AuthResponse;
import com.foodrescue.dto.LoginRequest;
import com.foodrescue.dto.RegisterRequest;
import com.foodrescue.dto.UserResponseDto;
import com.foodrescue.model.Location;
import com.foodrescue.model.Ngo;
import com.foodrescue.model.User;
import com.foodrescue.model.Volunteer;
import com.foodrescue.repository.NgoRepository;
import com.foodrescue.repository.UserRepository;
import com.foodrescue.repository.VolunteerRepository;
import com.foodrescue.security.JwtService;
import com.foodrescue.security.LoginRateLimiter;
import com.foodrescue.security.SecurityUtils;
import com.foodrescue.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String DUMMY_BCRYPT_HASH = "$2a$10$wKqCExXkG81U.M.G06yV6eWlM7q5T8p7gK4B6DkE/Qy5R7fK9mZ8W";

    private final UserRepository userRepository;
    private final NgoRepository ngoRepository;
    private final VolunteerRepository volunteerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginRateLimiter loginRateLimiter;

    public AuthController(UserRepository userRepository,
                          NgoRepository ngoRepository,
                          VolunteerRepository volunteerRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          LoginRateLimiter loginRateLimiter) {
        this.userRepository = userRepository;
        this.ngoRepository = ngoRepository;
        this.volunteerRepository = volunteerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        String role = req.getRole() != null ? req.getRole().trim().toUpperCase(Locale.ROOT) : "";

        if ("ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration with role ADMIN is strictly prohibited.");
        }

        if (!role.equals("DONOR") && !role.equals("NGO") && !role.equals("VOLUNTEER")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role. Role must be DONOR, NGO, or VOLUNTEER.");
        }

        String lowerEmail = req.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(lowerEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email address is already registered.");
        }

        String userId = "U" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setId(userId);
        user.setName(req.getName().trim());
        user.setEmail(lowerEmail);
        user.setPhone(req.getPhone() != null ? req.getPhone().trim() : "+91 9999900000");
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setCreatedAt(Instant.now());

        User savedUser = userRepository.save(user);

        String linkedNgoId = null;
        String linkedVolunteerId = null;

        if ("NGO".equals(role)) {
            try {
                String ngoId = "N" + UUID.randomUUID().toString().substring(0, 8);
                double lat = req.getLatitude() != null ? req.getLatitude() : 18.5204;
                double lng = req.getLongitude() != null ? req.getLongitude() : 73.8567;
                String orgName = req.getOrganizationName() != null && !req.getOrganizationName().isBlank()
                        ? req.getOrganizationName().trim() : req.getName().trim();
                String regNum = req.getRegistrationNumber() != null && !req.getRegistrationNumber().isBlank()
                        ? req.getRegistrationNumber().trim() : "REG-" + ngoId;
                String contactPerson = req.getContactPerson() != null && !req.getContactPerson().isBlank()
                        ? req.getContactPerson().trim() : req.getName().trim();
                String address = req.getAddress() != null && !req.getAddress().isBlank()
                        ? req.getAddress().trim() : "Pune Central";
                List<String> foodTypes = req.getAcceptedFoodTypes() != null && !req.getAcceptedFoodTypes().isEmpty()
                        ? req.getAcceptedFoodTypes() : List.of("COOKED_FOOD", "PACKAGED_FOOD");

                Ngo ngo = new Ngo(
                        ngoId,
                        savedUser.getId(),
                        orgName,
                        regNum,
                        contactPerson,
                        savedUser.getPhone(),
                        address,
                        new Location(lng, lat),
                        foodTypes,
                        Instant.now()
                );
                Ngo savedNgo = ngoRepository.save(ngo);
                linkedNgoId = savedNgo.getId();
            } catch (Exception ex) {
                // Rollback user creation to prevent orphans
                userRepository.deleteById(savedUser.getId());
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create NGO profile. Registration rolled back: " + ex.getMessage());
            }
        } else if ("VOLUNTEER".equals(role)) {
            try {
                String volId = "V" + UUID.randomUUID().toString().substring(0, 8);
                double lat = req.getLatitude() != null ? req.getLatitude() : 18.5204;
                double lng = req.getLongitude() != null ? req.getLongitude() : 73.8567;
                String vehicleType = req.getVehicleType() != null && !req.getVehicleType().isBlank()
                        ? req.getVehicleType().trim() : "BIKE";
                String availability = req.getAvailability() != null && !req.getAvailability().isBlank()
                        ? req.getAvailability().trim() : "AVAILABLE";

                Volunteer vol = new Volunteer(
                        volId,
                        savedUser.getId(),
                        savedUser.getName(),
                        savedUser.getPhone(),
                        new Location(lng, lat),
                        availability,
                        vehicleType,
                        0,
                        Instant.now()
                );
                Volunteer savedVol = volunteerRepository.save(vol);
                linkedVolunteerId = savedVol.getId();
            } catch (Exception ex) {
                // Rollback user creation to prevent orphans
                userRepository.deleteById(savedUser.getId());
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to create Volunteer profile. Registration rolled back: " + ex.getMessage());
            }
        }

        String token = jwtService.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getName(),
                linkedNgoId,
                linkedVolunteerId
        );

        UserResponseDto userDto = new UserResponseDto(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                linkedNgoId,
                linkedVolunteerId,
                savedUser.getCreatedAt()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token, userDto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        String lowerEmail = req.getEmail().trim().toLowerCase(Locale.ROOT);

        if (loginRateLimiter.isBlocked(lowerEmail, clientIp)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Invalid email or password");
        }

        User user = userRepository.findByEmail(lowerEmail).orElse(null);

        boolean passwordMatches = false;
        if (user != null && user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            passwordMatches = passwordEncoder.matches(req.getPassword(), user.getPasswordHash());
        } else {
            // Run BCrypt check against dummy hash so timing does not reveal user existence
            passwordEncoder.matches(req.getPassword(), DUMMY_BCRYPT_HASH);
        }

        if (!passwordMatches) {
            loginRateLimiter.recordFailedAttempt(lowerEmail, clientIp);
            throw new BadCredentialsException("Invalid email or password");
        }

        // Login successful: clear rate limiter
        loginRateLimiter.clear(lowerEmail, clientIp);

        String linkedNgoId = null;
        String linkedVolunteerId = null;

        if ("NGO".equalsIgnoreCase(user.getRole())) {
            linkedNgoId = ngoRepository.findByUserId(user.getId()).map(Ngo::getId).orElse(null);
        } else if ("VOLUNTEER".equalsIgnoreCase(user.getRole())) {
            linkedVolunteerId = volunteerRepository.findByUserId(user.getId()).map(Volunteer::getId).orElse(null);
        }

        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getName(),
                linkedNgoId,
                linkedVolunteerId
        );

        UserResponseDto userDto = new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                linkedNgoId,
                linkedVolunteerId,
                user.getCreatedAt()
        );

        return ResponseEntity.ok(new AuthResponse(token, userDto));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getCurrentUser() {
        UserPrincipal principal = SecurityUtils.getCurrentUser();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User record not found"));

        String linkedNgoId = null;
        String linkedVolunteerId = null;

        if ("NGO".equalsIgnoreCase(user.getRole())) {
            linkedNgoId = ngoRepository.findByUserId(user.getId()).map(Ngo::getId).orElse(principal.getNgoId());
        } else if ("VOLUNTEER".equalsIgnoreCase(user.getRole())) {
            linkedVolunteerId = volunteerRepository.findByUserId(user.getId()).map(Volunteer::getId).orElse(principal.getVolunteerId());
        }

        UserResponseDto userDto = new UserResponseDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                linkedNgoId,
                linkedVolunteerId,
                user.getCreatedAt()
        );

        return ResponseEntity.ok(userDto);
    }

    @org.springframework.beans.factory.annotation.Value("${app.security.trusted-proxy:false}")
    private boolean trustedProxy;

    private String extractClientIp(HttpServletRequest request) {
        if (trustedProxy) {
            String xf = request.getHeader("X-Forwarded-For");
            if (xf != null && !xf.isBlank()) {
                return xf.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
