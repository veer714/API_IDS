package com.apisentinel.service;

import com.apisentinel.dto.IncidentUpdateRequest;
import com.apisentinel.entity.Incident;
import com.apisentinel.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final AuditService auditService;

    public List<Incident> getRecentIncidents() {
        return incidentRepository.findTop10ByOrderByLastSeenDesc();
    }

    public Page<Incident> getPagedIncidents(int page, int size) {
        return incidentRepository.findAllByOrderByLastSeenDesc(
                PageRequest.of(page, size, Sort.by("lastSeen").descending())
        );
    }

    public Optional<Incident> getIncidentByIncidentId(String incidentId) {
        return incidentRepository.findByIncidentId(incidentId);
    }

    @Transactional
    public Incident updateIncident(String incidentId, IncidentUpdateRequest request, String actor) {
        Incident incident = incidentRepository.findByIncidentId(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));

        if (request.getStatus() != null) incident.setStatus(request.getStatus());
        if (request.getAssignedTo() != null) incident.setAssignedTo(request.getAssignedTo());
        if (request.getResolutionNotes() != null) incident.setResolutionNotes(request.getResolutionNotes());

        Incident updated = incidentRepository.save(incident);

        auditService.log(actor, "INCIDENT_UPDATED", incidentId, null, "SUCCESS",
                "Updated incident " + incidentId + " status to " + updated.getStatus());

        return updated;
    }
}
