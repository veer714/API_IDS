package com.apisentinel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "login_attempts", indexes = {
    @Index(name = "idx_login_timestamp", columnList = "timestamp DESC"),
    @Index(name = "idx_login_ip", columnList = "source_ip"),
    @Index(name = "idx_login_user", columnList = "username_or_email"),
    @Index(name = "idx_login_blocked", columnList = "blocked")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username_or_email", nullable = false, length = 100)
    private String usernameOrEmail;

    @Column(name = "source_ip", nullable = false, length = 64)
    private String sourceIp;

    @Column(nullable = false)
    @Builder.Default
    private Instant timestamp = Instant.now();

    @Column(nullable = false)
    @Builder.Default
    private Boolean success = false;

    @Column(name = "failure_reason", length = 100)
    private String failureReason;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "risk_score")
    @Builder.Default
    private Double riskScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean blocked = false;
}
