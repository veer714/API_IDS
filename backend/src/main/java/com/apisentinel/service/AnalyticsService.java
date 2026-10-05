package com.apisentinel.service;

import com.apisentinel.dto.DashboardStatsResponse;
import com.apisentinel.entity.SecurityDecision;
import com.apisentinel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final RequestEventRepository requestEventRepository;
    private final ThreatEventRepository threatEventRepository;
    private final IncidentRepository incidentRepository;
    private final ApplicationRepository applicationRepository;

    public DashboardStatsResponse getDashboardStats(String timeRange) {
        Instant after = resolveTimeRange(timeRange);

        long totalRequests = requestEventRepository.countByTimestampAfter(after);
        long totalThreats = threatEventRepository.countByTimestampAfter(after);
        long blocked = requestEventRepository.countByDecisionAndTimestampAfter(SecurityDecision.BLOCK, after);
        long challenged = requestEventRepository.countByDecisionAndTimestampAfter(SecurityDecision.CHALLENGE, after);
        long throttled = requestEventRepository.countByDecisionAndTimestampAfter(SecurityDecision.THROTTLE, after);
        long allowed = requestEventRepository.countByDecisionAndTimestampAfter(SecurityDecision.ALLOW, after);

        Double avgRisk = requestEventRepository.getAverageRiskScoreAfter(after);
        double averageRiskScore = avgRisk != null ? Math.round(avgRisk * 100.0) / 100.0 : 0.0;
        double attackRate = totalRequests > 0 ? Math.round(((double) totalThreats / totalRequests) * 1000.0) / 10.0 : 0.0;

        long activeApps = applicationRepository.count();
        long openIncidents = incidentRepository.countByStatus("OPEN");

        List<Map<String, Object>> topEndpoints = requestEventRepository.getTopAttackedEndpoints(after, PageRequest.of(0, 5));
        List<Map<String, Object>> topIps = requestEventRepository.getTopSourceIps(after, PageRequest.of(0, 5));
        List<Map<String, Object>> attackDist = threatEventRepository.getAttackTypeDistribution(after);
        List<Map<String, Object>> severityDist = threatEventRepository.getSeverityDistribution(after);
        List<Map<String, Object>> decisionDist = requestEventRepository.getDecisionDistribution(after);

        return DashboardStatsResponse.builder()
                .totalRequests(totalRequests)
                .totalThreats(totalThreats)
                .blockedRequests(blocked)
                .challengedRequests(challenged)
                .throttledRequests(throttled)
                .allowedRequests(allowed)
                .averageRisk(averageRiskScore)
                .attackRate(attackRate)
                .activeApplications(activeApps)
                .openIncidents(openIncidents)
                .topAttackedEndpoints(topEndpoints)
                .topSourceIps(topIps)
                .attackTypeDistribution(attackDist)
                .severityDistribution(severityDist)
                .decisionDistribution(decisionDist)
                .build();
    }

    private Instant resolveTimeRange(String timeRange) {
        if (timeRange == null) return Instant.now().minus(24, ChronoUnit.HOURS);
        return switch (timeRange.toUpperCase()) {
            case "1H" -> Instant.now().minus(1, ChronoUnit.HOURS);
            case "7D" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "30D" -> Instant.now().minus(30, ChronoUnit.DAYS);
            default -> Instant.now().minus(24, ChronoUnit.HOURS);
        };
    }
}
