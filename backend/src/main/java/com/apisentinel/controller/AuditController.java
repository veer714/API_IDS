package com.apisentinel.controller;

import com.apisentinel.entity.AuditLog;
import com.apisentinel.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Query immutable platform administrative audit logs")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Get top recent audit logs")
    public ResponseEntity<List<AuditLog>> getRecentLogs() {
        return ResponseEntity.ok(auditService.getRecentLogs());
    }

    @GetMapping("/paged")
    @Operation(summary = "Get paginated audit logs")
    public ResponseEntity<Page<AuditLog>> getPagedLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditService.getAllLogs(PageRequest.of(page, size)));
    }
}
