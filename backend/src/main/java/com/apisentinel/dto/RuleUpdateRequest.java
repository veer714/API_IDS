package com.apisentinel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleUpdateRequest {
    private Boolean enabled;
    private Double threshold;
    private String action;
    private String description;
}
