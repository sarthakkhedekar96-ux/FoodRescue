package com.foodrescue.repository;

import com.foodrescue.model.Volunteer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VolunteerRepository extends MongoRepository<Volunteer, String> {
    Optional<Volunteer> findByUserId(String userId);
    List<Volunteer> findByAvailability(String availability);
}
