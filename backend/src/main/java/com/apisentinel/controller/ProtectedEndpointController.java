package com.apisentinel.controller;

import com.apisentinel.dto.ProtectedEndpointRequest;
import com.apisentinel.dto.ProtectedEndpointResponse;
import com.apisentinel.service.ProtectedEndpointService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/endpoints")
@RequiredArgsConstructor
@Tag(name = "Protected Endpoints", description = "Registration and route policy management for protected APIs")
public class ProtectedEndpointController {

    private final ProtectedEndpointService endpointService;

    @GetMapping
    @Operation(summary = "List all protected endpoints")
    public ResponseEntity<List<ProtectedEndpointResponse>> getAllEndpoints() {
        return ResponseEntity.ok(endpointService.getAllEndpoints());
    }

    @GetMapping("/app/{applicationId}")
    @Operation(summary = "List endpoints by application ID")
    public ResponseEntity<List<ProtectedEndpointResponse>> getEndpointsByApplication(
            @PathVariable Long applicationId) {
        return ResponseEntity.ok(endpointService.getEndpointsByApplication(applicationId));
    }

    @PostMapping
    @Operation(summary = "Register new protected endpoint route")
    public ResponseEntity<ProtectedEndpointResponse> createEndpoint(
            @Valid @RequestBody ProtectedEndpointRequest request,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "ADMIN";
        return ResponseEntity.ok(endpointService.createEndpoint(request, actor));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update protected endpoint settings and thresholds")
    public ResponseEntity<ProtectedEndpointResponse> updateEndpoint(
            @PathVariable Long id,
            @RequestBody ProtectedEndpointRequest request,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "ADMIN";
        return ResponseEntity.ok(endpointService.updateEndpoint(id, request, actor));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove protected endpoint route")
    public ResponseEntity<Void> deleteEndpoint(
            @PathVariable Long id,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "ADMIN";
        endpointService.deleteEndpoint(id, actor);
        return ResponseEntity.noContent().build();
    }
}
