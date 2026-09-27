package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCampaignRequest(
        @NotBlank(message = "Campaign name is required")
        @Size(min = 2, max = 100, message = "Campaign name must be between 2 and 100 characters")
        String name,

        @Size(max = 1000, message = "Campaign description cannot exceed 1000 characters")
        String description
) {
}
