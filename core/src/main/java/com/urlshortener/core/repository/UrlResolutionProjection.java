package com.urlshortener.core.repository;

import java.util.UUID;

/**
 * High-performance joint projection returning all short code resolution metadata
 * across url_mappings, ab_tests, and ab_variants in a single SQL query.
 */
public interface UrlResolutionProjection {
    String getShortCode();
    String getDestinationUrl();
    Boolean getIsActive();
    Boolean getIsAbTest();
    String getSmartRules();
    UUID getUrlId();
    UUID getCampaignId();

    // A/B Test fields (null if no active test)
    UUID getTestId();
    String getTestStatus();
    String getWinningVariant();
    Integer getCookieTtlSeconds();

    // A/B Variant fields (null if no variants)
    String getVariantKey();
    String getVariantUrl();
    Integer getVariantWeight();
    Boolean getVariantIsControl();
}
