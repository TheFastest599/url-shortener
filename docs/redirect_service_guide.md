# Hands-On Guide: Building the Redirect Service (`url-redirect-service`)

Welcome! This document is a complete, step-by-step hands-on guide for building the high-throughput **Redirect Microservice** (`url-redirect-service`).

The Redirect service handles sub-millisecond HTTP `302 Found` redirects for short URLs (`GET /r/{shortCode}`) on port **8082**. It uses **Reactive WebFlux**, **Redis Caching**, a **gRPC Client** to fallback to Core Service (port 9090), and an **Apache Kafka Producer** for asynchronous click tracking.

---

## Table of Contents
1. [Key Concepts & Architecture](#1-key-concepts--architecture)
2. [Module 1: Redis Reactive Cache Configuration](#module-1-redis-reactive-cache-configuration)
3. [Module 2: gRPC Client Integration (Connecting to Core Service :9090)](#module-2-grpc-client-integration-connecting-to-core-service-9090)
4. [Module 3: Kafka Producer for Asynchronous Click Events](#module-3-kafka-producer-for-asynchronous-click-events)
5. [Module 4: Reactive Redirection Service & Controller](#module-4-reactive-redirection-service--controller)
6. [Module 5: Step-by-Step Testing & Verification Guide](#module-5-step-by-step-testing--verification-guide)

---

## 1. Key Concepts & Architecture

```text
User Request: GET /r/xyz123 (Port 8082)
                    │
                    ▼
          [ Check Redis Cache ]
          ├──► CACHE HIT  ──► Return 302 Redirect Immediately!
          └──► CACHE MISS ──► Call Core Service gRPC (:9090) ──► Populate Redis Cache
                    │
                    ▼ (Async Non-Blocking)
        [ Publish Click Event to Kafka ("url-clicks") ]
```

* **Reactive WebFlux (Netty):** Handles 50,000+ concurrent redirect requests with low memory.
* **Redis Caching (Lettuce):** Microsecond lookup for hot short links.
* **Async Kafka Event Emission:** Fire-and-forget click log publishing so click logging **never slows down the HTTP redirect**.

---

## Module 1: Redis Reactive Cache Configuration

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

grpc:
  client:
    core-service:
      address: 'static://localhost:9090'
      negotiation-type: plaintext
```

---

## Module 2: gRPC Client Integration (Connecting to Core Service :9090)

File: `redirect/src/main/java/com/urlshortener/redirect/grpc/CoreGrpcClient.java`

```java
package com.urlshortener.redirect.grpc;

import com.urlshortener.grpc.UrlRequest;
import com.urlshortener.grpc.UrlResponse;
import com.urlshortener.grpc.UrlServiceGrpc;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class CoreGrpcClient {

    @GrpcClient("core-service")
    private UrlServiceGrpc.UrlServiceBlockingStub urlServiceStub;

    public Mono<UrlResponse> getDestinationUrl(String shortCode) {
        return Mono.fromCallable(() -> {
            UrlRequest request = UrlRequest.newBuilder()
                    .setShortCode(shortCode)
                    .build();
            return urlServiceStub.getDestinationUrl(request);
        });
    }
}
```

---

## Module 3: Kafka Producer for Asynchronous Click Events

### 1. `ClickEvent.java` DTO
File: `redirect/src/main/java/com/urlshortener/redirect/dto/ClickEvent.java`

```java
package com.urlshortener.redirect.dto;

import java.time.Instant;

public record ClickEvent(
        String shortCode,
        String userAgent,
        String ipAddress,
        String referrer,
        Instant timestamp
) {}
```

---

### 2. `ClickEventProducer.java`
File: `redirect/src/main/java/com/urlshortener/redirect/kafka/ClickEventProducer.java`

```java
package com.urlshortener.redirect.kafka;

import com.urlshortener.redirect.dto.ClickEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClickEventProducer {

    private static final String TOPIC = "url-clicks";
    private final KafkaTemplate<String, ClickEvent> kafkaTemplate;

    public void publishClickEvent(ClickEvent event) {
        kafkaTemplate.send(TOPIC, event.shortCode(), event);
    }
}
```

---

## Module 4: Reactive Redirection Service & Controller

### 1. `RedirectService.java`
File: `redirect/src/main/java/com/urlshortener/redirect/service/RedirectService.java`

```java
package com.urlshortener.redirect.service;

import com.urlshortener.redirect.dto.ClickEvent;
import com.urlshortener.redirect.grpc.CoreGrpcClient;
import com.urlshortener.redirect.kafka.ClickEventProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class RedirectService {

    private final ReactiveStringRedisTemplate redisTemplate;
    private final CoreGrpcClient coreGrpcClient;
    private final ClickEventProducer clickEventProducer;

    public Mono<String> resolveAndTrackUrl(String shortCode, String userAgent, String ip, String referrer) {
        String cacheKey = "url:redirect:" + shortCode;
        String counterKey = "url:hits:" + shortCode;

        // 1. Increment rolling hits popularity counter reactively
        return redisTemplate.opsForValue().increment(counterKey)
                .flatMap(hits -> {
                    Duration adaptiveTtl = calculateAdaptiveTtl(hits != null ? hits : 0L);

                    // 2. Check Redis Cache First
                    return redisTemplate.opsForValue().get(cacheKey)
                            .flatMap(cachedUrl -> {
                                // Cache Hit: Extend TTL based on rolling popularity
                                return redisTemplate.expire(cacheKey, adaptiveTtl)
                                        .thenReturn(cachedUrl);
                            })
                            .switchIfEmpty(
                                    // Cache Miss: Query Core Service via gRPC
                                    coreGrpcClient.getDestinationUrl(shortCode)
                                            .flatMap(response -> {
                                                if (response.getFound() && response.getIsActive()) {
                                                    String targetUrl = response.getDestinationUrl();
                                                    // Pre-warm Redis with Adaptive TTL
                                                    return redisTemplate.opsForValue()
                                                            .set(cacheKey, targetUrl, adaptiveTtl)
                                                            .thenReturn(targetUrl);
                                                }
                                                return Mono.empty();
                                            })
                            );
                })
                .doOnNext(destinationUrl -> {
                    // Fire-and-Forget Kafka Click Tracking Event
                    ClickEvent event = new ClickEvent(shortCode, userAgent, ip, referrer, Instant.now());
                    clickEventProducer.publishClickEvent(event);
                });
    }

    private Duration calculateAdaptiveTtl(long hits) {
        if (hits <= 10) {
            return Duration.ofMinutes(2);      // Cold Key: Keep Redis memory minimal
        } else if (hits <= 100) {
            return Duration.ofMinutes(30);     // Warm Key
        } else if (hits <= 1000) {
            return Duration.ofHours(2);        // Hot Key
        } else {
            return Duration.ofHours(6);        // Viral Key: Longest TTL
        }
    }
}
```

---

### 2. `RedirectController.java`
File: `redirect/src/main/java/com/urlshortener/redirect/controller/RedirectController.java`

```java
package com.urlshortener.redirect.controller;

import com.urlshortener.redirect.service.RedirectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.net.URI;

@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final RedirectService redirectService;

    @GetMapping("/r/{shortCode}")
    public Mono<ResponseEntity<Void>> redirect(
            @PathVariable String shortCode,
            ServerHttpRequest request) {

        String userAgent = request.getHeaders().getFirst(HttpHeaders.USER_AGENT);
        String referrer = request.getHeaders().getFirst(HttpHeaders.REFERER);
        String ip = request.getRemoteAddress() != null 
                ? request.getRemoteAddress().getAddress().getHostAddress() 
                : "unknown";

        return redirectService.resolveAndTrackUrl(shortCode, userAgent, ip, referrer)
                .map(destinationUrl -> ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create(destinationUrl))
                        .build())
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
```

---

## Module 5: Step-by-Step Testing & Verification Guide

### 1. Test Redirection via `curl`
```bash
curl -i http://localhost:8082/r/1234
```
**Expected Response (`HTTP 302 Found`):**
```text
HTTP/1.1 302 Found
Location: https://example.com/long-target-page
```

---

## Summary
The Redirect Service delivers:
1. Fast **HTTP 302 Redirection** via Reactive WebFlux (`:8082`).
2. **Redis microsecond caching** for hot short URLs.
3. Fallback to Core Service via **gRPC**.
4. Non-blocking click stream publishing via **Kafka (`url-clicks`)**.
