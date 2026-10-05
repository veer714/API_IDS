package com.apisentinel.controller;

import com.apisentinel.dto.LoginShieldStatusResponse;
import com.apisentinel.entity.LoginAttempt;
import com.apisentinel.service.LoginShieldService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/login-shield")
@RequiredArgsConstructor
@Tag(name = "Login Shield", description = "Authentication attack defense and brute-force mitigation")
public class LoginShieldController {

    private final LoginShieldService loginShieldService;

    @GetMapping
    @Operation(summary = "Get current Login Shield defense metrics, lockout counts, and attack logs")
    public ResponseEntity<LoginShieldStatusResponse> getStatus() {
        return ResponseEntity.ok(loginShieldService.getStatus());
    }

    @PostMapping("/attempt")
    @Operation(summary = "Record authentication telemetry event (used by login endpoints/gateway)")
    public ResponseEntity<LoginAttempt> recordAttempt(@RequestBody RecordAttemptRequest req) {
        LoginAttempt attempt = loginShieldService.recordAttempt(
                req.getUsernameOrEmail(),
                req.getSourceIp(),
                req.isSuccess(),
                req.getFailureReason(),
                req.getUserAgent()
        );
        return ResponseEntity.ok(attempt);
    }

    @Data
    public static class RecordAttemptRequest {
        private String usernameOrEmail;
        private String sourceIp;
        private boolean success;
        private String failureReason;
        private String userAgent;
    }
}
