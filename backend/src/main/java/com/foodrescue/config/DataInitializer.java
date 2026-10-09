package com.foodrescue.config;

import com.foodrescue.model.*;
import com.foodrescue.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Collections;

@Component
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true", matchIfMissing = false)
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DonationRepository donationRepository;
    private final NgoRepository ngoRepository;
    private final VolunteerRepository volunteerRepository;
    private final PickupRepository pickupRepository;
    private final FeedbackRepository feedbackRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, DonationRepository donationRepository, NgoRepository ngoRepository, VolunteerRepository volunteerRepository, PickupRepository pickupRepository, FeedbackRepository feedbackRepository, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.donationRepository = donationRepository;
        this.ngoRepository = ngoRepository;
        this.volunteerRepository = volunteerRepository;
        this.pickupRepository = pickupRepository;
        this.feedbackRepository = feedbackRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            System.out.println("[DataInitializer] Database already populated. Skipping seeding.");
            return;
        }

        System.out.println("[DataInitializer] Seeding MongoDB with realistic demonstration data for FoodRescue viva...");

        String seederPassword = System.getenv("SEEDER_PASSWORD");
        String passwordHash = (seederPassword != null && !seederPassword.isBlank()) ? passwordEncoder.encode(seederPassword) : null;

        // 1. CREATE USERS
        User donor1 = userRepository.save(new User("U101", "Royal Palace Hotel", "donor1@royalpalace.com", "+91 9823011111", "DONOR", passwordHash, Instant.now()));
        User donor2 = userRepository.save(new User("U102", "Green Leaf Bakery & Cafe", "donor2@greenleaf.com", "+91 9823022222", "DONOR", passwordHash, Instant.now()));
        
        User ngoUser1 = userRepository.save(new User("U201", "Feeding India Pune Chapter", "contact@feedingpune.org", "+91 9823033333", "NGO", passwordHash, Instant.now()));
        User ngoUser2 = userRepository.save(new User("U202", "Roti Bank Foundation", "info@rotibank.org", "+91 9823044444", "NGO", passwordHash, Instant.now()));

        User volUser1 = userRepository.save(new User("U301", "Rahul Sharma", "rahul.vol@foodrescue.org", "+91 9823055555", "VOLUNTEER", passwordHash, Instant.now()));
        User volUser2 = userRepository.save(new User("U302", "Priya Verma", "priya.vol@foodrescue.org", "+91 9823066666", "VOLUNTEER", passwordHash, Instant.now()));

        userRepository.save(new User("U401", "System Administrator", "admin@foodrescue.org", "+91 9823077777", "ADMIN", passwordHash, Instant.now()));

        // 2. CREATE NGOs
        Ngo ngo1 = ngoRepository.save(new Ngo(
                "N201", ngoUser1.getId(), "Feeding India Pune", "REG-NGO-2023-01",
                "Amit Patel", "+91 9823033333", "FC Road, Shivajinagar, Pune",
                new Location(73.8500, 18.5300),
                Arrays.asList("COOKED_FOOD", "PACKAGED_FOOD", "BAKERY"),
                Instant.now()
        ));

        Ngo ngo2 = ngoRepository.save(new Ngo(
                "N202", ngoUser2.getId(), "Roti Bank Pune", "REG-NGO-2023-02",
                "Sunita Joshi", "+91 9823044444", "Paud Road, Kothrud, Pune",
                new Location(73.8100, 18.5000),
                Arrays.asList("COOKED_FOOD", "RAW_INGREDIENTS"),
                Instant.now()
        ));

        // 3. CREATE VOLUNTEERS
        Volunteer vol1 = volunteerRepository.save(new Volunteer(
                "V301", volUser1.getId(), "Rahul Sharma", "+91 9823055555",
                new Location(73.8450, 18.5250), "AVAILABLE", "BIKE", 12, Instant.now()
        ));

        Volunteer vol2 = volunteerRepository.save(new Volunteer(
                "V302", volUser2.getId(), "Priya Verma", "+91 9823066666",
                new Location(73.8520, 18.5180), "BUSY", "CAR", 18, Instant.now()
        ));

        // 4. CREATE DONATIONS
        Instant now = Instant.now();

        Donation d1 = new Donation();
        d1.setId("D1001");
        d1.setDonorId(donor1.getId());
        d1.setFoodItems(Arrays.asList(
                new FoodItem("Veg Paneer Biryani", 25.0, "KG"),
                new FoodItem("Butter Chapati", 120.0, "PCS")
        ));
        d1.setCategory("COOKED_FOOD");
        d1.setPreparedAt(now.minus(2, ChronoUnit.HOURS));
        d1.setExpiryAt(now.plus(5, ChronoUnit.HOURS));
        d1.setLocation(new Location(73.8567, 18.5204));
        d1.setAddress("Royal Palace Banquet, Swargate, Pune");
        d1.setStatus("AVAILABLE");
        d1.setPriority("NORMAL");
        d1.setStatusHistory(Collections.singletonList(new StatusHistory("AVAILABLE", now.minus(2, ChronoUnit.HOURS))));
        donationRepository.save(d1);

        Donation d2 = new Donation();
        d2.setId("D1002");
        d2.setDonorId(donor2.getId());
        d2.setFoodItems(Arrays.asList(
                new FoodItem("Whole Wheat Bread Loaves", 40.0, "PACKETS"),
                new FoodItem("Fruit Muffins", 60.0, "PCS")
        ));
        d2.setCategory("BAKERY");
        d2.setPreparedAt(now.minus(4, ChronoUnit.HOURS));
        d2.setExpiryAt(now.plus(2, ChronoUnit.HOURS));
        d2.setLocation(new Location(73.8400, 18.5100));
        d2.setAddress("Green Leaf Bakery, Deccan Gymkhana, Pune");
        d2.setStatus("AVAILABLE");
        d2.setPriority("HIGH");
        d2.setStatusHistory(Collections.singletonList(new StatusHistory("AVAILABLE", now.minus(4, ChronoUnit.HOURS))));
        donationRepository.save(d2);

        Donation d3 = new Donation();
        d3.setId("D1003");
        d3.setDonorId(donor1.getId());
        d3.setFoodItems(Collections.singletonList(
                new FoodItem("Dal Tadka & Steamed Rice", 30.0, "KG")
        ));
        d3.setCategory("COOKED_FOOD");
        d3.setPreparedAt(now.minus(5, ChronoUnit.HOURS));
        d3.setExpiryAt(now.plus(45, ChronoUnit.MINUTES));
        d3.setLocation(new Location(73.8600, 18.5300));
        d3.setAddress("Royal Palace Express, Camp, Pune");
        d3.setStatus("AVAILABLE");
        d3.setPriority("URGENT");
        d3.setStatusHistory(Collections.singletonList(new StatusHistory("AVAILABLE", now.minus(5, ChronoUnit.HOURS))));
        donationRepository.save(d3);

        Donation d4 = new Donation();
        d4.setId("D1004");
        d4.setDonorId(donor1.getId());
        d4.setFoodItems(Arrays.asList(
                new FoodItem("Mix Vegetable Curry", 15.0, "KG"),
                new FoodItem("Jeera Rice", 20.0, "KG")
        ));
        d4.setCategory("COOKED_FOOD");
        d4.setPreparedAt(now.minus(3, ChronoUnit.HOURS));
        d4.setExpiryAt(now.plus(4, ChronoUnit.HOURS));
        d4.setLocation(new Location(73.8500, 18.5200));
        d4.setAddress("Royal Palace Kitchen, Shivajinagar, Pune");
        d4.setStatus("ACCEPTED");
        d4.setPriority("NORMAL");
        d4.setStatusHistory(Arrays.asList(
                new StatusHistory("AVAILABLE", now.minus(3, ChronoUnit.HOURS)),
                new StatusHistory("ACCEPTED", now.minus(1, ChronoUnit.HOURS))
        ));
        donationRepository.save(d4);

        Donation d5 = new Donation();
        d5.setId("D1005");
        d5.setDonorId(donor2.getId());
        d5.setFoodItems(Arrays.asList(
                new FoodItem("Assorted Sandwiches", 50.0, "PCS"),
                new FoodItem("Apple Pies", 30.0, "PCS")
        ));
        d5.setCategory("PACKAGED_FOOD");
        d5.setPreparedAt(now.minus(10, ChronoUnit.HOURS));
        d5.setExpiryAt(now.plus(2, ChronoUnit.HOURS));
        d5.setLocation(new Location(73.8200, 18.5050));
        d5.setAddress("Green Leaf Kothrud, Pune");
        d5.setStatus("COMPLETED");
        d5.setPriority("HIGH");
        d5.setStatusHistory(Arrays.asList(
                new StatusHistory("AVAILABLE", now.minus(10, ChronoUnit.HOURS)),
                new StatusHistory("ACCEPTED", now.minus(8, ChronoUnit.HOURS)),
                new StatusHistory("PICKED_UP", now.minus(7, ChronoUnit.HOURS)),
                new StatusHistory("DELIVERED", now.minus(6, ChronoUnit.HOURS)),
                new StatusHistory("COMPLETED", now.minus(5, ChronoUnit.HOURS))
        ));
        donationRepository.save(d5);

        Donation d6 = new Donation();
        d6.setId("D1006");
        d6.setDonorId(donor1.getId());
        d6.setFoodItems(Collections.singletonList(
                new FoodItem("Green Salad & Dahi Vada", 10.0, "KG")
        ));
        d6.setCategory("COOKED_FOOD");
        d6.setPreparedAt(now.minus(12, ChronoUnit.HOURS));
        d6.setExpiryAt(now.minus(1, ChronoUnit.HOURS));
        d6.setLocation(new Location(73.8700, 18.5400));
        d6.setAddress("Royal Palace Viman Nagar, Pune");
        d6.setStatus("EXPIRED");
        d6.setPriority("EXPIRED");
        d6.setStatusHistory(Arrays.asList(
                new StatusHistory("AVAILABLE", now.minus(12, ChronoUnit.HOURS)),
                new StatusHistory("EXPIRED", now.minus(1, ChronoUnit.HOURS))
        ));
        donationRepository.save(d6);

        // 5. CREATE PICKUPS
        Pickup p1 = new Pickup("P5001", d4.getId(), ngo1.getId(), vol2.getId(), "ASSIGNED", now.minus(1, ChronoUnit.HOURS), null, null);
        Pickup p2 = new Pickup("P5002", d5.getId(), ngo2.getId(), vol1.getId(), "DELIVERED", now.minus(8, ChronoUnit.HOURS), now.minus(7, ChronoUnit.HOURS), now.minus(6, ChronoUnit.HOURS));
        pickupRepository.saveAll(Arrays.asList(p1, p2));

        // 6. CREATE FEEDBACK
        Feedback f1 = new Feedback("FB901", d5.getId(), ngoUser2.getId(), 5, "Food quality was excellent and delivery by volunteer was fast and clean!", now.minus(5, ChronoUnit.HOURS));
        Feedback f2 = new Feedback("FB902", d5.getId(), volUser1.getId(), 5, "Donor packed everything neatly in hygienic thermal containers.", now.minus(5, ChronoUnit.HOURS));
        feedbackRepository.saveAll(Arrays.asList(f1, f2));

        System.out.println("[DataInitializer] Sample data successfully seeded for FoodRescue!");
    }
}
