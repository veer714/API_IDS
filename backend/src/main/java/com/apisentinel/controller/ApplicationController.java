package com.apisentinel.controller;

import com.apisentinel.dto.ApplicationRequest;
import com.apisentinel.dto.ApplicationResponse;
import com.apisentinel.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Application registration and management")
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    @Operation(summary = "List all applications")
    public ResponseEntity<List<ApplicationResponse>> getAllApplications() {
        return ResponseEntity.ok(applicationService.getAllApplications());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get application by database ID")
    public ResponseEntity<ApplicationResponse> getApplicationById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new protected application")
    public ResponseEntity<ApplicationResponse> createApplication(
            @Valid @RequestBody ApplicationRequest request,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "ADMIN";
        return ResponseEntity.ok(applicationService.createApplication(request, actor));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update application security policies")
    public ResponseEntity<ApplicationResponse> updateApplication(
            @PathVariable Long id,
            @RequestBody ApplicationRequest request,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "ADMIN";
        return ResponseEntity.ok(applicationService.updateApplication(id, request, actor));
    }
}
