package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

import java.util.UUID;

public record CreateUrlRequest(
        @NotBlank(message = "Destination URL is required")
        @URL(message = "Must be a valid URL")
        String destinationUrl,
        String customAlias,
        UUID campaignId,
        String smartRules
) {}
