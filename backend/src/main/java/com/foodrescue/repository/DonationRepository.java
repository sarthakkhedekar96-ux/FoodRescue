package com.foodrescue.repository;

import com.foodrescue.model.Donation;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface DonationRepository extends MongoRepository<Donation, String> {
    List<Donation> findByStatus(String status);
    List<Donation> findByCategory(String category);
    List<Donation> findByDonorId(String donorId);
    List<Donation> findByExpiryAtBeforeAndStatus(Instant expiryAt, String status);
    
    // Geospatial Query using MongoDB 2dsphere index & $nearSphere
    List<Donation> findByLocationNearAndStatus(Point location, Distance maxDistance, String status);
    List<Donation> findByLocationNear(Point location, Distance maxDistance);
}
