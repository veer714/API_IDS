package com.apisentinel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "request_events", indexes = {
    @Index(name = "idx_req_timestamp", columnList = "timestamp DESC"),
    @Index(name = "idx_req_app_id", columnList = "application_id"),
    @Index(name = "idx_req_endpoint", columnList = "endpoint"),
    @Index(name = "idx_req_source_ip", columnList = "source_ip"),
    @Index(name = "idx_req_decision", columnList = "decision"),
    @Index(name = "idx_req_risk_score", columnList = "risk_score"),
    @Index(name = "idx_req_attack_type", columnList = "attack_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, unique = true, length = 64)
    private String requestId;

    @Column(name = "application_id", length = 64)
    private String applicationId;

    @Column(nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();

    @Column(nullable = false, length = 16)
    private String method;

    @Column(length = 2048)
    private String url;

    @Column(nullable = false, length = 255)
    private String endpoint;

    @Column(name = "source_ip", nullable = false, length = 64)
    private String sourceIp;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "status_code")
    @Builder.Default
    private Integer statusCode = 200;

    @Column(name = "response_time_ms")
    @Builder.Default
    private Double responseTimeMs = 0.0;

    @Column(name = "request_size")
    @Builder.Default
    private Integer requestSize = 0;

    @Column(name = "response_size")
    @Builder.Default
    private Integer responseSize = 0;

    @Column(name = "authentication_status", length = 32)
    @Builder.Default
    private String authenticationStatus = "UNAUTHENTICATED";

    @Column(name = "user_id", length = 128)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SecurityDecision decision = SecurityDecision.ALLOW;

    @Column(name = "risk_score", nullable = false)
    @Builder.Default
    private Double riskScore = 0.0;

    @Column(name = "anomaly_score")
    @Builder.Default
    private Double anomalyScore = 0.0;

    @Column(name = "payload_score")
    @Builder.Default
    private Double payloadScore = 0.0;

    @Column(name = "attack_type", length = 64)
    @Builder.Default
    private String attackType = "NORMAL";

    @Column(length = 32)
    @Builder.Default
    private String severity = "LOW";

    @Builder.Default
    private Double confidence = 0.0;

    @Column(name = "model_prediction", length = 32)
    @Builder.Default
    private String modelPrediction = "NORMAL";

    @Column(name = "model_version", length = 64)
    private String modelVersion;

    @Column(name = "inference_time_ms")
    @Builder.Default
    private Double inferenceTimeMs = 0.0;

    @Column(name = "reasons_json", columnDefinition = "TEXT")
    private String reasonsJson;

    @Column(name = "rules_triggered_json", columnDefinition = "TEXT")
    private String rulesTriggeredJson;

    @Column(name = "headers_json", columnDefinition = "TEXT")
    private String headersJson;

    @Column(name = "payload_snippet", columnDefinition = "TEXT")
    private String payloadSnippet;
}
