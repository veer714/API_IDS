package com.apisentinel.dto;

import com.apisentinel.entity.SecurityDecision;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityEvaluationResponse {
    private String requestId;
    private SecurityDecision decision;
    private Double riskScore;
    private Double anomalyScore;
    private Double payloadScore;
    private String attackType;
    private String severity;
    private Double confidence;
    private List<String> reasons;
    private List<String> rulesTriggered;
    private boolean challengeRequired;
    private boolean rateLimited;
    private boolean blocked;
    private Double inferenceTimeMs;
    private String modelVersion;
}
