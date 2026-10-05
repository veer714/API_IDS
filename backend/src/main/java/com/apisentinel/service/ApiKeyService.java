package com.apisentinel.service;

import com.apisentinel.dto.ApiKeyRequest;
import com.apisentinel.dto.ApiKeyResponse;
import com.apisentinel.entity.ApiKey;
import com.apisentinel.entity.Application;
import com.apisentinel.repository.ApiKeyRepository;
import com.apisentinel.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditService auditService;
    private final SecureRandom secureRandom = new SecureRandom();

    public List<ApiKeyResponse> getAllKeys() {
        return apiKeyRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ApiKeyResponse> getKeysByApp(Long appId) {
        return apiKeyRepository.findByApplicationIdOrderByCreatedAtDesc(appId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApiKeyResponse createApiKey(ApiKeyRequest request, String actor) {
        Application application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found with id: " + request.getApplicationId()));

        byte[] randomBytes = new byte[24];
        secureRandom.nextBytes(randomBytes);
        String randomHex = HexFormat.of().formatHex(randomBytes);
        String rawSecretKey = "sentinel_live_" + randomHex;
        String prefix = rawSecretKey.substring(0, 18) + "...";
        String keyHash = sha256(rawSecretKey);

        ApiKey apiKey = ApiKey.builder()
                .name(request.getName())
                .keyPrefix(prefix)
                .keyHash(keyHash)
                .application(application)
                .environment(request.getEnvironment() != null ? request.getEnvironment() : application.getEnvironment())
                .status("ACTIVE")
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                .build();

        ApiKey saved = apiKeyRepository.save(apiKey);

        auditService.log(actor, "API_KEY_CREATED", saved.getKeyPrefix(), null, "SUCCESS",
                "Created API key: " + saved.getName() + " for application: " + application.getName());

        ApiKeyResponse response = toResponse(saved);
        response.setRawSecretKey(rawSecretKey); // Only returned once
        return response;
    }

    @Transactional
    public ApiKeyResponse revokeKey(Long id, String actor) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("API Key not found with id: " + id));

        apiKey.setStatus("REVOKED");
        ApiKey updated = apiKeyRepository.save(apiKey);

        auditService.log(actor, "API_KEY_REVOKED", updated.getKeyPrefix(), null, "SUCCESS",
                "Revoked API key: " + updated.getName());

        return toResponse(updated);
    }

    @Transactional
    public Optional<ApiKey> validateKey(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) return Optional.empty();

        String hash = sha256(rawKey);
        Optional<ApiKey> keyOpt = apiKeyRepository.findByKeyHash(hash);
        if (keyOpt.isPresent()) {
            ApiKey key = keyOpt.get();
            if ("ACTIVE".equalsIgnoreCase(key.getStatus())) {
                key.setLastUsedAt(Instant.now());
                apiKeyRepository.save(key);
                return Optional.of(key);
            }
        }
        return Optional.empty();
    }

    private ApiKeyResponse toResponse(ApiKey key) {
        return ApiKeyResponse.builder()
                .id(key.getId())
                .name(key.getName())
                .keyPrefix(key.getKeyPrefix())
                .applicationId(key.getApplication() != null ? key.getApplication().getAppId() : null)
                .applicationName(key.getApplication() != null ? key.getApplication().getName() : null)
                .environment(key.getEnvironment())
                .status(key.getStatus())
                .lastUsedAt(key.getLastUsedAt())
                .createdAt(key.getCreatedAt())
                .expiresAt(key.getExpiresAt())
                .build();
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }
}
