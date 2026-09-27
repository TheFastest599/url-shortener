package com.urlshortener.core.dto;

import com.urlshortener.core.entity.AbTest;
import com.urlshortener.core.entity.AbVariant;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AbTestResponse(
        UUID id,
        UUID urlMappingId,
        String shortCode,
        String destinationUrl,
        String name,
        String status,
        String winningVariant,
        Integer cookieTtlSeconds,
        List<VariantDto> variants,
        Instant createdAt,
        Instant updatedAt
) {
    public record VariantDto(
            UUID id,
            String key,
            String destinationUrl,
            int weight,
            boolean isControl
    ) {
        public static VariantDto from(AbVariant v) {
            return new VariantDto(v.getId(), v.getVariantKey(), v.getDestinationUrl(), v.getWeight(), v.getIsControl());
        }
    }

    public static AbTestResponse from(AbTest test, List<AbVariant> variants, String shortCode, String destinationUrl) {
        return new AbTestResponse(
                test.getId(),
                test.getUrlMappingId(),
                shortCode,
                destinationUrl,
                test.getName(),
                test.getStatus(),
                test.getWinningVariant(),
                test.getCookieTtlSeconds(),
                variants != null ? variants.stream().map(VariantDto::from).toList() : List.of(),
                test.getCreatedAt(),
                test.getUpdatedAt()
        );
    }

    public static AbTestResponse from(AbTest test, List<AbVariant> variants) {
        return from(test, variants, null, null);
    }
}
