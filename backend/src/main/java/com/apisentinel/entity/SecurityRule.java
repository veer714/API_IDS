package com.apisentinel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "security_rules", indexes = {
    @Index(name = "idx_rule_category", columnList = "category"),
    @Index(name = "idx_rule_enabled", columnList = "enabled")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_id", nullable = false, unique = true, length = 64)
    private String ruleId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(length = 512)
    private String description;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String severity = "HIGH";

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Builder.Default
    private Double threshold = 0.50;

    @Column(name = "pattern_regex", columnDefinition = "TEXT")
    private String patternRegex;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String action = "BLOCK"; // BLOCK, CHALLENGE, THROTTLE, ALERT

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
