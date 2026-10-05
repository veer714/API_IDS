package com.apisentinel.controller;

import com.apisentinel.dto.SecurityEvaluationRequest;
import com.apisentinel.dto.SecurityEvaluationResponse;
import com.apisentinel.entity.ApiKey;
import com.apisentinel.service.ApiKeyService;
import com.apisentinel.service.SecurityEvaluationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/security")
@RequiredArgsConstructor
@Tag(name = "Security Evaluation", description = "Public Gateway & SDK Security Evaluation boundary endpoint")
public class SecurityEvaluationController {

    private final SecurityEvaluationService securityEvaluationService;
    private final ApiKeyService apiKeyService;

    @PostMapping("/evaluate")
    @org.springframework.transaction.annotation.Transactional
    @Operation(
            summary = "Evaluate API request security & calculate threat decision",
            description = "Analyzes request telemetry, payload, and headers against rule heuristics and ML models, returning ALLOW, CHALLENGE, THROTTLE, or BLOCK."
    )
    public ResponseEntity<SecurityEvaluationResponse> evaluateRequest(
            @RequestHeader(value = "X-Sentinel-Api-Key", required = false) String headerApiKey,
            @RequestBody SecurityEvaluationRequest request) {

        if (request.getAppId() == null || request.getAppId().isBlank()) {
            String key = (headerApiKey != null && !headerApiKey.isBlank()) ? headerApiKey : request.getApiKey();
            if (key != null && !key.isBlank()) {
                Optional<ApiKey> apiKeyOpt = apiKeyService.validateKey(key);
                if (apiKeyOpt.isPresent() && apiKeyOpt.get().getApplication() != null) {
                    request.setAppId(apiKeyOpt.get().getApplication().getAppId());
                }
            }
        }

        if (request.getAppId() == null || request.getAppId().isBlank()) {
            request.setAppId("app_ecommerce_prod");
        }

        SecurityEvaluationResponse response = securityEvaluationService.evaluate(request);

        return ResponseEntity.ok()
                .header("X-Sentinel-Decision", response.getDecision().name())
                .header("X-Sentinel-Risk-Score", String.valueOf(response.getRiskScore()))
                .header("X-Sentinel-Request-ID", response.getRequestId())
                .body(response);
    }
}
