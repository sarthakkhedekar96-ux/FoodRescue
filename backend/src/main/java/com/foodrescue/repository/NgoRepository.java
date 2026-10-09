package com.foodrescue.repository;

import com.foodrescue.model.Ngo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NgoRepository extends MongoRepository<Ngo, String> {
    Optional<Ngo> findByUserId(String userId);
}
