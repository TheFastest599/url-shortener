package com.urlshortener.redirect.dto;

import java.time.Instant;

public record ClickEvent(
        String shortCode,
        String userAgent,
        String ipAddress,
        String referrer,
        Instant timestamp
) {
}
