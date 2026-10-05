package com.apisentinel.config;

import com.apisentinel.entity.*;
import com.apisentinel.repository.*;
import com.apisentinel.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final ApplicationRepository applicationRepository;
    private final ProtectedEndpointRepository endpointRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final RequestEventRepository requestEventRepository;
    private final ThreatEventRepository threatEventRepository;
    private final IncidentRepository incidentRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Checking API Sentinel initial dataset state...");

        // 1. Organization
        Organization org = organizationRepository.findBySlug("cybercorp-soc")
                .orElseGet(() -> organizationRepository.save(
                        Organization.builder()
                                .name("CyberCorp Global")
                                .slug("cybercorp-soc")
                                .tier("ENTERPRISE")
                                .createdAt(Instant.now().minus(30, ChronoUnit.DAYS))
                                .build()
                ));

        // 2. Default Users
        if (!userRepository.existsByUsername("admin")) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@apisentinel.io")
                    .password(passwordEncoder.encode("SentinelAdmin2026!"))
                    .fullName("Chief Security Officer")
                    .role(Role.OWNER)
                    .organization(org)
                    .enabled(true)
                    .createdAt(Instant.now().minus(30, ChronoUnit.DAYS))
                    .build());
            log.info("Initialized default admin user: admin / SentinelAdmin2026!");
        }

        if (!userRepository.existsByUsername("developer")) {
            userRepository.save(User.builder()
                    .username("developer")
                    .email("dev@apisentinel.io")
                    .password(passwordEncoder.encode("SentinelDev2026!"))
                    .fullName("Senior API Engineer")
                    .role(Role.DEVELOPER)
                    .organization(org)
                    .enabled(true)
                    .createdAt(Instant.now().minus(30, ChronoUnit.DAYS))
                    .build());
            log.info("Initialized default developer user: developer / SentinelDev2026!");
        }

        // 3. Default Application
        Application app = applicationRepository.findByAppId("app_ecommerce_prod")
                .orElseGet(() -> applicationRepository.save(
                        Application.builder()
                                .appId("app_ecommerce_prod")
                                .name("E-Commerce Core API")
                                .environment("PRODUCTION")
                                .status("ACTIVE")
                                .description("Production retail API gateway handling storefront, customer identity, catalog search, and checkout.")
                                .organization(org)
                                .rateLimitRpm(1200)
                                .challengeThreshold(0.40)
                                .blockThreshold(0.70)
                                .ruleEngineEnabled(true)
                                .mlEnabled(true)
                                .createdAt(Instant.now().minus(14, ChronoUnit.DAYS))
                                .build()
                ));

        // 4. Default Endpoints
        if (endpointRepository.findByApplicationId(app.getId()).isEmpty()) {
            endpointRepository.saveAll(List.of(
                    ProtectedEndpoint.builder()
                            .application(app)
                            .path("/api/v1/auth/login")
                            .method("POST")
                            .protectionEnabled(true)
                            .ruleEngineEnabled(true)
                            .mlEnabled(true)
                            .rateLimit(60)
                            .challengeThreshold(0.35)
                            .blockThreshold(0.65)
                            .authRequired(false)
                            .build(),
                    ProtectedEndpoint.builder()
                            .application(app)
                            .path("/api/v1/products")
                            .method("GET")
                            .protectionEnabled(true)
                            .ruleEngineEnabled(true)
                            .mlEnabled(true)
                            .rateLimit(300)
                            .challengeThreshold(0.45)
                            .blockThreshold(0.75)
                            .authRequired(false)
                            .build(),
                    ProtectedEndpoint.builder()
                            .application(app)
                            .path("/api/v1/checkout")
                            .method("POST")
                            .protectionEnabled(true)
                            .ruleEngineEnabled(true)
                            .mlEnabled(true)
                            .rateLimit(60)
                            .challengeThreshold(0.40)
                            .blockThreshold(0.70)
                            .authRequired(true)
                            .build(),
                    ProtectedEndpoint.builder()
                            .application(app)
                            .path("/api/v1/users/profile")
                            .method("GET")
                            .protectionEnabled(true)
                            .ruleEngineEnabled(true)
                            .mlEnabled(true)
                            .rateLimit(120)
                            .challengeThreshold(0.40)
                            .blockThreshold(0.70)
                            .authRequired(true)
                            .build()
            ));
            log.info("Initialized default protected endpoints for app_ecommerce_prod.");
        }

        // 5. Default API Key
        if (apiKeyRepository.findByApplicationIdOrderByCreatedAtDesc(app.getId()).isEmpty()) {
            String defaultRawKey = "sentinel_live_e8a93bf409c7429d8a113200ff921bb4";
            String keyHash = sha256(defaultRawKey);
            apiKeyRepository.save(ApiKey.builder()
                    .name("Production Gateway Master Key")
                    .keyPrefix("sentinel_live_e8a93...")
                    .keyHash(keyHash)
                    .application(app)
                    .environment("PRODUCTION")
                    .status("ACTIVE")
                    .lastUsedAt(Instant.now().minus(5, ChronoUnit.MINUTES))
                    .createdAt(Instant.now().minus(14, ChronoUnit.DAYS))
                    .expiresAt(Instant.now().plus(350, ChronoUnit.DAYS))
                    .build());
            log.info("Initialized default master API key: {}", defaultRawKey);
        }

        // 6. Initial Seed Telemetry & Threat events if empty
        if (requestEventRepository.count() == 0) {
            seedInitialTelemetry(app);
        }

        // 7. Seed initial notification
        if (notificationRepository.count() == 0) {
            notificationRepository.save(Notification.builder()
                    .title("API Sentinel Protection Engaged")
                    .message("Intrusion detection pipeline active with XGBoost + Isolation Forest hybrid model.")
                    .severity("INFO")
                    .type("SYSTEM")
                    .readStatus(false)
                    .timestamp(Instant.now().minus(1, ChronoUnit.HOURS))
                    .link("/dashboard")
                    .build());
        }

        log.info("API Sentinel initialization complete.");
    }

    private void seedInitialTelemetry(Application app) {
        Instant now = Instant.now();

        // 1. Normal traffic items
        for (int i = 1; i <= 8; i++) {
            requestEventRepository.save(RequestEvent.builder()
                    .requestId("req_norm_" + UUID.randomUUID().toString().substring(0, 8))
                    .applicationId(app.getAppId())
                    .timestamp(now.minus(i * 3, ChronoUnit.MINUTES))
                    .method("GET")
                    .url("https://api.cybercorp.io/api/v1/products?category=electronics&page=" + i)
                    .endpoint("/api/v1/products")
                    .sourceIp("198.51.100." + (10 + i))
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
                    .statusCode(200)
                    .responseTimeMs(18.5 + (i * 2.1))
                    .requestSize(142)
                    .responseSize(1840)
                    .authenticationStatus("UNAUTHENTICATED")
                    .decision(SecurityDecision.ALLOW)
                    .riskScore(0.04)
                    .anomalyScore(0.02)
                    .payloadScore(0.01)
                    .attackType("NORMAL")
                    .severity("LOW")
                    .confidence(0.99)
                    .modelPrediction("NORMAL")
                    .modelVersion("v1.0.0-hybrid")
                    .inferenceTimeMs(3.2)
                    .reasonsJson("[\"Behavioral metrics within baseline\", \"Payload entropy normal\"]")
                    .rulesTriggeredJson("[]")
                    .headersJson("{\"Host\":\"api.cybercorp.io\",\"Accept\":\"application/json\"}")
                    .payloadSnippet("category=electronics&page=" + i)
                    .build());
        }

        // 2. Detected SQL Injection Attack
        RequestEvent sqliReq = requestEventRepository.save(RequestEvent.builder()
                .requestId("req_sqli_" + UUID.randomUUID().toString().substring(0, 8))
                .applicationId(app.getAppId())
                .timestamp(now.minus(12, ChronoUnit.MINUTES))
                .method("GET")
                .url("https://api.cybercorp.io/api/v1/products?search=' UNION SELECT username, password FROM users--")
                .endpoint("/api/v1/products")
                .sourceIp("203.0.113.45")
                .userAgent("sqlmap/1.7.2#stable (https://sqlmap.org)")
                .statusCode(403)
                .responseTimeMs(6.4)
                .requestSize(284)
                .responseSize(120)
                .authenticationStatus("UNAUTHENTICATED")
                .decision(SecurityDecision.BLOCK)
                .riskScore(0.96)
                .anomalyScore(0.88)
                .payloadScore(0.98)
                .attackType("SQL_INJECTION")
                .severity("HIGH")
                .confidence(0.99)
                .modelPrediction("MALICIOUS")
                .modelVersion("v1.0.0-hybrid")
                .inferenceTimeMs(4.1)
                .reasonsJson("[\"Security rule triggered: RULE_SQLI_HEURISTIC\", \"UNION SELECT keyword sequence detected\", \"User-Agent matches known security assessment scanner\"]")
                .rulesTriggeredJson("[\"RULE_SQLI_HEURISTIC\"]")
                .headersJson("{\"User-Agent\":\"sqlmap/1.7.2\",\"Accept\":\"*/*\"}")
                .payloadSnippet("search=' UNION SELECT username, password FROM users--")
                .build());

        threatEventRepository.save(ThreatEvent.builder()
                .threatId("thr_sqli_001")
                .requestEvent(sqliReq)
                .applicationId(app.getAppId())
                .timestamp(now.minus(12, ChronoUnit.MINUTES))
                .attackType("SQL_INJECTION")
                .severity("HIGH")
                .endpoint("/api/v1/products")
                .sourceIp("203.0.113.45")
                .riskScore(0.96)
                .decision("BLOCK")
                .status("ACTIVE")
                .summary("Blocked SQL Injection attempting to extract database credentials via UNION SELECT")
                .reasonsJson("[\"Rule: RULE_SQLI_HEURISTIC\", \"Payload Malicious Probability: 0.98\"]")
                .build());

        // 3. Correlated Incident
        incidentRepository.save(Incident.builder()
                .incidentId("inc_sqli_campaign_01")
                .title("SQL Injection Probing Campaign targeting /api/v1/products")
                .severity("HIGH")
                .attackType("SQL_INJECTION")
                .firstSeen(now.minus(25, ChronoUnit.MINUTES))
                .lastSeen(now.minus(12, ChronoUnit.MINUTES))
                .sourceIp("203.0.113.45")
                .affectedApplication("E-Commerce Core API")
                .affectedEndpoint("/api/v1/products")
                .requestCount(6)
                .status("OPEN")
                .assignedTo("SecOps Analyst")
                .resolutionNotes("Host IP 203.0.113.45 fired multiple automated SQLMAP probes. Automatically neutralized by API Sentinel Gateway.")
                .createdAt(now.minus(25, ChronoUnit.MINUTES))
                .updatedAt(now.minus(12, ChronoUnit.MINUTES))
                .build());
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
