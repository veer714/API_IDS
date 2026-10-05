package com.apisentinel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginShieldStatusResponse {
    private long totalAttempts;
    private long failedAttempts;
    private long bruteForceBlocked;
    private double failureRate;
    private int maxAttemptsBeforeLockout;
    private int lockoutDurationMinutes;
    private double challengeRiskThreshold;
    private List<Map<String, Object>> recentAttempts;
}
