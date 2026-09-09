package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAbTestStatusRequest(
        @NotBlank(message = "Status is required (ACTIVE, PAUSED, CONCLUDED)")
        String status,
        String winningVariant
) {
}
