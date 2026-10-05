package com.apisentinel.controller;

import com.apisentinel.entity.ThreatEvent;
import com.apisentinel.service.ThreatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/threats")
@RequiredArgsConstructor
@Tag(name = "Threat Center", description = "Query, investigate, and triage detected intrusion threats")
public class ThreatController {

    private final ThreatService threatService;

    @GetMapping
    @Operation(summary = "Get recent threat events")
    public ResponseEntity<List<ThreatEvent>> getRecentThreats() {
        return ResponseEntity.ok(threatService.getRecentThreats());
    }

    @GetMapping("/paged")
    @Operation(summary = "Get paginated threats with sorting")
    public ResponseEntity<Page<ThreatEvent>> getPagedThreats(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(threatService.getPagedThreats(page, size));
    }

    @GetMapping("/{threatId}")
    @Operation(summary = "Get detailed threat event investigation data")
    public ResponseEntity<ThreatEvent> getThreatDetails(@PathVariable String threatId) {
        return threatService.getThreatByThreatId(threatId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
