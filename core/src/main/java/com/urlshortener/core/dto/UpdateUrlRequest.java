package com.urlshortener.core.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record UpdateUrlRequest(
        @Size(max = 2048, message = "Destination URL cannot exceed 2048 characters")
        @Pattern(regexp = "^$|^(https?://).+", message = "Destination URL must start with http:// or https://")
        String destinationUrl,

        UUID campaignId,

        @Size(max = 4096, message = "Smart rules cannot exceed 4096 characters")
        String smartRules,

        Boolean isActive,
        Instant expiresAt
) {
}
