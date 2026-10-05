package com.apisentinel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "protected_endpoints", indexes = {
    @Index(name = "idx_endpoint_app_path", columnList = "application_id, path")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProtectedEndpoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(nullable = false, length = 255)
    private String path;

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String method = "ALL";

    @Column(name = "protection_enabled")
    @Builder.Default
    private Boolean protectionEnabled = true;

    @Column(name = "rule_engine_enabled")
    @Builder.Default
    private Boolean ruleEngineEnabled = true;

    @Column(name = "ml_enabled")
    @Builder.Default
    private Boolean mlEnabled = true;

    @Column(name = "rate_limit")
    @Builder.Default
    private Integer rateLimit = 120;

    @Column(name = "challenge_threshold")
    @Builder.Default
    private Double challengeThreshold = 0.40;

    @Column(name = "block_threshold")
    @Builder.Default
    private Double blockThreshold = 0.70;

    @Column(name = "auth_required")
    @Builder.Default
    private Boolean authRequired = false;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
