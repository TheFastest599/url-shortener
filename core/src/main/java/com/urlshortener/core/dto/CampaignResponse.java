package com.urlshortener.core.dto;

import com.urlshortener.core.entity.Campaign;

import java.time.Instant;
import java.util.UUID;

public record CampaignResponse(
        UUID id,
        String name,
        String description,
        long linkCount,
        Instant createdAt,
        Instant updatedAr
) {
    public static CampaignResponse from(Campaign c, long linkCount) {
        return new CampaignResponse(
                c.getId(),
                c.getName(),
                c.getDescription(),
                linkCount,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
