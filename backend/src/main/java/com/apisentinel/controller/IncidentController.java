package com.apisentinel.controller;

import com.apisentinel.dto.IncidentUpdateRequest;
import com.apisentinel.entity.Incident;
import com.apisentinel.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
@Tag(name = "Incidents", description = "Security incident triage, assignment, and resolution workflow")
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping
    @Operation(summary = "Get top recent incidents")
    public ResponseEntity<List<Incident>> getRecentIncidents() {
        return ResponseEntity.ok(incidentService.getRecentIncidents());
    }

    @GetMapping("/paged")
    @Operation(summary = "Get paginated incidents")
    public ResponseEntity<Page<Incident>> getPagedIncidents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(incidentService.getPagedIncidents(page, size));
    }

    @GetMapping("/{incidentId}")
    @Operation(summary = "Get incident details by incident ID")
    public ResponseEntity<Incident> getIncidentDetails(@PathVariable String incidentId) {
        return incidentService.getIncidentByIncidentId(incidentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{incidentId}")
    @Operation(summary = "Update incident status, assignee, or resolution notes")
    public ResponseEntity<Incident> updateIncident(
            @PathVariable String incidentId,
            @RequestBody IncidentUpdateRequest request,
            Authentication auth) {
        String actor = auth != null ? auth.getName() : "ANALYST";
        return ResponseEntity.ok(incidentService.updateIncident(incidentId, request, actor));
    }
}
