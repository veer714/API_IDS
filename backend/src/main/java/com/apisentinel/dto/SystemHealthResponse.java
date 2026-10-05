package com.apisentinel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthResponse {
    private String overallStatus; // HEALTHY, DEGRADED, OFFLINE
    private ServiceComponentHealth gateway;
    private ServiceComponentHealth backend;
    private ServiceComponentHealth database;
    private ServiceComponentHealth detectionEngine;
    private ServiceComponentHealth mlService;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceComponentHealth {
        private String status; // HEALTHY, DEGRADED, OFFLINE
        private double latencyMs;
        private String version;
        private String message;
        private Map<String, Object> details;
    }
}
