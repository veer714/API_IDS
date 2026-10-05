package com.apisentinel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "incidents", indexes = {
    @Index(name = "idx_inc_status", columnList = "status"),
    @Index(name = "idx_inc_severity", columnList = "severity"),
    @Index(name = "idx_inc_last_seen", columnList = "last_seen DESC"),
    @Index(name = "idx_inc_source_ip", columnList = "source_ip")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "incident_id", nullable = false, unique = true, length = 64)
    private String incidentId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String severity = "HIGH";

    @Column(name = "attack_type", nullable = false, length = 64)
    private String attackType;

    @Column(name = "first_seen", nullable = false)
    @Builder.Default
    private Instant firstSeen = Instant.now();

    @Column(name = "last_seen", nullable = false)
    @Builder.Default
    private Instant lastSeen = Instant.now();

    @Column(name = "source_ip", nullable = false, length = 64)
    private String sourceIp;

    @Column(name = "affected_application", length = 100)
    private String affectedApplication;

    @Column(name = "affected_endpoint", length = 255)
    private String affectedEndpoint;

    @Column(name = "request_count")
    @Builder.Default
    private Integer requestCount = 1;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "OPEN"; // OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE

    @Column(name = "assigned_to", length = 100)
    private String assignedTo;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
