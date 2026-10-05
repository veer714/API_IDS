package com.apisentinel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "app_id", nullable = false, unique = true, length = 64)
    private String appId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String environment = "PRODUCTION";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(name = "rate_limit_rpm")
    @Builder.Default
    private Integer rateLimitRpm = 1000;

    @Column(name = "challenge_threshold")
    @Builder.Default
    private Double challengeThreshold = 0.40;

    @Column(name = "block_threshold")
    @Builder.Default
    private Double blockThreshold = 0.70;

    @Column(name = "rule_engine_enabled")
    @Builder.Default
    private Boolean ruleEngineEnabled = true;

    @Column(name = "ml_enabled")
    @Builder.Default
    private Boolean mlEnabled = true;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
