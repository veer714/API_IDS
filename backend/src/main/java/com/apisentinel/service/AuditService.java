package com.apisentinel.service;

import com.apisentinel.entity.AuditLog;
import com.apisentinel.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String actor, String action, String resource, String ipAddress, String result, String details) {
        try {
            AuditLog logEntry = AuditLog.builder()
                    .actor(actor != null ? actor : "SYSTEM")
                    .action(action)
                    .resource(resource)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .result(result != null ? result : "SUCCESS")
                    .details(details)
                    .timestamp(Instant.now())
                    .build();
            auditLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to persist audit log: {}", e.getMessage());
        }
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
