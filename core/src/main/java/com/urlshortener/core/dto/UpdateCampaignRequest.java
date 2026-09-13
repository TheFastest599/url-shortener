package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateCampaignRequest(
        @NotBlank(message = "Campaign name is required")
        String name,
        String description
) {}
