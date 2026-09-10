package com.urlshortener.analytics.dto;

import java.time.Instant;

public record ClickEvent(
        String shortCode,
        Instant timestamp,
        String ipAddress,
        String userAgent,
        String referrer,
        String variant,
        String utmSource,
        String utmMedium,
        String utmCampaign
) {}
