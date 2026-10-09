package com.foodrescue.controller;

import com.foodrescue.dto.StatsDto;
import com.foodrescue.service.AggregationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final AggregationService aggregationService;

    public StatsController(AggregationService aggregationService) {
        this.aggregationService = aggregationService;
    }

    @GetMapping
    public ResponseEntity<StatsDto> getStats() {
        return ResponseEntity.ok(aggregationService.getAggregatedStats());
    }
}
