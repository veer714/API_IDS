package com.apisentinel.service;

import com.apisentinel.dto.SecurityEvaluationRequest;
import com.apisentinel.dto.SecurityEvaluationResponse;
import com.apisentinel.entity.*;
import com.apisentinel.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityEvaluationService {

    private final MLClientService mlClientService;
    private final RuleService ruleService;
    private final RateTracker rateTracker;
    private final RequestEventRepository requestEventRepository;
    private final ThreatEventRepository threatEventRepository;
    private final IncidentRepository incidentRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Transactional
    public SecurityEvaluationResponse evaluate(SecurityEvaluationRequest request) {
        String requestId = "req_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String sourceIp = (request.getSourceIp() != null && !request.getSourceIp().isBlank()) ? request.getSourceIp() : "127.0.0.1";
        String endpoint = (request.getEndpoint() != null && !request.getEndpoint().isBlank()) ? request.getEndpoint() : "/";
        String method = (request.getMethod() != null) ? request.getMethod().toUpperCase() : "GET";
        String payload = (request.getPayload() != null) ? request.getPayload() : "";
        int statusCode = (request.getStatusCode() != null && request.getStatusCode() > 0) ? request.getStatusCode() : 200;

        // 1. Sliding window behavioral rate tracking
        RateTracker.TelemetryStats stats = rateTracker.recordAndGetStats(sourceIp, endpoint, statusCode);
        double rpm = (request.getRequestsPerMinute() != null) ? request.getRequestsPerMinute() : stats.rpm();
        double failedReqs = (request.getFailedRequests() != null) ? request.getFailedRequests() : stats.failedRequests();
        double uniqueEps = (request.getUniqueEndpoints() != null) ? request.getUniqueEndpoints() : stats.uniqueEndpoints();

        // 2. Signature and rule engine evaluation
        List<String> triggeredRules = ruleService.matchRules(endpoint, payload, request.getHeaders());

        // 3. Query ML Microservice for multi-modal inference
        MLClientService.MLPredictionResult mlResult = mlClientService.predict(
                sourceIp,
                method,
                endpoint,
                statusCode,
                request.getResponseTimeMs() != null ? request.getResponseTimeMs() : 20.0,
                request.getRequestSize() != null ? request.getRequestSize() : (payload.length() + 100),
                request.getResponseSize() != null ? request.getResponseSize() : 500,
                request.getUserAgent() != null ? request.getUserAgent() : "API-Client",
                request.getAuthenticationStatus() != null ? request.getAuthenticationStatus() : "UNAUTHENTICATED",
                request.getUserId(),
                rpm,
                failedReqs,
                uniqueEps,
                payload
        );

        // 4. Hybrid Risk Fusion: Combine Rule signatures, Rate limits, and ML scores
        double fusedRiskScore = mlResult.riskScore();
        String attackType = mlResult.attackType();
        String severity = mlResult.severity();
        List<String> combinedReasons = new ArrayList<>(mlResult.reasons());

        boolean rateLimitExceeded = rpm > 120.0;
        if (rateLimitExceeded) {
            fusedRiskScore = Math.max(fusedRiskScore, 0.65);
            attackType = "RATE_ABUSE";
            severity = "MEDIUM";
            triggeredRules.add("RULE_RATE_ABUSE");
            combinedReasons.add("Rate limit exceeded: " + (int) rpm + " requests/minute from IP " + sourceIp);
        }

        if (!triggeredRules.isEmpty()) {
            fusedRiskScore = Math.max(fusedRiskScore, 0.85);
            severity = "HIGH";
            for (String r : triggeredRules) {
                combinedReasons.add("Security rule triggered: " + r);
                if (r.contains("SQLI")) attackType = "SQL_INJECTION";
                else if (r.contains("XSS")) attackType = "XSS";
                else if (r.contains("PATH")) attackType = "PATH_TRAVERSAL";
                else if (r.contains("COMMAND")) { attackType = "COMMAND_INJECTION"; severity = "CRITICAL"; }
            }
        }

        // 5. Final Security Decision
        SecurityDecision decision;
        if (fusedRiskScore >= 0.65) {
            decision = SecurityDecision.BLOCK;
        } else if (fusedRiskScore >= 0.40) {
            decision = SecurityDecision.CHALLENGE;
        } else if (rateLimitExceeded) {
            decision = SecurityDecision.THROTTLE;
        } else {
            decision = SecurityDecision.ALLOW;
        }

        // 6. Record telemetry asynchronously / in database
        persistTelemetryAndAlerts(
                requestId,
                request.getAppId() != null ? request.getAppId() : "app_default",
                method,
                request.getUrl() != null ? request.getUrl() : endpoint,
                endpoint,
                sourceIp,
                request.getUserAgent(),
                statusCode,
                request.getResponseTimeMs() != null ? request.getResponseTimeMs() : 25.0,
                request.getRequestSize() != null ? request.getRequestSize() : 120,
                request.getResponseSize() != null ? request.getResponseSize() : 500,
                request.getAuthenticationStatus(),
                request.getUserId(),
                decision,
                fusedRiskScore,
                mlResult.anomalyScore(),
                mlResult.payloadScore(),
                attackType,
                severity,
                mlResult.confidence(),
                mlResult.prediction(),
                mlResult.modelVersion(),
                mlResult.inferenceTimeMs(),
                combinedReasons,
                triggeredRules,
                request.getHeaders(),
                payload
        );

        return SecurityEvaluationResponse.builder()
                .requestId(requestId)
                .decision(decision)
                .riskScore(Math.round(fusedRiskScore * 100.0) / 100.0)
                .anomalyScore(Math.round(mlResult.anomalyScore() * 100.0) / 100.0)
                .payloadScore(Math.round(mlResult.payloadScore() * 100.0) / 100.0)
                .attackType(attackType)
                .severity(severity)
                .confidence(Math.round(mlResult.confidence() * 100.0) / 100.0)
                .reasons(combinedReasons)
                .rulesTriggered(triggeredRules)
                .challengeRequired(decision == SecurityDecision.CHALLENGE)
                .rateLimited(decision == SecurityDecision.THROTTLE)
                .blocked(decision == SecurityDecision.BLOCK)
                .inferenceTimeMs(mlResult.inferenceTimeMs())
                .modelVersion(mlResult.modelVersion())
                .build();
    }

    private void persistTelemetryAndAlerts(
            String requestId,
            String appId,
            String method,
            String url,
            String endpoint,
            String sourceIp,
            String userAgent,
            int statusCode,
            double responseTimeMs,
            int requestSize,
            int responseSize,
            String authStatus,
            String userId,
            SecurityDecision decision,
            double riskScore,
            double anomalyScore,
            double payloadScore,
            String attackType,
            String severity,
            double confidence,
            String modelPrediction,
            String modelVersion,
            double inferenceTimeMs,
            List<String> reasons,
            List<String> rulesTriggered,
            Map<String, String> headers,
            String payload) {

        try {
            String reasonsJson = objectMapper.writeValueAsString(reasons);
            String rulesJson = objectMapper.writeValueAsString(rulesTriggered);
            String headersJson = headers != null ? objectMapper.writeValueAsString(headers) : "{}";
            String payloadSnippet = (payload != null && payload.length() > 500) ? payload.substring(0, 500) + "..." : payload;

            RequestEvent requestEvent = RequestEvent.builder()
                    .requestId(requestId)
                    .applicationId(appId)
                    .timestamp(Instant.now())
                    .method(method)
                    .url(url)
                    .endpoint(endpoint)
                    .sourceIp(sourceIp)
                    .userAgent(userAgent != null ? userAgent : "")
                    .statusCode(statusCode)
                    .responseTimeMs(responseTimeMs)
                    .requestSize(requestSize)
                    .responseSize(responseSize)
                    .authenticationStatus(authStatus != null ? authStatus : "UNAUTHENTICATED")
                    .userId(userId)
                    .decision(decision)
                    .riskScore(riskScore)
                    .anomalyScore(anomalyScore)
                    .payloadScore(payloadScore)
                    .attackType(attackType)
                    .severity(severity)
                    .confidence(confidence)
                    .modelPrediction(modelPrediction)
                    .modelVersion(modelVersion)
                    .inferenceTimeMs(inferenceTimeMs)
                    .reasonsJson(reasonsJson)
                    .rulesTriggeredJson(rulesJson)
                    .headersJson(headersJson)
                    .payloadSnippet(payloadSnippet)
                    .build();

            RequestEvent savedReq = requestEventRepository.save(requestEvent);

            // Broadcast to real-time traffic WebSocket
            try {
                messagingTemplate.convertAndSend("/topic/traffic", savedReq);
            } catch (Exception e) {
                log.debug("WebSocket broadcast traffic error: {}", e.getMessage());
            }

            // If not normal or decision != ALLOW, create ThreatEvent
            if (decision != SecurityDecision.ALLOW || !Objects.equals(attackType, "NORMAL")) {
                String threatId = "thr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                ThreatEvent threat = ThreatEvent.builder()
                        .threatId(threatId)
                        .requestEvent(savedReq)
                        .applicationId(appId)
                        .timestamp(Instant.now())
                        .attackType(attackType)
                        .severity(severity)
                        .endpoint(endpoint)
                        .sourceIp(sourceIp)
                        .riskScore(riskScore)
                        .decision(decision.name())
                        .status("ACTIVE")
                        .summary(attackType + " detected on " + endpoint + " from " + sourceIp)
                        .reasonsJson(reasonsJson)
                        .build();

                ThreatEvent savedThreat = threatEventRepository.save(threat);

                try {
                    messagingTemplate.convertAndSend("/topic/threats", savedThreat);
                } catch (Exception e) {
                    log.debug("WebSocket broadcast threat error: {}", e.getMessage());
                }

                // Group / correlate into Incident
                handleIncidentCorrelation(appId, sourceIp, attackType, endpoint, severity);

                // Send notification for critical / high threats
                if ("CRITICAL".equalsIgnoreCase(severity) || "HIGH".equalsIgnoreCase(severity)) {
                    notificationService.create(
                            "Intrusion Alert: " + attackType,
                            "Blocked malicious " + attackType + " on " + endpoint + " from IP " + sourceIp + " (Risk: " + (int)(riskScore * 100) + "%)",
                            severity,
                            "THREAT",
                            "/threats"
                    );
                }
            }

        } catch (Exception ex) {
            log.error("Failed to persist request event telemetry: {}", ex.getMessage(), ex);
        }
    }

    private void handleIncidentCorrelation(String appId, String sourceIp, String attackType, String endpoint, String severity) {
        try {
            Instant thirtyMinutesAgo = Instant.now().minus(30, ChronoUnit.MINUTES);
            Optional<Incident> existingIncident = incidentRepository.findFirstBySourceIpAndAttackTypeAndStatusInOrderByLastSeenDesc(
                    sourceIp, attackType, Arrays.asList("OPEN", "INVESTIGATING"));

            if (existingIncident.isPresent()) {
                Incident inc = existingIncident.get();
                inc.setLastSeen(Instant.now());
                inc.setRequestCount(inc.getRequestCount() + 1);
                incidentRepository.save(inc);
            } else {
                String incidentId = "inc_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                Incident newIncident = Incident.builder()
                        .incidentId(incidentId)
                        .title("Automated Detection: " + attackType + " Campaign from " + sourceIp)
                        .severity(severity)
                        .attackType(attackType)
                        .firstSeen(Instant.now())
                        .lastSeen(Instant.now())
                        .sourceIp(sourceIp)
                        .affectedApplication(appId)
                        .affectedEndpoint(endpoint)
                        .requestCount(1)
                        .status("OPEN")
                        .assignedTo("SecOps Automation")
                        .resolutionNotes("Incident automatically opened by API Sentinel Detection Engine upon detection of " + attackType + ".")
                        .build();

                Incident savedInc = incidentRepository.save(newIncident);
                try {
                    messagingTemplate.convertAndSend("/topic/incidents", savedInc);
                } catch (Exception e) {
                    log.debug("WebSocket broadcast incident error: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Incident correlation error: {}", e.getMessage());
        }
    }
}
