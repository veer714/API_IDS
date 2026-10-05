package com.apisentinel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityEvaluationRequest {
    private String appId;
    private String apiKey;
    private String method;
    private String url;
    private String endpoint;
    private String sourceIp;
    private String userAgent;
    private Map<String, String> headers;
    private String payload;
    private Integer requestSize;
    private Integer responseSize;
    private Double responseTimeMs;
    private Integer statusCode;
    private String authenticationStatus;
    private String userId;
    private Double requestsPerMinute;
    private Double failedRequests;
    private Double uniqueEndpoints;
}
