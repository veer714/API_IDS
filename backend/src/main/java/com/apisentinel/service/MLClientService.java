package com.apisentinel.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

@Service
@Slf4j
public class MLClientService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String mlServiceUrl;

    public MLClientService(
            RestTemplateBuilder builder,
            ObjectMapper objectMapper,
            @Value("${sentinel.ml-service.url:http://localhost:8000}") String mlServiceUrl,
            @Value("${sentinel.ml-service.connect-timeout-ms:3000}") int connectTimeout,
            @Value("${sentinel.ml-service.read-timeout-ms:5000}") int readTimeout) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofMillis(connectTimeout))
                .setReadTimeout(Duration.ofMillis(readTimeout))
                .build();
        this.objectMapper = objectMapper;
        this.mlServiceUrl = mlServiceUrl;
    }

    public record MLPredictionResult(
            String prediction,
            String severity,
            String attackType,
            double riskScore,
            double anomalyScore,
            double payloadScore,
            double confidence,
            List<String> reasons,
            String modelVersion,
            double inferenceTimeMs,
            boolean isFallback
    ) {}

    public MLPredictionResult predict(
            String sourceIp,
            String method,
            String endpoint,
            int statusCode,
            double responseTimeMs,
            int requestSize,
            int responseSize,
            String userAgent,
            String authStatus,
            String userId,
            Double rpm,
            Double failedRequests,
            Double uniqueEndpoints,
            String payload) {

        long start = System.currentTimeMillis();
        try {
            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("source_ip", sourceIp != null ? sourceIp : "127.0.0.1");
            reqBody.put("method", method != null ? method : "GET");
            reqBody.put("endpoint", endpoint != null ? endpoint : "/");
            reqBody.put("status_code", statusCode > 0 ? statusCode : 200);
            reqBody.put("response_time", responseTimeMs >= 0 ? responseTimeMs : 25.0);
            reqBody.put("request_size", requestSize >= 0 ? requestSize : 100);
            reqBody.put("response_size", responseSize >= 0 ? responseSize : 500);
            reqBody.put("user_agent", userAgent != null ? userAgent : "");
            reqBody.put("authentication_status", authStatus != null ? authStatus : "UNAUTHENTICATED");
            if (userId != null) reqBody.put("user_id", userId);
            if (rpm != null) reqBody.put("requests_per_minute", rpm);
            if (failedRequests != null) reqBody.put("failed_requests", failedRequests);
            if (uniqueEndpoints != null) reqBody.put("unique_endpoints", uniqueEndpoints);
            reqBody.put("payload", payload != null ? payload : "");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(reqBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    mlServiceUrl + "/api/v1/predict", entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                List<String> reasons = new ArrayList<>();
                if (root.has("reasons") && root.get("reasons").isArray()) {
                    for (JsonNode r : root.get("reasons")) {
                        reasons.add(r.asText());
                    }
                }

                double latency = (System.currentTimeMillis() - start);
                return new MLPredictionResult(
                        root.path("prediction").asText("NORMAL"),
                        root.path("severity").asText("LOW"),
                        root.path("attack_type").asText("NORMAL"),
                        root.path("risk_score").asDouble(0.0),
                        root.path("anomaly_score").asDouble(0.0),
                        root.path("payload_score").asDouble(0.0),
                        root.path("confidence").asDouble(0.95),
                        reasons,
                        root.path("model_version").asText("v1.0.0-hybrid"),
                        root.path("inference_time_ms").asDouble(latency),
                        false
                );
            }
        } catch (Exception ex) {
            log.warn("ML Service unavailable at {} - Falling back to heuristic risk evaluation: {}", mlServiceUrl, ex.getMessage());
        }

        // Heuristic fallback if ML service is temporarily unreachable
        return evaluateHeuristicFallback(payload, method, endpoint, responseTimeMs);
    }

    public boolean isHealthy() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(mlServiceUrl + "/health", String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    public Map<String, Object> getModelInfo() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(mlServiceUrl + "/api/v1/model-info", Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.warn("Failed to get model info from ML service: {}", e.getMessage());
        }
        return Collections.emptyMap();
    }

    private MLPredictionResult evaluateHeuristicFallback(String payload, String method, String endpoint, double latency) {
        String p = (payload != null ? payload.toLowerCase() : "") + " " + (endpoint != null ? endpoint.toLowerCase() : "");
        List<String> reasons = new ArrayList<>();

        if (p.contains("' or ") || p.contains("union select") || p.contains("--") || p.contains("1=1")) {
            reasons.add("Heuristic: SQL injection signature detected");
            return new MLPredictionResult("MALICIOUS", "HIGH", "SQL_INJECTION", 0.88, 0.75, 0.95, 0.90, reasons, "v1.0.0-fallback", 1.2, true);
        }
        if (p.contains("<script") || p.contains("javascript:") || p.contains("alert(") || p.contains("onerror=")) {
            reasons.add("Heuristic: Cross-site scripting (XSS) payload detected");
            return new MLPredictionResult("MALICIOUS", "HIGH", "XSS", 0.85, 0.70, 0.92, 0.88, reasons, "v1.0.0-fallback", 1.1, true);
        }
        if (p.contains("../") || p.contains("..\\") || p.contains("/etc/passwd")) {
            reasons.add("Heuristic: Path traversal directory climbing pattern detected");
            return new MLPredictionResult("MALICIOUS", "HIGH", "PATH_TRAVERSAL", 0.89, 0.80, 0.94, 0.91, reasons, "v1.0.0-fallback", 1.0, true);
        }
        if (p.contains("; ") || p.contains("| ") || p.contains("&& ") || p.contains("cat ") || p.contains("whoami")) {
            reasons.add("Heuristic: Shell command injection delimiter pattern detected");
            return new MLPredictionResult("MALICIOUS", "CRITICAL", "COMMAND_INJECTION", 0.94, 0.85, 0.96, 0.92, reasons, "v1.0.0-fallback", 1.3, true);
        }

        reasons.add("Heuristic: Normal API telemetry baseline");
        return new MLPredictionResult("NORMAL", "LOW", "NORMAL", 0.05, 0.02, 0.01, 0.99, reasons, "v1.0.0-fallback", 0.8, true);
    }
}
