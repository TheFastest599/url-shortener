# Hands-On Guide: Building the Analytics Service (`url-analytics-service`)

Welcome! This document is a complete, step-by-step hands-on guide for building the **Analytics Microservice** (`url-analytics-service`).

The Analytics service listens asynchronously to click events published on the Apache Kafka topic **`url-clicks`**, parses device/browser metadata (using User-Agent parsers) and GeoIP country data, stores detailed click logs in PostgreSQL database **`url_shortener_analytics`**, and serves high-performance analytics reporting REST endpoints on port **8083**.

---

## Table of Contents
1. [Key Concepts & Architecture](#1-key-concepts--architecture)
2. [Module 1: Database Schema Setup (`url_shortener_analytics`)](#module-1-database-schema-setup-url_shortener_analytics)
3. [Module 2: JPA Entities, Projections & Repositories](#module-2-jpa-entities-projections--repositories)
4. [Module 3: Kafka Consumer & User-Agent Metadata Parser](#module-3-kafka-consumer--user-agent-metadata-parser)
5. [Module 4: Analytics Query Service & REST Controller](#module-4-analytics-query-service--rest-controller)
6. [Module 5: Step-by-Step Testing & Verification Guide](#module-5-step-by-step-testing--verification-guide)

---

## 1. Key Concepts & Architecture

```text
Kafka Topic ("url-clicks") ──► [ Kafka @KafkaListener Consumer ]
                                             │
                                             ▼
                                  [ User-Agent & GeoIP Parser ]
                                             │
                                             ▼
                              [ PostgreSQL: url_shortener_analytics ]
                                             │
                                             ▼
                              [ GET /api/v1/analytics/summary/{code} ]
```

* **Asynchronous Event Consumption:** Consumes click events off Kafka without blocking user redirections.
* **Metadata Extraction:** Extracts Device Type (`Mobile`, `Desktop`, `Tablet`), OS (`iOS`, `Android`, `Windows`), and Browser (`Chrome`, `Safari`, `Firefox`).
* **Database Isolation:** Operates strictly on `url_shortener_analytics` database (Port `5432`).

---

## Module 1: Database Schema Setup (`url_shortener_analytics`)

Create Flyway migration at `analytics/src/main/resources/db/migration/V1__init_analytics_schema.sql`.

```sql
-- V1__init_analytics_schema.sql: Analytics Database Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS click_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    operating_system VARCHAR(50),
    geo_country VARCHAR(100),
    geo_city VARCHAR(100),
    referrer TEXT,
    is_bot BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_click_analytics_short_code ON click_analytics(short_code);
CREATE INDEX IF NOT EXISTS idx_click_analytics_timestamp ON click_analytics(timestamp);
```

---

## Module 2: JPA Entities, Projections & Repositories

### 1. `ClickAnalytics.java` Entity
File: `analytics/src/main/java/com/urlshortener/analytics/entity/ClickAnalytics.java`

```java
package com.urlshortener.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "click_analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClickAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "short_code", nullable = false, length = 10)
    private String shortCode;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "browser")
    private String browser;

    @Column(name = "operating_system")
    private String operatingSystem;

    @Column(name = "geo_country")
    private String geoCountry;

    @Column(name = "geo_city")
    private String geoCity;

    @Column(name = "referrer", columnDefinition = "TEXT")
    private String referrer;

    @Column(name = "is_bot", nullable = false)
    private Boolean isBot;
}
```

---

### 2. Spring Data Projections for Complex SQL Aggregations

File: `analytics/src/main/java/com/urlshortener/analytics/repository/projection/TimeSeriesProjection.java`
```java
package com.urlshortener.analytics.repository.projection;

public interface TimeSeriesProjection {
    String getLabel();
    long getCount();
}
```

File: `analytics/src/main/java/com/urlshortener/analytics/repository/projection/StatProjection.java`
```java
package com.urlshortener.analytics.repository.projection;

public interface StatProjection {
    String getName();
    long getCount();
}
```

File: `analytics/src/main/java/com/urlshortener/analytics/repository/projection/CityStatProjection.java`
```java
package com.urlshortener.analytics.repository.projection;

public interface CityStatProjection {
    String getCity();
    String getCountry();
    long getCount();
}
```

---

### 3. `ClickAnalyticsRepository.java` (High-Performance Aggregations)
File: `analytics/src/main/java/com/urlshortener/analytics/repository/ClickAnalyticsRepository.java`

```java
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
import java.util.UUID;

@Repository
public interface ClickAnalyticsRepository extends JpaRepository<ClickAnalytics, UUID> {

    long countByShortCode(String shortCode);

    @Query("SELECT COUNT(c) FROM ClickAnalytics c WHERE c.shortCode = :shortCode AND c.isBot = false")
    long countHumanClicksByShortCode(@Param("shortCode") String shortCode);

    @Query("SELECT COUNT(c) FROM ClickAnalytics c WHERE c.shortCode = :shortCode AND c.isBot = true")
    long countBotClicksByShortCode(@Param("shortCode") String shortCode);

    // --- TIME-SERIES GRAPH DATA ---

    @Query(value = """
        SELECT to_char(date_trunc('hour', timestamp), 'YYYY-MM-DD"T"HH24:00:00"Z"') AS label,
               COUNT(*) AS count
        FROM click_analytics
        WHERE short_code = :shortCode AND timestamp >= :since
        GROUP BY date_trunc('hour', timestamp)
        ORDER BY date_trunc('hour', timestamp) ASC
        """, nativeQuery = true)
    List<TimeSeriesProjection> findHourlyTimeSeries(@Param("shortCode") String shortCode, @Param("since") Instant since);

    @Query(value = """
        SELECT to_char(date_trunc('day', timestamp), 'YYYY-MM-DD') AS label,
               COUNT(*) AS count
        FROM click_analytics
        WHERE short_code = :shortCode AND timestamp >= :since
        GROUP BY date_trunc('day', timestamp)
        ORDER BY date_trunc('day', timestamp) ASC
        """, nativeQuery = true)
    List<TimeSeriesProjection> findDailyTimeSeries(@Param("shortCode") String shortCode, @Param("since") Instant since);

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
```

---

## Module 3: MaxMind GeoIP2 Resolution & Kafka Event Consumer

### 1. `ClickEvent.java` Event Payload DTO
File: `analytics/src/main/java/com/urlshortener/analytics/dto/ClickEvent.java`

```java
package com.urlshortener.analytics.dto;

import java.time.Instant;

public record ClickEvent(
        String shortCode,
        Instant timestamp,
        String ipAddress,
        String userAgent,
        String referrer
) {}
```

---

### 2. `GeoLocation.java` DTO & `GeoIpService.java` (MaxMind GeoIP2 Engine)

File: `analytics/src/main/java/com/urlshortener/analytics/dto/GeoLocation.java`
```java
package com.urlshortener.analytics.dto;

public record GeoLocation(
        String country,
        String city
) {}
```

File: `analytics/src/main/java/com/urlshortener/analytics/service/GeoIpService.java`
```java
package com.urlshortener.analytics.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import com.urlshortener.analytics.dto.GeoLocation;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.InetAddress;

@Slf4j
@Service
public class GeoIpService {

    private DatabaseReader databaseReader;

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("geoip/GeoLite2-City.mmdb");
            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream()) {
                    this.databaseReader = new DatabaseReader.Builder(inputStream).build();
                    log.info("MaxMind GeoLite2 Database loaded successfully.");
                }
            } else {
                log.warn("GeoLite2-City.mmdb not found in classpath. GeoIP lookups will use default fallback.");
            }
        } catch (Exception e) {
            log.warn("Failed to initialize MaxMind GeoIP reader: {}", e.getMessage());
        }
    }

    public GeoLocation resolve(String ipAddress) {
        // Guard Clause 1: Null or blank IP
        if (ipAddress == null || ipAddress.isBlank()) {
            return new GeoLocation("Unknown", "Unknown");
        }

        // Guard Clause 2: Localhost and Private Networks (RFC 1918)
        if (ipAddress.equals("127.0.0.1") || ipAddress.equals("0:0:0:0:0:0:0:1") || ipAddress.startsWith("192.168.") || ipAddress.startsWith("10.")) {
            return new GeoLocation("Localhost / Private Network", "Localhost");
        }

        // Guard Clause 3: Reader not available
        if (databaseReader == null) {
            return new GeoLocation("United States", "San Francisco"); // Graceful fallback
        }

        try {
            InetAddress ip = InetAddress.getByName(ipAddress);
            CityResponse response = databaseReader.city(ip);

            String country = (response.getCountry() != null && response.getCountry().getName() != null)
                    ? response.getCountry().getName()
                    : "Unknown";

            String city = (response.getCity() != null && response.getCity().getName() != null)
                    ? response.getCity().getName()
                    : "Unknown";

            return new GeoLocation(country, city);
        } catch (Exception e) {
            log.debug("GeoIP lookup failed for IP [{}]: {}", ipAddress, e.getMessage());
            return new GeoLocation("Unknown", "Unknown");
        }
    }
}
```

---

### 3. `ClickEventConsumer.java` (Event Consumer with Exact GeoIP & UA Parsing)
File: `analytics/src/main/java/com/urlshortener/analytics/kafka/ClickEventConsumer.java`

```java
package com.urlshortener.analytics.kafka;

import com.urlshortener.analytics.dto.ClickEvent;
import com.urlshortener.analytics.dto.GeoLocation;
import com.urlshortener.analytics.entity.ClickAnalytics;
import com.urlshortener.analytics.repository.ClickAnalyticsRepository;
import com.urlshortener.analytics.service.GeoIpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClickEventConsumer {

    private final ClickAnalyticsRepository repository;
    private final GeoIpService geoIpService;

    @KafkaListener(topics = "url-clicks", groupId = "analytics-group")
    public void consumeClickEvent(ClickEvent event) {
        if (event == null || event.shortCode() == null) {
            return;
        }

        String ua = event.userAgent() != null ? event.userAgent() : "";
        String uaLower = ua.toLowerCase();

        // 1. Device Type Detection
        String device = "Desktop";
        if (uaLower.contains("mobi") || uaLower.contains("android") || uaLower.contains("iphone")) {
            device = "Mobile";
        } else if (uaLower.contains("tablet") || uaLower.contains("ipad")) {
            device = "Tablet";
        }

        // 2. Browser Detection
        String browser = "Other";
        if (uaLower.contains("edg")) browser = "Edge";
        else if (uaLower.contains("chrome")) browser = "Chrome";
        else if (uaLower.contains("safari") && !uaLower.contains("chrome")) browser = "Safari";
        else if (uaLower.contains("firefox")) browser = "Firefox";
        else if (uaLower.contains("opera") || uaLower.contains("opr")) browser = "Opera";

        // 3. Operating System Detection
        String os = "Other";
        if (uaLower.contains("windows")) os = "Windows";
        else if (uaLower.contains("mac os") || uaLower.contains("macintosh")) os = "macOS";
        else if (uaLower.contains("android")) os = "Android";
        else if (uaLower.contains("iphone") || uaLower.contains("ipad") || uaLower.contains("ios")) os = "iOS";
        else if (uaLower.contains("linux")) os = "Linux";

        // 4. Bot Detection
        boolean isBot = uaLower.contains("bot") || uaLower.contains("crawler") || uaLower.contains("spider") 
                || uaLower.contains("curl") || uaLower.contains("wget") || uaLower.contains("python");

        // 5. Clean Referrer Domain
        String cleanReferrer = event.referrer();
        if (cleanReferrer == null || cleanReferrer.isBlank()) {
            cleanReferrer = "Direct / None";
        }

        // 6. Exact MaxMind GeoIP Resolution (Country & City)
        GeoLocation location = geoIpService.resolve(event.ipAddress());

        ClickAnalytics analytics = ClickAnalytics.builder()
                .shortCode(event.shortCode())
                .timestamp(event.timestamp() != null ? event.timestamp() : Instant.now())
                .userAgent(ua)
                .deviceType(device)
                .browser(browser)
                .operatingSystem(os)
                .geoCountry(location.country())
                .geoCity(location.city())
                .referrer(cleanReferrer)
                .isBot(isBot)
                .build();

        repository.save(analytics);
        log.info("Logged click for [{}] | Country: [{}] | City: [{}] | Device: [{}] | Browser: [{}]",
                event.shortCode(), location.country(), location.city(), device, browser);
    }
}
```

---

## Module 4: Analytics Query Service & REST Controller

### 1. Complex Reporting DTOs

File: `analytics/src/main/java/com/urlshortener/analytics/dto/TimeSeriesPoint.java`
```java
package com.urlshortener.analytics.dto;

public record TimeSeriesPoint(
        String timestamp,
        long clicks
) {}
```

File: `analytics/src/main/java/com/urlshortener/analytics/dto/StatMetricDto.java`
```java
package com.urlshortener.analytics.dto;

public record StatMetricDto(
        String name,
        long count,
        double percentage
) {}
```

File: `analytics/src/main/java/com/urlshortener/analytics/dto/CityStatDto.java`
```java
package com.urlshortener.analytics.dto;

public record CityStatDto(
        String city,
        String country,
        long count,
        double percentage
) {}
```

File: `analytics/src/main/java/com/urlshortener/analytics/dto/AnalyticsOverviewDto.java`
```java
package com.urlshortener.analytics.dto;

import java.util.List;

public record AnalyticsOverviewDto(
        String shortCode,
        long totalClicks,
        long humanClicks,
        long botClicks,
        double botPercentage,
        List<TimeSeriesPoint> timeSeries,
        List<StatMetricDto> topCountries,
        List<CityStatDto> topCities,
        List<StatMetricDto> topBrowsers,
        List<StatMetricDto> topOperatingSystems,
        List<StatMetricDto> topDeviceTypes,
        List<StatMetricDto> topReferrers
) {}
```

---

### 2. `AnalyticsService.java` (Negative Space Programming)
File: `analytics/src/main/java/com/urlshortener/analytics/service/AnalyticsService.java`

```java
package com.urlshortener.analytics.service;

import com.urlshortener.analytics.dto.AnalyticsOverviewDto;
import com.urlshortener.analytics.dto.CityStatDto;
import com.urlshortener.analytics.dto.StatMetricDto;
import com.urlshortener.analytics.dto.TimeSeriesPoint;
import com.urlshortener.analytics.repository.ClickAnalyticsRepository;
import com.urlshortener.analytics.repository.projection.CityStatProjection;
import com.urlshortener.analytics.repository.projection.StatProjection;
import com.urlshortener.analytics.repository.projection.TimeSeriesProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ClickAnalyticsRepository repository;

    public AnalyticsOverviewDto getOverview(String shortCode, int days, boolean includeBots) {
        long totalClicks = repository.countByShortCode(shortCode);

        // Guard Clause: If zero clicks, return clean empty dashboard structure immediately
        if (totalClicks == 0) {
            return new AnalyticsOverviewDto(
                    shortCode, 0, 0, 0, 0.0,
                    List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of()
            );
        }

        long humanClicks = repository.countHumanClicksByShortCode(shortCode);
        long botClicks = repository.countBotClicksByShortCode(shortCode);
        double botPercentage = Math.round(((double) botClicks / totalClicks) * 1000.0) / 10.0;

        long denominator = includeBots ? totalClicks : Math.max(humanClicks, 1);
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

        // Fetch time-series (hourly if <= 2 days, daily if > 2 days)
        List<TimeSeriesPoint> timeSeries = days <= 2
                ? mapTimeSeries(repository.findHourlyTimeSeries(shortCode, since))
                : mapTimeSeries(repository.findDailyTimeSeries(shortCode, since));

        List<StatMetricDto> countries = mapMetrics(repository.findTopCountries(shortCode, includeBots, 10), denominator);
        List<CityStatDto> cities = mapCityMetrics(repository.findTopCities(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> browsers = mapMetrics(repository.findTopBrowsers(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> os = mapMetrics(repository.findTopOperatingSystems(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> devices = mapMetrics(repository.findTopDeviceTypes(shortCode, includeBots, 10), denominator);
        List<StatMetricDto> referrers = mapMetrics(repository.findTopReferrers(shortCode, includeBots, 10), denominator);

        return new AnalyticsOverviewDto(
                shortCode,
                totalClicks,
                humanClicks,
                botClicks,
                botPercentage,
                timeSeries,
                countries,
                cities,
                browsers,
                os,
                devices,
                referrers
        );
    }

    public List<TimeSeriesPoint> getTimeSeries(String shortCode, String interval, int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);

        if ("HOUR".equalsIgnoreCase(interval)) {
            return mapTimeSeries(repository.findHourlyTimeSeries(shortCode, since));
        }
        return mapTimeSeries(repository.findDailyTimeSeries(shortCode, since));
    }

    public List<StatMetricDto> getCountries(String shortCode, boolean includeBots, int limit) {
        long total = repository.countByShortCode(shortCode);
        if (total == 0) return List.of();
        return mapMetrics(repository.findTopCountries(shortCode, includeBots, limit), total);
    }

    public List<StatMetricDto> getBrowsers(String shortCode, boolean includeBots, int limit) {
        long total = repository.countByShortCode(shortCode);
        if (total == 0) return List.of();
        return mapMetrics(repository.findTopBrowsers(shortCode, includeBots, limit), total);
    }

    public List<StatMetricDto> getReferrers(String shortCode, boolean includeBots, int limit) {
        long total = repository.countByShortCode(shortCode);
        if (total == 0) return List.of();
        return mapMetrics(repository.findTopReferrers(shortCode, includeBots, limit), total);
    }

    // --- Helper Mappers ---

    private List<TimeSeriesPoint> mapTimeSeries(List<TimeSeriesProjection> list) {
        return list.stream()
                .map(p -> new TimeSeriesPoint(p.getLabel(), p.getCount()))
                .toList();
    }

    private List<StatMetricDto> mapMetrics(List<StatProjection> list, long denominator) {
        return list.stream()
                .map(p -> {
                    double pct = Math.round(((double) p.getCount() / denominator) * 1000.0) / 10.0;
                    return new StatMetricDto(p.getName(), p.getCount(), pct);
                })
                .toList();
    }

    private List<CityStatDto> mapCityMetrics(List<CityStatProjection> list, long denominator) {
        return list.stream()
                .map(p -> {
                    double pct = Math.round(((double) p.getCount() / denominator) * 1000.0) / 10.0;
                    return new CityStatDto(p.getCity(), p.getCountry(), p.getCount(), pct);
                })
                .toList();
    }
}
```

---

### 3. `AnalyticsController.java` (REST API Endpoints)
File: `analytics/src/main/java/com/urlshortener/analytics/controller/AnalyticsController.java`

```java
package com.urlshortener.analytics.controller;

import com.urlshortener.analytics.dto.AnalyticsOverviewDto;
import com.urlshortener.analytics.dto.StatMetricDto;
import com.urlshortener.analytics.dto.TimeSeriesPoint;
import com.urlshortener.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Complete Dashboard Overview (Total clicks, human/bot ratio, time-series graph, top countries, devices, browsers, referrers)
     */
    @GetMapping("/{shortCode}")
    public ResponseEntity<AnalyticsOverviewDto> getOverview(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "false") boolean includeBots) {
        return ResponseEntity.ok(analyticsService.getOverview(shortCode, days, includeBots));
    }

    /**
     * Dedicated Time-Series Graph Data for Chart.js / Recharts / ApexCharts
     */
    @GetMapping("/{shortCode}/timeseries")
    public ResponseEntity<List<TimeSeriesPoint>> getTimeSeries(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "DAY") String interval,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(analyticsService.getTimeSeries(shortCode, interval, days));
    }

    /**
     * Top Countries for Interactive World Map
     */
    @GetMapping("/{shortCode}/countries")
    public ResponseEntity<List<StatMetricDto>> getCountries(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getCountries(shortCode, includeBots, limit));
    }

    /**
     * Browser Breakdown (Chrome, Safari, Firefox, Edge, etc.)
     */
    @GetMapping("/{shortCode}/browsers")
    public ResponseEntity<List<StatMetricDto>> getBrowsers(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getBrowsers(shortCode, includeBots, limit));
    }

    /**
     * Traffic Channels & Referrers (Twitter, LinkedIn, Direct, etc.)
     */
    @GetMapping("/{shortCode}/referrers")
    public ResponseEntity<List<StatMetricDto>> getReferrers(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "false") boolean includeBots,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getReferrers(shortCode, includeBots, limit));
    }
}
```

---

## Module 5: Step-by-Step Testing & Verification Guide

### 1. Query Comprehensive Analytics Overview (`GET /api/v1/analytics/{shortCode}`)
```bash
curl -X GET "http://localhost:8083/api/v1/analytics/xyz123?days=30&includeBots=false"
```

**Expected JSON Response (`HTTP 200 OK`):**
```json
{
  "shortCode": "xyz123",
  "totalClicks": 1420,
  "humanClicks": 1350,
  "botClicks": 70,
  "botPercentage": 4.9,
  "timeSeries": [
    { "timestamp": "2026-08-10", "clicks": 180 },
    { "timestamp": "2026-08-11", "clicks": 240 },
    { "timestamp": "2026-08-12", "clicks": 310 }
  ],
  "topCountries": [
    { "name": "United States", "count": 850, "percentage": 63.0 },
    { "name": "India", "count": 300, "percentage": 22.2 }
  ],
  "topCities": [
    { "city": "San Francisco", "country": "United States", "count": 450, "percentage": 33.3 },
    { "city": "Bengaluru", "country": "India", "count": 210, "percentage": 15.5 }
  ],
  "topBrowsers": [
    { "name": "Chrome", "count": 980, "percentage": 72.6 },
    { "name": "Safari", "count": 270, "percentage": 20.0 }
  ],
  "topOperatingSystems": [
    { "name": "macOS", "count": 620, "percentage": 45.9 },
    { "name": "Windows", "count": 480, "percentage": 35.6 },
    { "name": "iOS", "count": 250, "percentage": 18.5 }
  ],
  "topDeviceTypes": [
    { "name": "Desktop", "count": 1050, "percentage": 77.8 },
    { "name": "Mobile", "count": 300, "percentage": 22.2 }
  ],
  "topReferrers": [
    { "name": "https://t.co", "count": 720, "percentage": 53.3 },
    { "name": "https://linkedin.com", "count": 410, "percentage": 30.4 },
    { "name": "Direct / None", "count": 220, "percentage": 16.3 }
  ]
}
```

---

## Summary
The Analytics Service provides:
1. **Asynchronous Kafka Event Consumer (`url-clicks`)**.
2. **Metadata Extraction:** Device type, Browser, OS, Bot flags, and Referrer cleanup.
3. **High-Performance PostgreSQL Aggregation Queries** with native `date_trunc` time-series projections.
4. **Rich Analytics Reporting API (`/api/v1/analytics/**`)** for rendering time-series graphs, world maps, donut charts, and audience quality breakdowns on port **8083**.
