package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCampaignRequest(
        @NotBlank(message = "Campaign name is required")
        String name,
        String description
) {
}
