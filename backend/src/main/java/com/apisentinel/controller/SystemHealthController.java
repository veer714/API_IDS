package com.apisentinel.controller;

import com.apisentinel.dto.SystemHealthResponse;
import com.apisentinel.service.SystemHealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@Tag(name = "System Health", description = "Real-time health verification for Backend, Gateway, Detection Engine, ML Service, and Database")
public class SystemHealthController {

    private final SystemHealthService systemHealthService;

    @GetMapping("/health")
    @Operation(summary = "Comprehensive live status check across all microservices and infrastructure components")
    public ResponseEntity<SystemHealthResponse> getSystemHealth() {
        return ResponseEntity.ok(systemHealthService.getSystemHealth());
    }
}
