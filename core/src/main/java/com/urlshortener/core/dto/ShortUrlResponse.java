package com.urlshortener.core.dto;

import com.urlshortener.core.entity.UrlMapping;

import java.time.Instant;
import java.util.UUID;

public record ShortUrlResponse(
        UUID id,
        String shortCode,
        String destinationUrl,
        UUID campaignId,
        String campaignName,
        Boolean isAbTest,
        UUID abTestId,
        String abTestName,
        String abTestStatus,
        String smartRules,
        String tenantId,
        UUID userId,
        Boolean isActive,
        Instant expiresAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static ShortUrlResponse from(UrlMapping u, String campaignName, UUID abTestId, String abTestName, String abTestStatus) {
        return new ShortUrlResponse(
                u.getId(),
                u.getShortCode(),
                u.getDestinationUrl(),
                u.getCampaignId(),
                campaignName,
                u.getIsAbTest(),
                abTestId,
                abTestName,
                abTestStatus,
                u.getSmartRules(),
                u.getTenantId(),
                u.getUserId(),
                u.getIsActive(),
                u.getExpiresAt(),
                u.getCreatedAt(),
                u.getUpdatedAt()
        );
    }
}
