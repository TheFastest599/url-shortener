package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAbTestStatusRequest(
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "^(?i)(ACTIVE|PAUSED|CONCLUDED)$", message = "Status must be ACTIVE, PAUSED, or CONCLUDED")
        String status,

        @Size(max = 10, message = "Winning variant key cannot exceed 10 characters")
        String winningVariant
) {
}
