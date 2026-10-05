package com.apisentinel.controller;

import com.apisentinel.dto.RuleUpdateRequest;
import com.apisentinel.entity.SecurityRule;
import com.apisentinel.service.RuleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rules")
@RequiredArgsConstructor
@Tag(name = "Security Rules", description = "Detection rules catalog and policy threshold configuration")
public class RuleController {

    private final RuleService ruleService;

    @GetMapping
    @Operation(summary = "List all detection rules and sensitivity thresholds")
    public ResponseEntity<List<SecurityRule>> getAllRules() {
        return ResponseEntity.ok(ruleService.getAllRules());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'SECURITY_ANALYST')")
    @Operation(summary = "Enable/disable rule or update sensitivity threshold and action")
    public ResponseEntity<SecurityRule> updateRule(
            @PathVariable Long id,
            @RequestBody RuleUpdateRequest request) {
        return ResponseEntity.ok(ruleService.updateRule(id, request));
    }
}
