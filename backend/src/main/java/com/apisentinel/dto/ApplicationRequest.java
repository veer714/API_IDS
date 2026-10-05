package com.apisentinel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationRequest {
    @NotBlank(message = "Application name is required")
    private String name;

    private String appId;
    private String environment;
    private String description;
    private Integer rateLimitRpm;
    private Double challengeThreshold;
    private Double blockThreshold;
    private Boolean ruleEngineEnabled;
    private Boolean mlEnabled;
}
