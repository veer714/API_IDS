package com.apisentinel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyRequest {
    @NotBlank(message = "Key name is required")
    private String name;

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    private String environment;
}
