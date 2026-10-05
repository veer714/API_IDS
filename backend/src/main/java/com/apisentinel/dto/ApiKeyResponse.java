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
public class ApiKeyResponse {
    private Long id;
    private String name;
    private String keyPrefix;
    private String rawSecretKey; // Only populated once during generation!
    private String applicationName;
    private String applicationId;
    private String environment;
    private String status;
    private Instant lastUsedAt;
    private Instant createdAt;
    private Instant expiresAt;
}
