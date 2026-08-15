package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record CreateUrlRequest(
        @NotBlank(message = "Destination Url is required")
        @URL(message = "Must be a valid URL")
        String destinationUrl,
        String customAlias,
        String utmSource,
        String utmMedium,
        String utmCampaign,
        String utmTerm,
        String utmContent
) {
}
