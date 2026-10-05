package com.apisentinel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {
    private Long id;
    private String appId;
    private String name;
    private String environment;
    private String status;
    private String description;
    private Integer rateLimitRpm;
    private Double challengeThreshold;
    private Double blockThreshold;
    private Boolean ruleEngineEnabled;
    private Boolean mlEnabled;
    private long protectedEndpointsCount;
    private long totalRequests;
    private long totalThreats;
    private Instant createdAt;
}
