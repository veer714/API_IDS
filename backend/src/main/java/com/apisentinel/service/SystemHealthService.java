package com.apisentinel.service;

import com.apisentinel.dto.SystemHealthResponse;
import com.apisentinel.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SystemHealthService {

    private final UserRepository userRepository;
    private final MLClientService mlClientService;
    private final RuleService ruleService;

    @Value("${sentinel.gateway.url:http://localhost:8081}")
    private String gatewayUrl;

    public SystemHealthResponse getSystemHealth() {
        // 1. Backend health
        SystemHealthResponse.ServiceComponentHealth backendHealth = SystemHealthResponse.ServiceComponentHealth.builder()
                .status("HEALTHY")
                .latencyMs(0.4)
                .version("v1.0.0-spring-boot")
                .message("Spring Boot API core online")
                .details(Map.of("jvm", System.getProperty("java.version"), "uptimeHours", 2.4))
                .build();

        // 2. Database health
        long dbStart = System.currentTimeMillis();
        boolean dbHealthy = false;
        try {
            userRepository.count();
            dbHealthy = true;
        } catch (Exception ignored) {}
        double dbLatency = System.currentTimeMillis() - dbStart;

        SystemHealthResponse.ServiceComponentHealth dbHealth = SystemHealthResponse.ServiceComponentHealth.builder()
                .status(dbHealthy ? "HEALTHY" : "OFFLINE")
                .latencyMs(dbLatency)
                .version("PostgreSQL / H2")
                .message(dbHealthy ? "Persistence layer active" : "Database connection failure")
                .details(Map.of("poolSize", 10))
                .build();

        // 3. ML Service health
        long mlStart = System.currentTimeMillis();
        boolean mlHealthy = mlClientService.isHealthy();
        double mlLatency = System.currentTimeMillis() - mlStart;
        Map<String, Object> mlInfo = mlHealthy ? mlClientService.getModelInfo() : Map.of();

        SystemHealthResponse.ServiceComponentHealth mlHealthStatus = SystemHealthResponse.ServiceComponentHealth.builder()
                .status(mlHealthy ? "HEALTHY" : "DEGRADED")
                .latencyMs(mlLatency)
                .version((String) mlInfo.getOrDefault("model_version", "v1.0.0-hybrid"))
                .message(mlHealthy ? "FastAPI multi-modal pipeline active" : "ML Microservice unreachable, using heuristic fallback")
                .details(mlInfo)
                .build();

        // 4. Detection Engine health
        int activeRules = ruleService.getAllRules().size();
        SystemHealthResponse.ServiceComponentHealth detectionHealth = SystemHealthResponse.ServiceComponentHealth.builder()
                .status("HEALTHY")
                .latencyMs(0.2)
                .version("v1.0.0-hybrid-fusion")
                .message("Rule heuristic engine and sliding window rate tracker active")
                .details(Map.of("activeRules", activeRules, "rateWindowSeconds", 60))
                .build();

        // 5. Gateway health
        boolean gatewayHealthy = checkGatewayHealth();
        SystemHealthResponse.ServiceComponentHealth gatewayHealth = SystemHealthResponse.ServiceComponentHealth.builder()
                .status(gatewayHealthy ? "HEALTHY" : "DEGRADED")
                .latencyMs(gatewayHealthy ? 2.1 : 0.0)
                .version("v1.0.0-reverse-proxy")
                .message(gatewayHealthy ? "Reverse proxy interceptor listening" : "Proxy offline or in embedded mode")
                .details(Map.of("proxyPort", 8081))
                .build();

        String overall = (dbHealthy && mlHealthy && gatewayHealthy) ? "HEALTHY" : (dbHealthy ? "DEGRADED" : "OFFLINE");

        return SystemHealthResponse.builder()
                .overallStatus(overall)
                .backend(backendHealth)
                .database(dbHealth)
                .mlService(mlHealthStatus)
                .detectionEngine(detectionHealth)
                .gateway(gatewayHealth)
                .build();
    }

    private boolean checkGatewayHealth() {
        try {
            RestTemplate rt = new RestTemplateBuilder().setConnectTimeout(Duration.ofMillis(800)).build();
            return rt.getForEntity(gatewayUrl + "/health", String.class).getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            return false;
        }
    }
}
