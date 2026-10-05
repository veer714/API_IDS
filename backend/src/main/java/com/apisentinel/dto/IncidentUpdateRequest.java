package com.apisentinel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentUpdateRequest {
    private String status; // OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    private String assignedTo;
    private String resolutionNotes;
}
