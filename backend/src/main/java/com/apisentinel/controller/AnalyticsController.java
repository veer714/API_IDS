package com.apisentinel.controller;

import com.apisentinel.dto.DashboardStatsResponse;
import com.apisentinel.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Aggregated SOC metrics, attack trends, and volume analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get aggregated SOC metrics and chart data by time range")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @RequestParam(defaultValue = "24H") String timeRange) {
        return ResponseEntity.ok(analyticsService.getDashboardStats(timeRange));
    }
}
