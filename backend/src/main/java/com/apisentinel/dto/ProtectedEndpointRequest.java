package com.apisentinel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProtectedEndpointRequest {
    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotBlank(message = "Endpoint path is required")
    private String path;

    @Builder.Default
    private String method = "ALL";

    @Builder.Default
    private Boolean protectionEnabled = true;

    @Builder.Default
    private Boolean ruleEngineEnabled = true;

    @Builder.Default
    private Boolean mlEnabled = true;

    @Builder.Default
    private Integer rateLimit = 120;

    @Builder.Default
    private Double challengeThreshold = 0.40;

    @Builder.Default
    private Double blockThreshold = 0.70;

    @Builder.Default
    private Boolean authRequired = false;
}
