package com.urlshortener.redirect;

public record ClickEventPayload(
    String shortCode,
    Long utmProfileId,
    String visitorId,
    String userAgent,
    String referrer,
    String ipAddress,
    String locale,
    long timestamp,
    String utmSource,
    String utmMedium,
    String utmCampaign,
    String utmTerm,
    String utmContent
) {}
