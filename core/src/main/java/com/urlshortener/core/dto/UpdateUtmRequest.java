package com.urlshortener.core.dto;

public record UpdateUtmRequest(
        String name,
        String utmSource,
        String utmMedium,
        String utmCampaign,
        String utmTerm,
        String utmContent
) {
}
