package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateUtmRequest(
        @NotBlank(message = "Profile name is required")
        String name,
        String utmSource,
        String utmMedium,
        String utmCampaign,
        String utmTerm,
        String utmContent
) {
}
