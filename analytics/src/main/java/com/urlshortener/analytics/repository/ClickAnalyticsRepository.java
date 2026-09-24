package com.urlshortener.analytics.repository;

import com.urlshortener.analytics.entity.ClickAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA Repository for basic ClickAnalytics entity CRUD operations.
 * For complex aggregations, time-series, and reporting queries, see {@link ClickAnalyticsQueryRepository} (jOOQ).
 * For high-throughput bulk ingestion, see {@link ClickAnalyticsBatchRepository} (JDBC batch).
 */
@Repository
public interface ClickAnalyticsRepository extends JpaRepository<ClickAnalytics, UUID> {

    long countByShortCode(String shortCode);

    long countByCampaignId(UUID campaignId);

    long countByAbTestId(UUID abTestId);

    long countByUrlId(UUID urlId);
}
