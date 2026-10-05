package com.apisentinel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "threat_events", indexes = {
    @Index(name = "idx_threat_timestamp", columnList = "timestamp DESC"),
    @Index(name = "idx_threat_attack_type", columnList = "attack_type"),
    @Index(name = "idx_threat_severity", columnList = "severity"),
    @Index(name = "idx_threat_source_ip", columnList = "source_ip"),
    @Index(name = "idx_threat_endpoint", columnList = "endpoint"),
    @Index(name = "idx_threat_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreatEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "threat_id", nullable = false, unique = true, length = 64)
    private String threatId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_event_id")
    private RequestEvent requestEvent;

    @Column(name = "application_id", length = 64)
    private String applicationId;

    @Column(nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();

    @Column(name = "attack_type", nullable = false, length = 64)
    private String attackType;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String severity = "MEDIUM";

    @Column(nullable = false, length = 255)
    private String endpoint;

    @Column(name = "source_ip", nullable = false, length = 64)
    private String sourceIp;

    @Column(name = "risk_score", nullable = false)
    private Double riskScore;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String decision = "BLOCK";

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(length = 512)
    private String summary;

    @Column(name = "reasons_json", columnDefinition = "TEXT")
    private String reasonsJson;
}
