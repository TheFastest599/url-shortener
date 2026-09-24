package com.urlshortener.core.repository;

import java.util.UUID;

public record UrlResolutionRecord(
        String shortCode,
        String destinationUrl,
        Boolean isActive,
        Boolean isAbTest,
        String smartRules,
        UUID urlId,
        UUID campaignId,
        UUID testId,
        String testStatus,
        String winningVariant,
        Integer cookieTtlSeconds,
        String variantKey,
        String variantUrl,
        Integer variantWeight,
        Boolean variantIsControl
) implements UrlResolutionProjection {
    @Override public String getShortCode() { return shortCode; }
    @Override public String getDestinationUrl() { return destinationUrl; }
    @Override public Boolean getIsActive() { return isActive; }
    @Override public Boolean getIsAbTest() { return isAbTest; }
    @Override public String getSmartRules() { return smartRules; }
    @Override public UUID getUrlId() { return urlId; }
    @Override public UUID getCampaignId() { return campaignId; }
    @Override public UUID getTestId() { return testId; }
    @Override public String getTestStatus() { return testStatus; }
    @Override public String getWinningVariant() { return winningVariant; }
    @Override public Integer getCookieTtlSeconds() { return cookieTtlSeconds; }
    @Override public String getVariantKey() { return variantKey; }
    @Override public String getVariantUrl() { return variantUrl; }
    @Override public Integer getVariantWeight() { return variantWeight; }
    @Override public Boolean getVariantIsControl() { return variantIsControl; }
}
