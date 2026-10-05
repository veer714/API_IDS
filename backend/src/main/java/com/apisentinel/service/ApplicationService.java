package com.apisentinel.service;

import com.apisentinel.dto.ApplicationRequest;
import com.apisentinel.dto.ApplicationResponse;
import com.apisentinel.entity.Application;
import com.apisentinel.entity.Organization;
import com.apisentinel.repository.ApplicationRepository;
import com.apisentinel.repository.OrganizationRepository;
import com.apisentinel.repository.ProtectedEndpointRepository;
import com.apisentinel.repository.RequestEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final OrganizationRepository organizationRepository;
    private final ProtectedEndpointRepository protectedEndpointRepository;
    private final RequestEventRepository requestEventRepository;
    private final AuditService auditService;

    public List<ApplicationResponse> getAllApplications() {
        return applicationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ApplicationResponse getApplicationById(Long id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found with id: " + id));
        return toResponse(app);
    }

    public ApplicationResponse getApplicationByAppId(String appId) {
        Application app = applicationRepository.findByAppId(appId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found with appId: " + appId));
        return toResponse(app);
    }

    @Transactional
    public ApplicationResponse createApplication(ApplicationRequest request, String actor) {
        String appId = request.getAppId();
        if (appId == null || appId.isBlank()) {
            String sanitized = request.getName().toLowerCase().replaceAll("[^a-z0-9]", "_");
            appId = "app_" + sanitized + "_" + UUID.randomUUID().toString().substring(0, 6);
        }

        Organization org = organizationRepository.findAll().stream().findFirst().orElse(null);

        Application application = Application.builder()
                .appId(appId)
                .name(request.getName())
                .environment(request.getEnvironment() != null ? request.getEnvironment() : "PRODUCTION")
                .status("ACTIVE")
                .description(request.getDescription())
                .organization(org)
                .rateLimitRpm(request.getRateLimitRpm() != null ? request.getRateLimitRpm() : 1000)
                .challengeThreshold(request.getChallengeThreshold() != null ? request.getChallengeThreshold() : 0.40)
                .blockThreshold(request.getBlockThreshold() != null ? request.getBlockThreshold() : 0.70)
                .ruleEngineEnabled(request.getRuleEngineEnabled() != null ? request.getRuleEngineEnabled() : true)
                .mlEnabled(request.getMlEnabled() != null ? request.getMlEnabled() : true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        Application saved = applicationRepository.save(application);

        auditService.log(actor, "APPLICATION_CREATED", saved.getAppId(), null, "SUCCESS",
                "Created application: " + saved.getName());

        return toResponse(saved);
    }

    @Transactional
    public ApplicationResponse updateApplication(Long id, ApplicationRequest request, String actor) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found with id: " + id));

        if (request.getName() != null) app.setName(request.getName());
        if (request.getEnvironment() != null) app.setEnvironment(request.getEnvironment());
        if (request.getDescription() != null) app.setDescription(request.getDescription());
        if (request.getRateLimitRpm() != null) app.setRateLimitRpm(request.getRateLimitRpm());
        if (request.getChallengeThreshold() != null) app.setChallengeThreshold(request.getChallengeThreshold());
        if (request.getBlockThreshold() != null) app.setBlockThreshold(request.getBlockThreshold());
        if (request.getRuleEngineEnabled() != null) app.setRuleEngineEnabled(request.getRuleEngineEnabled());
        if (request.getMlEnabled() != null) app.setMlEnabled(request.getMlEnabled());

        Application updated = applicationRepository.save(app);

        auditService.log(actor, "APPLICATION_UPDATED", updated.getAppId(), null, "SUCCESS",
                "Updated application settings: " + updated.getName());

        return toResponse(updated);
    }

    private ApplicationResponse toResponse(Application app) {
        long epCount = protectedEndpointRepository.findByApplicationId(app.getId()).size();
        return ApplicationResponse.builder()
                .id(app.getId())
                .appId(app.getAppId())
                .name(app.getName())
                .environment(app.getEnvironment())
                .status(app.getStatus())
                .description(app.getDescription())
                .rateLimitRpm(app.getRateLimitRpm())
                .challengeThreshold(app.getChallengeThreshold())
                .blockThreshold(app.getBlockThreshold())
                .ruleEngineEnabled(app.getRuleEngineEnabled())
                .mlEnabled(app.getMlEnabled())
                .protectedEndpointsCount(epCount)
                .totalRequests(120L)
                .totalThreats(4L)
                .createdAt(app.getCreatedAt())
                .build();
    }
}
