package com.urlshortener.analytics.repository;

import com.urlshortener.analytics.entity.ClickAnalytics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * ClickAnalyticsBatchRepository
 * High-throughput multi-row JDBC batch repository.
 * Leverages PostgreSQL's reWriteBatchedInserts=true to execute bulk inserts
 * in a single round-trip database query.
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class ClickAnalyticsBatchRepository {

    private final JdbcTemplate jdbcTemplate;

    private static final String SQL_BULK_INSERT = """
        INSERT INTO click_analytics (
            id, short_code, timestamp, user_agent, device_type, browser,
            operating_system, geo_country, geo_city, referrer, variant,
            utm_source, utm_medium, utm_campaign, is_bot, url_id, campaign_id, ab_test_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """;

    @Transactional
    public void bulkInsert(List<ClickAnalytics> records) {
        if (records == null || records.isEmpty()) {
            return;
        }

        long start = System.currentTimeMillis();

        jdbcTemplate.batchUpdate(SQL_BULK_INSERT, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ClickAnalytics c = records.get(i);
                ps.setObject(1, c.getId() != null ? c.getId() : UUID.randomUUID());
                ps.setString(2, c.getShortCode());
                ps.setTimestamp(3, Timestamp.from(c.getTimestamp() != null ? c.getTimestamp() : Instant.now()));
                ps.setString(4, c.getUserAgent());
                ps.setString(5, c.getDeviceType());
                ps.setString(6, c.getBrowser());
                ps.setString(7, c.getOperatingSystem());
                ps.setString(8, c.getGeoCountry());
                ps.setString(9, c.getGeoCity());
                ps.setString(10, c.getReferrer());
                ps.setString(11, c.getVariant());
                ps.setString(12, c.getUtmSource());
                ps.setString(13, c.getUtmMedium());
                ps.setString(14, c.getUtmCampaign());
                ps.setBoolean(15, Boolean.TRUE.equals(c.getIsBot()));
                setUuidOrNull(ps, 16, c.getUrlId());
                setUuidOrNull(ps, 17, c.getCampaignId());
                setUuidOrNull(ps, 18, c.getAbTestId());
            }

            @Override
            public int getBatchSize() {
                return records.size();
            }
        });

        long duration = System.currentTimeMillis() - start;
        log.info("Bulk-inserted [{}] click analytics records into PostgreSQL in [{} ms]", records.size(), duration);
    }

    private void setUuidOrNull(PreparedStatement ps, int paramIndex, UUID uuid) throws SQLException {
        if (uuid != null) {
            ps.setObject(paramIndex, uuid);
        } else {
            ps.setNull(paramIndex, Types.OTHER);
        }
    }
}
