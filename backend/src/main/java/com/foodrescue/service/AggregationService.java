package com.foodrescue.service;

import com.foodrescue.dto.CategoryStat;
import com.foodrescue.dto.DonorStat;
import com.foodrescue.dto.StatsDto;
import com.foodrescue.model.Donation;
import com.foodrescue.model.User;
import com.foodrescue.repository.UserRepository;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.*;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Service
public class AggregationService {

    private final MongoTemplate mongoTemplate;
    private final UserRepository userRepository;

    public AggregationService(MongoTemplate mongoTemplate, UserRepository userRepository) {
        this.mongoTemplate = mongoTemplate;
        this.userRepository = userRepository;
    }

    public StatsDto getAggregatedStats() {
        StatsDto stats = new StatsDto();

        // 1. Aggregation 1: Total number of donations
        long totalDonations = mongoTemplate.count(new Query(), Donation.class);
        stats.setTotalDonations(totalDonations);

        // 2. Aggregation 2: Total donations grouped by category ($group, $count, $sort)
        Aggregation categoryAgg = newAggregation(
                group("category").count().as("count"),
                sort(Sort.Direction.DESC, "count")
        );
        AggregationResults<Document> categoryResults = mongoTemplate.aggregate(categoryAgg, "donations", Document.class);
        List<CategoryStat> categoryStats = new ArrayList<>();
        for (Document doc : categoryResults.getMappedResults()) {
            String category = doc.getString("_id");
            Number count = doc.get("count", Number.class);
            if (category != null) {
                categoryStats.add(new CategoryStat(category, count != null ? count.longValue() : 0));
            }
        }
        stats.setCategoryDistribution(categoryStats);

        // 3. Aggregation 3: Top donors by number of donations ($group, $sort, $limit)
        Aggregation donorAgg = newAggregation(
                group("donorId").count().as("donationCount"),
                sort(Sort.Direction.DESC, "donationCount"),
                limit(5)
        );
        AggregationResults<Document> donorResults = mongoTemplate.aggregate(donorAgg, "donations", Document.class);
        List<DonorStat> topDonors = new ArrayList<>();
        for (Document doc : donorResults.getMappedResults()) {
            String donorId = doc.getString("_id");
            Number count = doc.get("donationCount", Number.class);
            String donorName = userRepository.findById(donorId).map(User::getName).orElse("Donor " + donorId);
            topDonors.add(new DonorStat(donorId, donorName, count != null ? count.longValue() : 0));
        }
        stats.setTopDonors(topDonors);

        // 4. Aggregation 4: Available vs completed vs expired donations ($group by status)
        Aggregation statusAgg = newAggregation(
                group("status").count().as("count")
        );
        AggregationResults<Document> statusResults = mongoTemplate.aggregate(statusAgg, "donations", Document.class);
        Map<String, Long> statusMap = new HashMap<>();
        for (Document doc : statusResults.getMappedResults()) {
            String status = doc.getString("_id");
            Number count = doc.get("count", Number.class);
            if (status != null) {
                statusMap.put(status, count != null ? count.longValue() : 0L);
            }
        }
        stats.setStatusDistribution(statusMap);

        // 5. Aggregation 5: Average feedback rating ($group with $avg)
        Aggregation ratingAgg = newAggregation(
                group().avg("rating").as("avgRating")
        );
        AggregationResults<Document> ratingResults = mongoTemplate.aggregate(ratingAgg, "feedback", Document.class);
        Document ratingDoc = ratingResults.getUniqueMappedResult();
        double avgRating = 0.0;
        if (ratingDoc != null && ratingDoc.get("avgRating") != null) {
            avgRating = ((Number) ratingDoc.get("avgRating")).doubleValue();
        }
        stats.setAverageRating(Math.round(avgRating * 10.0) / 10.0);

        // 6. Aggregation 6: Total quantity of food donated ($unwind foodItems, $group sum)
        Aggregation qtyAgg = newAggregation(
                unwind("foodItems"),
                group().sum("foodItems.quantity").as("totalQty")
        );
        AggregationResults<Document> qtyResults = mongoTemplate.aggregate(qtyAgg, "donations", Document.class);
        Document qtyDoc = qtyResults.getUniqueMappedResult();
        double totalQty = 0.0;
        if (qtyDoc != null && qtyDoc.get("totalQty") != null) {
            totalQty = ((Number) qtyDoc.get("totalQty")).doubleValue();
        }
        stats.setTotalFoodQuantity(Math.round(totalQty * 10.0) / 10.0);

        return stats;
    }
}
