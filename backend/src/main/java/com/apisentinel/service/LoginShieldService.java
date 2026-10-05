package com.apisentinel.service;

import com.apisentinel.dto.LoginShieldStatusResponse;
import com.apisentinel.entity.LoginAttempt;
import com.apisentinel.repository.LoginAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginShieldService {

    private final LoginAttemptRepository loginAttemptRepository;
    private final NotificationService notificationService;

    private static final int MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
    private static final int LOCKOUT_WINDOW_MINUTES = 5;

    @Transactional
    public LoginAttempt recordAttempt(
            String usernameOrEmail,
            String sourceIp,
            boolean success,
            String failureReason,
            String userAgent) {

        Instant fiveMinutesAgo = Instant.now().minus(LOCKOUT_WINDOW_MINUTES, ChronoUnit.MINUTES);
        long recentFailures = loginAttemptRepository.countBySourceIpAndSuccessFalseAndTimestampAfter(sourceIp, fiveMinutesAgo);

        boolean blocked = false;
        double riskScore = 0.05;

        if (!success) {
            recentFailures++;
            if (recentFailures >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
                blocked = true;
                riskScore = 0.95;
                log.warn("Login Shield: Brute-force lockout triggered for IP: {} ({} failed attempts)", sourceIp, recentFailures);

                notificationService.create(
                        "Login Shield: Brute-Force Blocked",
                        "IP " + sourceIp + " temporarily locked out after " + recentFailures + " failed login attempts targeting: " + usernameOrEmail,
                        "HIGH",
                        "SECURITY",
                        "/login-shield"
                );
            } else {
                riskScore = 0.20 + (recentFailures * 0.15);
            }
        }

        LoginAttempt attempt = LoginAttempt.builder()
                .usernameOrEmail(usernameOrEmail)
                .sourceIp(sourceIp != null ? sourceIp : "127.0.0.1")
                .timestamp(Instant.now())
                .success(success)
                .failureReason(failureReason)
                .userAgent(userAgent)
                .riskScore(riskScore)
                .blocked(blocked)
                .build();

        return loginAttemptRepository.save(attempt);
    }

    public boolean isIpLockedOut(String sourceIp) {
        Instant fiveMinutesAgo = Instant.now().minus(LOCKOUT_WINDOW_MINUTES, ChronoUnit.MINUTES);
        long recentFailures = loginAttemptRepository.countBySourceIpAndSuccessFalseAndTimestampAfter(sourceIp, fiveMinutesAgo);
        return recentFailures >= MAX_ATTEMPTS_BEFORE_LOCKOUT;
    }

    public LoginShieldStatusResponse getStatus() {
        Instant past24h = Instant.now().minus(24, ChronoUnit.HOURS);
        long totalAttempts = loginAttemptRepository.countByTimestampAfter(past24h);
        long failedAttempts = loginAttemptRepository.countBySuccessFalseAndTimestampAfter(past24h);
        long bruteForceBlocked = loginAttemptRepository.countByBlockedTrueAndTimestampAfter(past24h);

        double failureRate = totalAttempts > 0 ? (double) failedAttempts / totalAttempts : 0.0;

        List<LoginAttempt> attempts = loginAttemptRepository.findTop50ByOrderByTimestampDesc();
        List<Map<String, Object>> recentList = new ArrayList<>();
        for (LoginAttempt a : attempts) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("username", a.getUsernameOrEmail());
            map.put("sourceIp", a.getSourceIp());
            map.put("timestamp", a.getTimestamp());
            map.put("success", a.getSuccess());
            map.put("failureReason", a.getFailureReason());
            map.put("riskScore", a.getRiskScore());
            map.put("blocked", a.getBlocked());
            recentList.add(map);
        }

        return LoginShieldStatusResponse.builder()
                .totalAttempts(totalAttempts)
                .failedAttempts(failedAttempts)
                .bruteForceBlocked(bruteForceBlocked)
                .failureRate(Math.round(failureRate * 100.0) / 100.0)
                .maxAttemptsBeforeLockout(MAX_ATTEMPTS_BEFORE_LOCKOUT)
                .lockoutDurationMinutes(LOCKOUT_WINDOW_MINUTES)
                .challengeRiskThreshold(0.40)
                .recentAttempts(recentList)
                .build();
    }
}
