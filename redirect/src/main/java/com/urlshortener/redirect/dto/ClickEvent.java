package com.urlshortener.redirect.dto;

import java.time.Instant;

public record ClickEvent(
        String shortCode,
        Instant timestamp,
        String ipAddress,
        String userAgent,
        String referrer
) {}
