package com.urlshortener.core.dto;

import org.hibernate.validator.constraints.URL;


import java.time.Instant;
import java.util.UUID;

public record UpdateUrlRequest(
        @URL(message = "Must be a valid URL")
        String destinationUrl,
        UUID campaignId,
        String smartRules,
        Boolean isActive,
        Instant expiresAt
) {
}
