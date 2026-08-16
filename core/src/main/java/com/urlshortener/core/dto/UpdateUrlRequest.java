package com.urlshortener.core.dto;

import org.hibernate.validator.constraints.URL;

import java.time.Instant;

public record UpdateUrlRequest(
        @URL(message = "Must be a valid URL")
        String destinationUrl,
        Boolean isActive,
        Instant expiresAt
) {
}
