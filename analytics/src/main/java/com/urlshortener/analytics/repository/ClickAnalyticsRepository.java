package com.urlshortener.analytics.repository;


import com.urlshortener.analytics.entity.ClickAnalytics;
import com.urlshortener.analytics.repository.projection.CityStatProjection;
import com.urlshortener.analytics.repository.projection.StatProjection;
import com.urlshortener.analytics.repository.projection.TimeSeriesProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public interface ClickAnalyticsRepository extends JpaRepository<ClickAnalytics, UUID> {

    long countByShortCode(String shortCode);


    @Query("SELECT COUNT(c) FROM ClickAnalytics c WHERE c.shortCode = :shortCode AND c.isBot = false")
    long countHumanClicksByShortCode(@Param("shortCode") String shortCode);


    @Query("SELECT COUNT(c) FROM ClickAnalytics c WHERE c.shortCode = :shortCode AND c.isBot = true")
    long countBotClicksByShortCode(@Param("shortCode") String shortCode);

//    --- TIME-SERIES GRAPH DATA ---
    @Query(value = """
        SELECT to_char(date_trunc('hour', timestamp), 'YYYY-MM-DD"T"HH24:00:00"Z"') AS label,
        COUNT(*) AS count
        FROM click_analytics
        WHERE short_code = :shortCode AND timestamp >= :since
        GROUP BY date_trunc('hour', timestamp)
        ORDER BY date_trunc('hour', timestamp) ASC
""",nativeQuery = true )
    List<TimeSeriesProjection> findHourlyTimeSeries(@Param("shortCode") String shortCode, @Param("since")Instant since);

    @Query(value = """
        SELECT to_char(date_trunc('day', timestamp), 'YYYY-MM-DD"T"HH24:00:00"Z"') AS label,
        COUNT(*) AS count
        FROM click_analytics
        WHERE short_code = :shortCode AND timestamp >= :since
        GROUP BY date_trunc('day', timestamp)
        ORDER BY date_trunc('day', timestamp) ASC
""",nativeQuery = true )
    List<TimeSeriesProjection> findDailyTimeSeries(@Param("shortCode") String shortCode, @Param("since")Instant since);


    // --- CATEGORICAL METRICS ---

    @Query(value = """
    SELECT COALESCE(geo_country, 'Unknown') AS name, COUNT(*) AS count
    FROM click_analytics
    WHERE short_code = :shortCode AND (:includeBots = true OR is_bot = false)
    GROUP BY geo_country
    ORDER BY count DESC
    LIMIT :limit
    """, nativeQuery = true)
    List<StatProjection> findTopCountries(@Param("shortCode") String shortCode, @Param("includeBots") boolean includeBots, @Param("limit") int limit);

    @Query(value = """
    SELECT COALESCE(geo_city, 'Unknown') AS city, COALESCE(geo_country, 'Unknown') AS country, COUNT(*) AS count
    FROM click_analytics
    WHERE short_code = :shortCode AND geo_city IS NOT NULL AND (:includeBots = true OR is_bot = false)
    GROUP BY geo_city, geo_country
    ORDER BY count DESC
    LIMIT :limit
    """, nativeQuery = true)
    List<CityStatProjection> findTopCities(@Param("shortCode") String shortCode, @Param("includeBots") boolean includeBots, @Param("limit") int limit);

    @Query(value = """
    SELECT COALESCE(browser, 'Other') AS name, COUNT(*) AS count
    FROM click_analytics
    WHERE short_code = :shortCode AND (:includeBots = true OR is_bot = false)
    GROUP BY browser
    ORDER BY count DESC
    LIMIT :limit
    """, nativeQuery = true)
    List<StatProjection> findTopBrowsers(@Param("shortCode") String shortCode, @Param("includeBots") boolean includeBots, @Param("limit") int limit);

    @Query(value = """
    SELECT COALESCE(operating_system, 'Other') AS name, COUNT(*) AS count
    FROM click_analytics
    WHERE short_code = :shortCode AND (:includeBots = true OR is_bot = false)
    GROUP BY operating_system
    ORDER BY count DESC
    LIMIT :limit
    """, nativeQuery = true)
    List<StatProjection> findTopOperatingSystems(@Param("shortCode") String shortCode, @Param("includeBots") boolean includeBots, @Param("limit") int limit);

    @Query(value = """
    SELECT COALESCE(device_type, 'Desktop') AS name, COUNT(*) AS count
    FROM click_analytics
    WHERE short_code = :shortCode AND (:includeBots = true OR is_bot = false)
    GROUP BY device_type
    ORDER BY count DESC
    LIMIT :limit
    """, nativeQuery = true)
    List<StatProjection> findTopDeviceTypes(@Param("shortCode") String shortCode, @Param("includeBots") boolean includeBots, @Param("limit") int limit);

    @Query(value = """
    SELECT COALESCE(referrer, 'Direct / None') AS name, COUNT(*) AS count
    FROM click_analytics
    WHERE short_code = :shortCode AND (:includeBots = true OR is_bot = false)
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT :limit
    """, nativeQuery = true)
    List<StatProjection> findTopReferrers(@Param("shortCode") String shortCode, @Param("includeBots") boolean includeBots, @Param("limit") int limit);
}
