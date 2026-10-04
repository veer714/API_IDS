package com.apisentinel.controller;

import com.apisentinel.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Health", description = "Backend service health verification endpoints")
public class HealthController {

    @GetMapping("/health")
    @Operation(
            summary = "Health check endpoint",
            description = "Returns current backend service availability and status",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Service is operating normally",
                            content = @Content(schema = @Schema(implementation = HealthResponse.class))
                    )
            }
    )
    public ResponseEntity<HealthResponse> checkHealth() {
        return ResponseEntity.ok(
                HealthResponse.of("ok", "api-sentinel-backend")
        );
    }
}
