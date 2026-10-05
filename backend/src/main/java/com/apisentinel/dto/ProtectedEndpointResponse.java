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
public class ProtectedEndpointResponse {
    private Long id;
    private Long applicationId;
    private String applicationName;
    private String path;
    private String method;
    private Boolean protectionEnabled;
    private Boolean ruleEngineEnabled;
    private Boolean mlEnabled;
    private Integer rateLimit;
    private Double challengeThreshold;
    private Double blockThreshold;
    private Boolean authRequired;
    private Instant createdAt;
}
