package com.apisentinel.controller;

import com.apisentinel.dto.ApiKeyRequest;
import com.apisentinel.dto.ApiKeyResponse;
import com.apisentinel.service.ApiKeyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/api-keys")
@RequiredArgsConstructor
@Tag(name = "API Keys", description = "Management and generation of developer API keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @GetMapping
    @Operation(summary = "List all API keys across applications")
    public ResponseEntity<List<ApiKeyResponse>> getAllKeys() {
        return ResponseEntity.ok(apiKeyService.getAllKeys());
    }

    @GetMapping("/app/{appId}")
    @Operation(summary = "List API keys for specific application")
    public ResponseEntity<List<ApiKeyResponse>> getKeysByApp(@PathVariable Long appId) {
        return ResponseEntity.ok(apiKeyService.getKeysByApp(appId));
    }

    @PostMapping
    @Operation(summary = "Generate new API key (secret returned only once)")
    public ResponseEntity<ApiKeyResponse> createApiKey(
            @Valid @RequestBody ApiKeyRequest request,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "ADMIN";
        return ResponseEntity.ok(apiKeyService.createApiKey(request, actor));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Revoke API key")
    public ResponseEntity<ApiKeyResponse> revokeKey(
            @PathVariable Long id,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "ADMIN";
        return ResponseEntity.ok(apiKeyService.revokeKey(id, actor));
    }
}
