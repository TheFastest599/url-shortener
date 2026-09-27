package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateUrlRequest(
        @NotBlank(message = "Destination URL is required")
        @Size(max = 2048, message = "Destination URL cannot exceed 2048 characters")
        @Pattern(regexp = "^(https?://).+", message = "Destination URL must start with http:// or https://")
        String destinationUrl,

        @Pattern(regexp = "^$|^[a-zA-Z0-9_-]{3,64}$", message = "Custom alias must be 3 to 64 characters and contain only letters, numbers, hyphens, and underscores")
        String customAlias,

        UUID campaignId,

        @Size(max = 4096, message = "Smart rules cannot exceed 4096 characters")
        String smartRules
) {}
