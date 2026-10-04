package com.apisentinel.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Health status response payload")
public class HealthResponse {

    @Schema(description = "Service health status", example = "ok")
    private String status;

    @Schema(description = "Service identifier", example = "api-sentinel-backend")
    private String service;

    public static HealthResponse of(String status, String service) {
        return new HealthResponse(status, service);
    }
}
