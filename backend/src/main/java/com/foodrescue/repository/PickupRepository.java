package com.foodrescue.repository;

import com.foodrescue.model.Pickup;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickupRepository extends MongoRepository<Pickup, String> {
    List<Pickup> findByNgoId(String ngoId);
    List<Pickup> findByVolunteerId(String volunteerId);
    Optional<Pickup> findByDonationId(String donationId);
}
