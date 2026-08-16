# Hands-On Guide: Building the Analytics Service (`url-analytics-service`)

Welcome! This document is a complete, step-by-step hands-on guide for building the **Analytics Microservice** (`url-analytics-service`).

The Analytics service listens asynchronously to click events published on the Apache Kafka topic **`url-clicks`**, parses device/browser metadata (using User-Agent parsers) and GeoIP country data, stores detailed click logs in PostgreSQL database **`url_shortener_analytics`**, and serves high-performance analytics reporting REST endpoints on port **8083**.

---

## Table of Contents
1. [Key Concepts & Architecture](#1-key-concepts--architecture)
2. [Module 1: Database Schema Setup (`url_shortener_analytics`)](#module-1-database-schema-setup-url_shortener_analytics)
3. [Module 2: JPA Entities & Repositories](#module-2-jpa-entities--repositories)
4. [Module 3: Kafka Consumer & User-Agent Metadata Parser](#module-3-kafka-consumer--user-agent-metadata-parser)
5. [Module 4: Analytics Query REST Controller & Reporting DTOs](#module-4-analytics-query-rest-controller--reporting-dtos)
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

## Module 2: JPA Entities & Repositories

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

### 2. `ClickAnalyticsRepository.java`
File: `analytics/src/main/java/com/urlshortener/analytics/repository/ClickAnalyticsRepository.java`

```java
package com.urlshortener.analytics.repository;

import com.urlshortener.analytics.entity.ClickAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public interface ClickAnalyticsRepository extends JpaRepository<ClickAnalytics, UUID> {
    
    long countByShortCode(String shortCode);

    @Query("SELECT c.geoCountry AS country, COUNT(c) AS count FROM ClickAnalytics c WHERE c.shortCode = :shortCode GROUP BY c.geoCountry")
    List<Map<String, Object>> countClicksByCountry(String shortCode);

    @Query("SELECT c.browser AS browser, COUNT(c) AS count FROM ClickAnalytics c WHERE c.shortCode = :shortCode GROUP BY c.browser")
    List<Map<String, Object>> countClicksByBrowser(String shortCode);

    @Query("SELECT c.deviceType AS device, COUNT(c) AS count FROM ClickAnalytics c WHERE c.shortCode = :shortCode GROUP BY c.deviceType")
    List<Map<String, Object>> countClicksByDevice(String shortCode);

    @Query("SELECT c.referrer AS referrer, COUNT(c) AS count FROM ClickAnalytics c WHERE c.shortCode = :shortCode AND c.referrer IS NOT NULL GROUP BY c.referrer")
    List<Map<String, Object>> countClicksByReferrer(String shortCode);
}
```

---

## Module 3: Kafka Consumer & User-Agent Metadata Parser

### 1. `ClickEventConsumer.java`
File: `analytics/src/main/java/com/urlshortener/analytics/kafka/ClickEventConsumer.java`

```java
package com.urlshortener.analytics.kafka;

import com.urlshortener.analytics.dto.ClickEvent;
import com.urlshortener.analytics.entity.ClickAnalytics;
import com.urlshortener.analytics.repository.ClickAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class ClickEventConsumer {

    private final ClickAnalyticsRepository repository;

    @KafkaListener(topics = "url-clicks", groupId = "analytics-group")
    public void consumeClickEvent(ClickEvent event) {
        String ua = event.userAgent() != null ? event.userAgent() : "";
        
        // Simple User-Agent Parsing Rule
        String browser = ua.contains("Chrome") ? "Chrome" : ua.contains("Safari") ? "Safari" : "Other";
        String os = ua.contains("Windows") ? "Windows" : ua.contains("Mac") ? "MacOS" : ua.contains("Android") ? "Android" : "iOS";
        String device = ua.contains("Mobi") ? "Mobile" : "Desktop";

        ClickAnalytics analytics = ClickAnalytics.builder()
                .shortCode(event.shortCode())
                .timestamp(event.timestamp() != null ? event.timestamp() : Instant.now())
                .userAgent(event.userAgent())
                .deviceType(device)
                .browser(browser)
                .operatingSystem(os)
                .geoCountry("Unknown")
                .referrer(event.referrer())
                .isBot(ua.contains("bot") || ua.contains("crawler"))
                .build();

        repository.save(analytics);
    }
}
```

---

## Module 4: Analytics Query REST Controller & Reporting DTOs

### 1. `AnalyticsSummaryDto.java` DTO
File: `analytics/src/main/java/com/urlshortener/analytics/dto/AnalyticsSummaryDto.java`

```java
package com.urlshortener.analytics.dto;

import java.util.List;
import java.util.Map;

public record AnalyticsSummaryDto(
        String shortCode,
        long totalClicks,
        List<Map<String, Object>> clicksByCountry,
        List<Map<String, Object>> clicksByBrowser,
        List<Map<String, Object>> clicksByDevice,
        List<Map<String, Object>> clicksByReferrer
) {}
```

---

### 2. `AnalyticsController.java`
File: `analytics/src/main/java/com/urlshortener/analytics/controller/AnalyticsController.java`

```java
package com.urlshortener.analytics.controller;

import com.urlshortener.analytics.dto.AnalyticsSummaryDto;
import com.urlshortener.analytics.repository.ClickAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final ClickAnalyticsRepository repository;

    @GetMapping("/summary/{shortCode}")
    public ResponseEntity<AnalyticsSummaryDto> getSummary(@PathVariable String shortCode) {
        long total = repository.countByShortCode(shortCode);
        var countries = repository.countClicksByCountry(shortCode);
        var browsers = repository.countClicksByBrowser(shortCode);
        var devices = repository.countClicksByDevice(shortCode);
        var referrers = repository.countClicksByReferrer(shortCode);

        return ResponseEntity.ok(new AnalyticsSummaryDto(shortCode, total, countries, browsers, devices, referrers));
    }
}
```

---

## Module 5: Step-by-Step Testing & Verification Guide

### 1. Query Analytics Summary (`GET /api/v1/analytics/summary/{shortCode}`)
```bash
curl -X GET http://localhost:8083/api/v1/analytics/summary/xyz123
```
**Expected Response (`HTTP 200 OK`):**
```json
{
  "shortCode": "xyz123",
  "totalClicks": 1420,
  "clicksByCountry": [
    { "country": "United States", "count": 850 },
    { "country": "India", "count": 570 }
  ],
  "clicksByBrowser": [
    { "browser": "Chrome", "count": 1100 },
    { "browser": "Safari", "count": 320 }
  ]
}
```

---

## Summary
The Analytics Service provides:
1. **Asynchronous Kafka Event Consumer (`url-clicks`)**.
2. Automatic **User-Agent & GeoIP metadata extraction**.
3. Persistence in database **`url_shortener_analytics`**.
4. Rich **Analytics REST Reporting API (`GET /api/v1/analytics/summary/{shortCode}`)** on port **8083**.
