package com.apisentinel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notif_timestamp", columnList = "timestamp DESC"),
    @Index(name = "idx_notif_read", columnList = "read_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 1024)
    private String message;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String severity = "INFO"; // INFO, WARNING, CRITICAL

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String type = "SECURITY"; // THREAT, INCIDENT, SYSTEM, SECURITY

    @Column(name = "read_status", nullable = false)
    @Builder.Default
    private Boolean readStatus = false;

    @Column(length = 255)
    private String link;

    @Builder.Default
    private Instant timestamp = Instant.now();
}
