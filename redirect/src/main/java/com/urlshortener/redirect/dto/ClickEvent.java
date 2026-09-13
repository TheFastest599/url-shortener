package com.urlshortener.redirect.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
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
