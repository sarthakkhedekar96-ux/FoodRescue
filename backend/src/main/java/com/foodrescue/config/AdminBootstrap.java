package com.foodrescue.config;

import com.foodrescue.model.User;
import com.foodrescue.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String adminEmail = System.getenv("ADMIN_EMAIL");
        String adminPassword = System.getenv("ADMIN_PASSWORD");

        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            if (!userRepository.existsByRole("ADMIN")) {
                log.warn("No ADMIN user exists and ADMIN_EMAIL / ADMIN_PASSWORD environment variables are not set. No admin created.");
            }
            return;
        }

        String lowerEmail = adminEmail.trim().toLowerCase();
        java.util.Optional<User> existingByEmail = userRepository.findByEmail(lowerEmail);

        if (existingByEmail.isPresent()) {
            User existingAdmin = existingByEmail.get();
            if ("ADMIN".equalsIgnoreCase(existingAdmin.getRole())) {
                if (existingAdmin.getPasswordHash() == null || existingAdmin.getPasswordHash().isBlank()) {
                    existingAdmin.setPasswordHash(passwordEncoder.encode(adminPassword));
                    userRepository.save(existingAdmin);
                    log.info("Initialized password for existing ADMIN user: {}", existingAdmin.getEmail());
                } else {
                    log.info("ADMIN user already exists with configured password hash: {}", existingAdmin.getEmail());
                }
                return;
            }
        }

        if (userRepository.existsByRole("ADMIN")) {
            log.info("Admin user already exists in the database. Skipping admin bootstrap.");
            return;
        }

        User admin = new User();
        admin.setId("admin-" + UUID.randomUUID().toString().substring(0, 8));
        admin.setName("System Administrator");
        admin.setEmail(lowerEmail);
        admin.setPhone("+91 9999999999");
        admin.setRole("ADMIN");
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setCreatedAt(Instant.now());

        userRepository.save(admin);
        log.info("Admin user successfully created with email: {}", admin.getEmail());
    }
}
