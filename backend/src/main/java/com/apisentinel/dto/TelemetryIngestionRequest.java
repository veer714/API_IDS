package com.apisentinel.dto;

import com.apisentinel.entity.SecurityDecision;
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
public class TelemetryIngestionRequest {
    private String requestId;
    private String applicationId;
    private String method;
    private String url;
    private String endpoint;
    private String sourceIp;
    private String userAgent;
    private Integer statusCode;
    private Double responseTimeMs;
    private Integer requestSize;
    private Integer responseSize;
    private String authenticationStatus;
    private String userId;
    private SecurityDecision decision;
    private Double riskScore;
    private Double anomalyScore;
    private Double payloadScore;
    private String attackType;
    private String severity;
    private Double confidence;
    private String modelPrediction;
    private String modelVersion;
    private Double inferenceTimeMs;
    private List<String> reasons;
    private List<String> rulesTriggered;
    private Map<String, String> headers;
    private String payloadSnippet;
}
