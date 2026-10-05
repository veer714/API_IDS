package com.apisentinel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalRequests;
    private long totalThreats;
    private long blockedRequests;
    private long challengedRequests;
    private long throttledRequests;
    private long allowedRequests;
    private double averageRisk;
    private double attackRate;
    private long activeApplications;
    private long openIncidents;

    private List<Map<String, Object>> topAttackedEndpoints;
    private List<Map<String, Object>> topSourceIps;
    private List<Map<String, Object>> attackTypeDistribution;
    private List<Map<String, Object>> severityDistribution;
    private List<Map<String, Object>> decisionDistribution;
}
