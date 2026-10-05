package com.apisentinel.service;

import com.apisentinel.dto.ProtectedEndpointRequest;
import com.apisentinel.dto.ProtectedEndpointResponse;
import com.apisentinel.entity.Application;
import com.apisentinel.entity.ProtectedEndpoint;
import com.apisentinel.repository.ApplicationRepository;
import com.apisentinel.repository.ProtectedEndpointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProtectedEndpointService {

    private final ProtectedEndpointRepository endpointRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditService auditService;

    public List<ProtectedEndpointResponse> getEndpointsByApplication(Long applicationId) {
        return endpointRepository.findByApplicationId(applicationId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ProtectedEndpointResponse> getAllEndpoints() {
        return endpointRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProtectedEndpointResponse createEndpoint(ProtectedEndpointRequest request, String actor) {
        Application app = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found with id: " + request.getApplicationId()));

        ProtectedEndpoint ep = ProtectedEndpoint.builder()
                .application(app)
                .path(request.getPath())
                .method(request.getMethod() != null ? request.getMethod() : "ALL")
                .protectionEnabled(request.getProtectionEnabled() != null ? request.getProtectionEnabled() : true)
                .ruleEngineEnabled(request.getRuleEngineEnabled() != null ? request.getRuleEngineEnabled() : true)
                .mlEnabled(request.getMlEnabled() != null ? request.getMlEnabled() : true)
                .rateLimit(request.getRateLimit() != null ? request.getRateLimit() : 120)
                .challengeThreshold(request.getChallengeThreshold() != null ? request.getChallengeThreshold() : 0.40)
                .blockThreshold(request.getBlockThreshold() != null ? request.getBlockThreshold() : 0.70)
                .authRequired(request.getAuthRequired() != null ? request.getAuthRequired() : false)
                .createdAt(Instant.now())
                .build();

        ProtectedEndpoint saved = endpointRepository.save(ep);

        auditService.log(actor, "ENDPOINT_REGISTERED", app.getAppId() + ":" + ep.getPath(), null, "SUCCESS",
                "Registered protected endpoint: " + ep.getMethod() + " " + ep.getPath());

        return toResponse(saved);
    }

    @Transactional
    public ProtectedEndpointResponse updateEndpoint(Long id, ProtectedEndpointRequest request, String actor) {
        ProtectedEndpoint ep = endpointRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint not found with id: " + id));

        if (request.getPath() != null) ep.setPath(request.getPath());
        if (request.getMethod() != null) ep.setMethod(request.getMethod());
        if (request.getProtectionEnabled() != null) ep.setProtectionEnabled(request.getProtectionEnabled());
        if (request.getRuleEngineEnabled() != null) ep.setRuleEngineEnabled(request.getRuleEngineEnabled());
        if (request.getMlEnabled() != null) ep.setMlEnabled(request.getMlEnabled());
        if (request.getRateLimit() != null) ep.setRateLimit(request.getRateLimit());
        if (request.getChallengeThreshold() != null) ep.setChallengeThreshold(request.getChallengeThreshold());
        if (request.getBlockThreshold() != null) ep.setBlockThreshold(request.getBlockThreshold());
        if (request.getAuthRequired() != null) ep.setAuthRequired(request.getAuthRequired());

        ProtectedEndpoint updated = endpointRepository.save(ep);

        auditService.log(actor, "ENDPOINT_UPDATED", ep.getApplication().getAppId() + ":" + ep.getPath(), null, "SUCCESS",
                "Updated endpoint settings: " + ep.getPath());

        return toResponse(updated);
    }

    @Transactional
    public void deleteEndpoint(Long id, String actor) {
        ProtectedEndpoint ep = endpointRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Endpoint not found with id: " + id));
        endpointRepository.delete(ep);
        auditService.log(actor, "ENDPOINT_DELETED", ep.getPath(), null, "SUCCESS", "Removed protected endpoint");
    }

    private ProtectedEndpointResponse toResponse(ProtectedEndpoint ep) {
        return ProtectedEndpointResponse.builder()
                .id(ep.getId())
                .applicationId(ep.getApplication().getId())
                .applicationName(ep.getApplication().getName())
                .path(ep.getPath())
                .method(ep.getMethod())
                .protectionEnabled(ep.getProtectionEnabled())
                .ruleEngineEnabled(ep.getRuleEngineEnabled())
                .mlEnabled(ep.getMlEnabled())
                .rateLimit(ep.getRateLimit())
                .challengeThreshold(ep.getChallengeThreshold())
                .blockThreshold(ep.getBlockThreshold())
                .authRequired(ep.getAuthRequired())
                .createdAt(ep.getCreatedAt())
                .build();
    }
}
