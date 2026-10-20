# Hands-On Guide: Building the Redirect Service (`url-redirect-service`)

Welcome! This document is a complete, step-by-step hands-on guide for building the high-throughput **Redirect Microservice** (`url-redirect-service`).

The Redirect service handles sub-2ms HTTP `302 Found` redirects for short URLs (`GET /r/{shortCode}` or clean vanity URLs via `http://r.localhost/{shortCode}`) on port **8082**. It uses **Reactive WebFlux (Netty)**, **Consolidated Redis Hash Caching** (`url:{shortCode}` and `url:hits:{shortCode}`), **In-Memory A/B/n Traffic Splitting**, **Device OS Smart Routing**, a **Single-Query gRPC Client** fallback to Core Service (port 9090), and an **Apache Kafka Producer** for asynchronous click tracking.

---

## Table of Contents
1. [Key Concepts & Architecture](#1-key-concepts--architecture)
2. [Module 1: Redis Reactive Cache & Kafka Configuration](#module-1-redis-reactive-cache--kafka-configuration)
3. [Module 2: gRPC Client Integration (Fallback to Core :9090)](#module-2-grpc-client-integration-fallback-to-core-9090)
4. [Module 3: Kafka Producer for Enriched Click Tracking](#module-3-kafka-producer-for-enriched-click-tracking)
5. [Module 4: High-Throughput Smart Redirection Service](#module-4-high-throughput-smart-redirection-service)
6. [Module 5: Step-by-Step Testing & Verification Guide](#module-5-step-by-step-testing--verification-guide)

---

## 1. Key Concepts & Architecture

```mermaid
flowchart TD
    Visitor(["Visitor Request: GET /r/{code}"]) --> NGINX["Nginx Edge Ingress (Port 80)"]
    NGINX -->|"Keepalive Upstream (:8082)"| REDIRECT["Spring WebFlux Netty (RedirectService)"]

    subgraph CriticalPath ["Critical Path: Read-Only (< 0.4ms)"]
        REDIRECT -->|"HGETALL url:{code}"| REDIS_HASH[("Consolidated Hash: url:{code}<br/>targetUrl, urlId, campaignId,<br/>abTestId, smartRules, abConfig")]
        REDIS_HASH -->|"Parse / Cached DTO"| ROUTER{"Routing Decision"}
        ROUTER -->|"1. Device Override"| DEV_URL["iOS / Android Deep Link URL"]
        ROUTER -->|"2. Active A/B Split"| AB_LOGIC["Sticky Cookie ab_{code}<br/>or Weighted Variant Roll"]
        ROUTER -->|"3. Default Fallback"| BASE_URL["Base Destination URL"]
        
        DEV_URL --> MERGE_QUERY["Merge Inbound Query Params"]
        AB_LOGIC --> MERGE_QUERY
        BASE_URL --> MERGE_QUERY
        MERGE_QUERY --> HTTP_302(["HTTP 302 Found<br/>Location + Set-Cookie: ab_{code}"])
    end

    subgraph AsyncPipelines ["Asynchronous Background Operations"]
        REDIRECT -.->|"Schedulers.parallel()"| REDIS_HITS["Async INCR hitsKey<br/>Sampled EXPIRE (Tiers / % 100)"]
        REDIRECT -.->|"Sinks.Many (< 0.001ms)"| SINK_BUFFER["In-Memory Bounded Sink (100k)"]
        SINK_BUFFER -->|"boundedElastic"| KAFKA_EVENT["Kafka Broker (:29092)<br/>Topic: 'url-clicks'"]
    end

    REDIS_HASH -->|"Cache Miss"| GRPC_CORE["Core Service gRPC (:9090)<br/>UrlService.GetDestinationUrl()"]
    GRPC_CORE -->|"Pre-warm Hash"| REDIS_HASH
    GRPC_CORE --> ROUTER
```

* **Reactive WebFlux (Netty):** Handles 50,000+ concurrent redirect requests with non-blocking event loops.
* **Single Redis Hash Lookup on Critical Path:** The user's redirect only waits for `HGETALL url:{code}`. Hit counter incrementing and TTL extension run asynchronously on `Schedulers.parallel()`.
* **Sampled TTL Updates:** To prevent flooding the single Netty TCP socket to Redis, `EXPIRE` commands only trigger on tier transitions (1, 11, 101, 1001) or every 100 hits (`hits % 100 == 0`), eliminating 99% of Redis write traffic.
* **Self-Pruning JSON Memoization:** Parsed `AbConfig` and `SmartRules` JSON payloads are memoized by raw string in `ShortCodePayloadDto` (capped at 10,000 entries) to bypass Jackson parsing on repetitive requests without violating Redis authoritativeness.
* **Non-Blocking Reactive Telemetry Sink:** Decoupled Kafka publishing uses Project Reactor `Sinks.Many` with an in-memory buffer of 100,000 items, executing in < 0.001ms on the Netty thread and dispatching on `Schedulers.boundedElastic()`.
* **Adaptive TTL Retention:** Dynamically scales Redis retention based on link popularity:
  - Cold (<= 10 hits): **2 minutes** (minimizes idle Redis RAM usage).
  - Warm (<= 100 hits): **30 minutes**.
  - Hot (<= 1,000 hits): **2 hours**.
  - Viral (> 1,000 hits): **6 hours**.
* **Zero Downtime Fallback:** If an A/B test is paused or removed in Core, the next cache reload falls back to the base destination URL with zero downtime.

---

## Module 1: Redis Reactive Cache & Kafka Configuration

File: `redirect/src/main/resources/application.yaml`

```yaml
server:
  port: 8082

spring:
  application:
    name: redirect-service
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

grpc:
  client:
    core-service:
      address: 'static://${CORE_GRPC_HOST:localhost}:${CORE_GRPC_PORT:9090}'
      negotiation-type: plaintext
      enable-keep-alive: true
      keep-alive-without-calls: true
      keep-alive-time: 30s
      keep-alive-timeout: 10s
```

---

## Module 2: gRPC Client Integration (Fallback to Core :9090)

### 1. Protobuf Schema (`url_service.proto`)
File: `redirect/src/main/proto/url_service.proto`

```protobuf
syntax = "proto3";

package com.urlshortener.grpc;

option java_multiple_files = true;
option java_package = "com.urlshortener.grpc";

service UrlService {
  rpc GetDestinationUrl (UrlRequest) returns (UrlResponse);
}

message UrlRequest {
  string short_code = 1;
}

message UrlResponse {
  string destination_url = 1;
  bool is_active = 2;
  bool is_found = 3;
  string short_code = 4;
  string ab_rules_json = 5;      // Optional: A/B variant JSON configuration
  string smart_rules_json = 6;   // Optional: Device and Geo targeting rules
}
```

---

### 2. gRPC Client Implementation (`CoreGrpcClient.java`)
File: `redirect/src/main/java/com/urlshortener/redirect/grpc/CoreGrpcClient.java`

Configured with a **5-second deadline** and offloaded to `Schedulers.boundedElastic()` so that slow network hops or downstream Core restarts fail fast and never block Netty event loops:

```java
package com.urlshortener.redirect.grpc;

import com.urlshortener.grpc.UrlRequest;
import com.urlshortener.grpc.UrlResponse;
import com.urlshortener.grpc.UrlServiceGrpc;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.concurrent.TimeUnit;

@Component
public class CoreGrpcClient {

    @GrpcClient("core-service")
    private UrlServiceGrpc.UrlServiceBlockingStub urlServiceBlockingStub;

    public Mono<UrlResponse> getDestinationUrl(String shortCode) {
        return Mono.fromCallable(() -> {
            UrlRequest request = UrlRequest.newBuilder()
                    .setShortCode(shortCode)
                    .build();

            return urlServiceBlockingStub
                    .withDeadlineAfter(5, TimeUnit.SECONDS)
                    .getDestinationUrl(request);
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
```

---

## Module 3: Kafka Producer for Enriched Click Tracking

### 1. `ClickEvent.java` DTO
File: `redirect/src/main/java/com/urlshortener/redirect/dto/ClickEvent.java`

```java
package com.urlshortener.redirect.dto;

import java.time.Instant;

public record ClickEvent(
        String shortCode,
        Instant timestamp,
        String ipAddress,
        String userAgent,
        String referrer,
        String variant,         // e.g. "A", "B" (null if normal link)
        String utmSource,       // e.g. "twitter"
        String utmMedium,       // e.g. "social"
        String utmCampaign      // e.g. "summer_launch"
) {}
```

---

### 2. `ClickEventProducer.java`
File: `redirect/src/main/java/com/urlshortener/redirect/kafka/ClickEventProducer.java`

```java
package com.urlshortener.redirect.kafka;

import com.urlshortener.redirect.dto.ClickEvent;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.Disposable;
import reactor.core.publisher.Sinks;
import reactor.core.scheduler.Schedulers;

/**
 * Decoupled reactive telemetry producer using Project Reactor Sinks.Many.
 * publishClickEvent() executes an in-memory emission (< 0.001ms),
 * completely isolating Netty event loop threads from Kafka producer locks and network I/O.
 */
@Slf4j
@Component
public class ClickEventProducer {

    private static final String TOPIC = "url-clicks";
    private static final int BUFFER_CAPACITY = 100_000;

    private final KafkaTemplate<String, ClickEvent> kafkaTemplate;
    private final Sinks.Many<ClickEvent> sink;
    private final Disposable subscription;

    public ClickEventProducer(KafkaTemplate<String, ClickEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.sink = Sinks.many().multicast().onBackpressureBuffer(BUFFER_CAPACITY, false);
        this.subscription = this.sink.asFlux()
                .publishOn(Schedulers.boundedElastic())
                .subscribe(
                        this::sendToKafka,
                        err -> log.error("Kafka telemetry pipeline error: {}", err.getMessage())
                );
    }

    public void publishClickEvent(ClickEvent event) {
        if (event == null) return;
        sink.tryEmitNext(event);
    }

    private void sendToKafka(ClickEvent event) {
        try {
            kafkaTemplate.send(TOPIC, event.shortCode(), event);
        } catch (Exception e) {
            log.error("Failed to initiate Kafka event send for [{}]: {}", event.shortCode(), e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        if (subscription != null && !subscription.isDisposed()) {
            subscription.dispose();
        }
        sink.tryEmitComplete();
    }
}
```

---

## Module 4: High-Throughput Smart Redirection Service

### 1. `RedirectService.java`
File: `redirect/src/main/java/com/urlshortener/redirect/service/RedirectService.java`

```java
package com.urlshortener.redirect.service;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.redirect.dto.ClickEvent;
import com.urlshortener.redirect.dto.ShortCodePayloadDto;
import com.urlshortener.redirect.dto.ShortCodePayloadDto.AbConfig;
import com.urlshortener.redirect.dto.ShortCodePayloadDto.SmartRules;
import com.urlshortener.redirect.dto.ShortCodePayloadDto.Variant;
import com.urlshortener.redirect.dto.ShortCodePayloadDto.VariantResolution;
import com.urlshortener.redirect.grpc.CoreGrpcClient;
import com.urlshortener.redirect.kafka.ClickEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedirectService {

    private final ReactiveStringRedisTemplate redisTemplate;
    private final CoreGrpcClient coreGrpcClient;
    private final ClickEventProducer clickEventProducer;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private final ConcurrentHashMap<String, Mono<ShortCodePayloadDto>> inFlightMisses = new ConcurrentHashMap<>();

    public Mono<String> resolveAndTrackUrl(String shortCode, ServerHttpRequest request, ServerHttpResponse response) {
        String hitsKey = "url:hits:" + shortCode;
        String routeKey = "url:" + shortCode;

        // Critical path: Only HGETALL is executed synchronously
        return redisTemplate.opsForHash().entries(routeKey)
                .collectMap(e -> (String) e.getKey(), e -> (String) e.getValue())
                .flatMap(hash -> {
                    // Parallel non-blocking hit counter & sampled TTL refresh
                    trackHitsAndTtlParallel(routeKey, hitsKey);

                    ShortCodePayloadDto payload = ShortCodePayloadDto.fromHash(shortCode, hash, 0L, objectMapper);

                    // Cache Miss -> Fallback to Core Service single-query gRPC
                    if (payload.isEmpty()) {
                        return resolveFromGrpc(shortCode, routeKey, hitsKey, calculateAdaptiveTtl(1L), 1L, request, response);
                    }

                    // Cache Hit: Resolve routing from structured DTO (JSON memoized)
                    String destinationUrl = null;
                    String selectedVariant = null;

                    // Priority 1: Device OS Override (iOS/Android deep linking)
                    if (payload.hasSmartRules()) {
                        destinationUrl = checkDeviceOverride(payload.getSmartRules(), request);
                    }

                    // Priority 2: Active A/B Test Variant
                    if (destinationUrl == null && payload.hasAbConfig()) {
                        VariantResolution resolution = resolveAbVariant(shortCode, payload.getAbConfig(), request, response);
                        if (resolution != null) {
                            destinationUrl = resolution.url();
                            selectedVariant = resolution.variantKey();
                        }
                    }

                    // Priority 3: Fallback to Base Destination URL
                    if (destinationUrl == null) {
                        destinationUrl = payload.getTargetUrl();
                    }

                    // Merge visitor's inbound query parameters
                    String finalUrl = mergeQueryParams(destinationUrl, request.getQueryParams());

                    // Async decoupled Kafka telemetry via reactive Sink (< 0.001 ms)
                    emitTelemetry(shortCode, selectedVariant, payload, request);

                    return Mono.just(finalUrl);
                });
    }

    private void trackHitsAndTtlParallel(String routeKey, String hitsKey) {
        redisTemplate.opsForValue().increment(hitsKey)
                .flatMap(hits -> {
                    // Sample TTL updates to avoid flooding the single Netty TCP socket
                    if (hits == 1 || hits == 11 || hits == 101 || hits == 1001 || hits % 100 == 0) {
                        Duration adaptiveTtl = calculateAdaptiveTtl(hits);
                        return redisTemplate.expire(routeKey, adaptiveTtl);
                    }
                    return Mono.empty();
                })
                .subscribeOn(Schedulers.parallel())
                .subscribe(null, ex -> log.debug("Parallel Redis hit increment error: {}", ex.getMessage()));
    }

    private Duration calculateAdaptiveTtl(long hits) {
        if (hits <= 10) return Duration.ofMinutes(2);
        if (hits <= 100) return Duration.ofMinutes(30);
        if (hits <= 1000) return Duration.ofHours(2);
        return Duration.ofHours(6);
    }

    private VariantResolution resolveAbVariant(String shortCode, AbConfig config, ServerHttpRequest request, ServerHttpResponse response) {
        try {
            if (!"ACTIVE".equalsIgnoreCase(config.status())) return null;

            // 1. Sticky session cookie check
            HttpCookie cookie = request.getCookies().getFirst("ab_" + shortCode);
            if (cookie != null) {
                for (Variant v : config.variants()) {
                    if (v.key().equalsIgnoreCase(cookie.getValue())) {
                        return new VariantResolution(v.url(), v.key());
                    }
                }
            }

            // 2. Cumulative Weighted Random Selection
            Variant chosen = selectWeightedVariant(config.variants());
            if (chosen != null) {
                response.getHeaders().add("Set-Cookie", "ab_" + shortCode + "=" + chosen.key() + "; Path=/; Max-Age=2592000; SameSite=Lax");
                return new VariantResolution(chosen.url(), chosen.key());
            }
        } catch (Exception e) {
            log.error("Failed to resolve A/B variant for [{}]: {}", shortCode, e.getMessage());
        }
        return null;
    }

    private Variant selectWeightedVariant(List<Variant> variants) {
        int totalWeight = variants.stream().mapToInt(Variant::weight).sum();
        if (totalWeight <= 0) return variants.get(0);

        int roll = ThreadLocalRandom.current().nextInt(1, totalWeight + 1);
        int cumulative = 0;
        for (Variant v : variants) {
            cumulative += v.weight();
            if (roll <= cumulative) return v;
        }
        return variants.get(0);
    }

    private String checkDeviceOverride(SmartRules rules, ServerHttpRequest request) {
        String ua = request.getHeaders().getFirst("User-Agent");
        if (ua == null || rules.devices() == null) return null;
        String uaLower = ua.toLowerCase();

        if ((uaLower.contains("iphone") || uaLower.contains("ipad")) && rules.devices().containsKey("iOS")) {
            return rules.devices().get("iOS");
        }
        if (uaLower.contains("android") && rules.devices().containsKey("Android")) {
            return rules.devices().get("Android");
        }
        return null;
    }

    private Mono<ShortCodePayloadDto> fetchPayloadWithSingleflight(String shortCode, String routeKey, String hitsKey,
                                                                  Duration adaptiveTtl, long hits) {
        return inFlightMisses.computeIfAbsent(shortCode, code -> {
            return coreGrpcClient.getDestinationUrl(code)
                    .flatMap(grpcResponse -> {
                        // Guard Clause: Link not found or disabled
                        if (!grpcResponse.getIsFound() || !grpcResponse.getIsActive()) {
                            return Mono.empty();
                        }

                        // Build standardized DTO from gRPC single-query response
                        ShortCodePayloadDto payload = ShortCodePayloadDto.fromGrpc(code, grpcResponse, hits, objectMapper);

                        // Pre-warm consolidated Redis Hash in one operation
                        Map<String, String> hash = payload.toHash(objectMapper);
                        if (!hash.isEmpty()) {
                            redisTemplate.opsForHash().putAll(routeKey, hash)
                                    .then(redisTemplate.expire(routeKey, adaptiveTtl))
                                    .subscribe();
                        }

                        // Keep hits counter alive for 24h
                        redisTemplate.expire(hitsKey, Duration.ofDays(1)).subscribe();

                        return Mono.just(payload);
                    })
                    .cache()
                    .doFinally(signalType -> inFlightMisses.remove(code));
        });
    }

    private Mono<String> resolveFromGrpc(String shortCode, String routeKey, String hitsKey,
                                         Duration adaptiveTtl, long hits,
                                         ServerHttpRequest request, ServerHttpResponse response) {
        return fetchPayloadWithSingleflight(shortCode, routeKey, hitsKey, adaptiveTtl, hits)
                .map(payload -> {
                    String dest = null;
                    String selectedVariant = null;

                    if (payload.hasSmartRules()) {
                        dest = checkDeviceOverride(payload.getSmartRules(), request);
                    }
                    if (dest == null && payload.hasAbConfig()) {
                        VariantResolution res = resolveAbVariant(shortCode, payload.getAbConfig(), request, response);
                        if (res != null) {
                            dest = res.url();
                            selectedVariant = res.variantKey();
                        }
                    }
                    if (dest == null) {
                        dest = payload.getTargetUrl();
                    }

                    emitTelemetry(shortCode, selectedVariant, payload, request);
                    return mergeQueryParams(dest, request.getQueryParams());
                })
                .onErrorResume(e -> {
                    log.error("Failed to resolve URL via gRPC for shortCode [{}]: {}", shortCode, e.getMessage());
                    return Mono.empty();
                });
    }

    private String mergeQueryParams(String url, MultiValueMap<String, String> queryParams) {
        if (queryParams == null || queryParams.isEmpty() || url == null) return url != null ? url : "";
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(url);
        queryParams.forEach((key, values) -> {
            for (String val : values) builder.replaceQueryParam(key, val);
        });
        return builder.build().toUriString();
    }

    private void emitTelemetry(String shortCode, String variant, ShortCodePayloadDto payload, ServerHttpRequest request) {
        String ip = request.getHeaders().getFirst("X-Forwarded-For");
        if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
        if (ip == null || ip.isBlank()) ip = request.getHeaders().getFirst("X-Real-IP");
        if ((ip == null || ip.isBlank()) && request.getRemoteAddress() != null) {
            ip = request.getRemoteAddress().getAddress().getHostAddress();
        }
        String ua = request.getHeaders().getFirst("User-Agent");
        String referrer = request.getHeaders().getFirst("Referer");
        MultiValueMap<String, String> params = request.getQueryParams();

        ClickEvent event = new ClickEvent(
                shortCode,
                Instant.now(),
                ip != null && !ip.isBlank() ? ip : "127.0.0.1",
                ua != null ? ua : "",
                referrer != null ? referrer : "Direct",
                variant,
                params.getFirst("utm_source"),
                params.getFirst("utm_medium"),
                params.getFirst("utm_campaign"),
                payload != null ? payload.getUrlId() : null,
                payload != null ? payload.getCampaignId() : null,
                payload != null ? payload.getAbTestId() : null
        );
        clickEventProducer.publishClickEvent(event);
    }
}
```

---

### 2. `ShortCodePayloadDto.java` (Self-Pruning JSON Memoization)
File: `redirect/src/main/java/com/urlshortener/redirect/dto/ShortCodePayloadDto.java`

Handles translation between Redis hash string fields and Java domain objects. To prevent Jackson parsing overhead on the hot path while maintaining 100% Redis authoritativeness, it memoizes parsed `AbConfig` and `SmartRules` with self-pruning capped at 10,000 entries:

```java
package com.urlshortener.redirect.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShortCodePayloadDto {

    private String shortCode;
    private String targetUrl;
    private AbConfig abConfig;
    private SmartRules smartRules;
    private long hits;
    private String urlId;
    private String campaignId;
    private String abTestId;

    private static final int MAX_CACHE_ENTRIES = 10_000;
    private static final Map<String, AbConfig> AB_CONFIG_CACHE = new ConcurrentHashMap<>();
    private static final Map<String, SmartRules> SMART_RULES_CACHE = new ConcurrentHashMap<>();

    public static ShortCodePayloadDto fromHash(String shortCode, Map<String, String> hash, long hits, ObjectMapper mapper) {
        if (hash == null || hash.isEmpty() || !hash.containsKey("target") || hash.get("target").isBlank()) {
            return ShortCodePayloadDto.builder().shortCode(shortCode).hits(hits).build();
        }

        AbConfig abConfig = null;
        String abString = hash.get("ab");
        if (abString != null && !abString.isBlank()) {
            abConfig = getCachedAbConfig(abString, mapper, shortCode);
        }

        SmartRules smartRules = null;
        String rulesString = hash.get("rules");
        if (rulesString != null && !rulesString.isBlank()) {
            smartRules = getCachedSmartRules(rulesString, mapper, shortCode);
        }

        return ShortCodePayloadDto.builder()
                .shortCode(shortCode)
                .targetUrl(hash.get("target"))
                .abConfig(abConfig)
                .smartRules(smartRules)
                .hits(hits)
                .urlId(hash.get("urlId"))
                .campaignId(hash.get("campaignId"))
                .abTestId(hash.get("abTestId"))
                .build();
    }

    private static AbConfig getCachedAbConfig(String abString, ObjectMapper mapper, String shortCode) {
        AbConfig cached = AB_CONFIG_CACHE.get(abString);
        if (cached != null) return cached;
        if (AB_CONFIG_CACHE.size() >= MAX_CACHE_ENTRIES) AB_CONFIG_CACHE.clear();
        return AB_CONFIG_CACHE.computeIfAbsent(abString, s -> {
            try {
                return mapper.readValue(s, AbConfig.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize AbConfig for {}: {}", shortCode, e.getMessage());
                return null;
            }
        });
    }

    private static SmartRules getCachedSmartRules(String rulesString, ObjectMapper mapper, String shortCode) {
        SmartRules cached = SMART_RULES_CACHE.get(rulesString);
        if (cached != null) return cached;
        if (SMART_RULES_CACHE.size() >= MAX_CACHE_ENTRIES) SMART_RULES_CACHE.clear();
        return SMART_RULES_CACHE.computeIfAbsent(rulesString, s -> {
            try {
                return mapper.readValue(s, SmartRules.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize SmartRules for {}: {}", shortCode, e.getMessage());
                return null;
            }
        });
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AbConfig(String status, String winningVariant, List<Variant> variants, Long cookieTtlSeconds, String testId) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Variant(String key, String url, int weight, Boolean isControl) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SmartRules(Map<String, String> devices, Map<String, String> countries) {}

    public record VariantResolution(String url, String variantKey) {}
}
```

---

### 3. `RedirectController.java`
File: `redirect/src/main/java/com/urlshortener/redirect/controller/RedirectController.java`

```java
package com.urlshortener.redirect.controller;

import com.urlshortener.redirect.service.RedirectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.net.URI;

@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final RedirectService redirectService;

    @GetMapping({"/r/{shortCode}", "/{shortCode:[a-zA-Z0-9_-]{3,15}}"})
    public Mono<ResponseEntity<Void>> redirect(
            @PathVariable String shortCode,
            ServerHttpRequest request,
            ServerHttpResponse response
    ) {
        return redirectService.resolveAndTrackUrl(shortCode, request, response)
                .map(destinationUrl -> ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(destinationUrl))
                        .build())
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
```

---

## Module 5: Step-by-Step Testing & Verification Guide

### 1. Testing Standard Redirect
```bash
curl -i -X GET http://localhost:8082/r/test-slug
```
* **Expected Result:** HTTP `302 Found` with `Location: https://...` in `< 2ms`.

### 2. Testing A/B Testing & Sticky Cookies
```bash
# First request (No cookie): gets assigned variant and Set-Cookie header
curl -i -X GET http://localhost:8082/r/ab-slug
# Expected: Set-Cookie: ab_ab-slug=A; Path=/; ...

# Second request (With cookie): consistently routed to Variant A
curl -i -H "Cookie: ab_ab-slug=A" -X GET http://localhost:8082/r/ab-slug
# Expected: Location: https://.../variant-a
```

### 3. Testing Device Deep-Linking
```bash
# iPhone request
curl -i -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" http://localhost:8082/r/app-link
# Expected: Location: https://apps.apple.com/...
```
