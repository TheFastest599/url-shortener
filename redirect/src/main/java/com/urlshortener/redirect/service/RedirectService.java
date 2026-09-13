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

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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

    public Mono<String> resolveAndTrackUrl(String shortCode, ServerHttpRequest request, ServerHttpResponse response) {
        String hitsKey = "url:hits:" + shortCode;
        String routeKey = "url:" + shortCode;

        // Concurrently increment dedicated hits counter and fetch consolidated metadata Hash
        Mono<Long> hitCountMono = redisTemplate.opsForValue().increment(hitsKey).defaultIfEmpty(1L);
        Mono<Map<String, String>> hashMono = redisTemplate.opsForHash().entries(routeKey)
                .collectMap(e -> (String) e.getKey(), e -> (String) e.getValue());

        return Mono.zip(hitCountMono, hashMono)
                .flatMap(tuple -> {
                    long hits = tuple.getT1();
                    Duration adaptiveTtl = calculateAdaptiveTtl(hits);

                    ShortCodePayloadDto payload = ShortCodePayloadDto.fromHash(shortCode, tuple.getT2(), hits, objectMapper);

                    // Cache Miss -> Fallback to Core Service single-query gRPC
                    if (payload.isEmpty()) {
                        return resolveFromGrpc(shortCode, routeKey, hitsKey, adaptiveTtl, hits, request, response);
                    }

                    // Cache Hit: Resolve routing from structured DTO
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

                    // Cache Hit: Extend adaptive TTL on single consolidated key
                    redisTemplate.expire(routeKey, adaptiveTtl).subscribe();

                    // Merge visitor's inbound query parameters
                    String finalUrl = mergeQueryParams(destinationUrl, request.getQueryParams());

                    // Async fire-and-forget Kafka telemetry
                    emitTelemetry(shortCode, selectedVariant, request);

                    return Mono.just(finalUrl);
                });
    }

    /**
     * Dynamically scales cache retention based on rolling link popularity:
     * - Cold (<= 10 hits): 2 mins
     * - Warm (<= 100 hits): 30 mins
     * - Hot (<= 1000 hits): 2 hours
     * - Viral (> 1000 hits): 6 hours
     */
    private Duration calculateAdaptiveTtl(long hits) {
        if (hits <= 10) {
            return Duration.ofMinutes(2);
        }
        if (hits <= 100) {
            return Duration.ofMinutes(30);
        }
        if (hits <= 1000) {
            return Duration.ofHours(2);
        }
        return Duration.ofHours(6);
    }

    private VariantResolution resolveAbVariant(String shortCode, AbConfig config, ServerHttpRequest request, ServerHttpResponse response) {
        try {
            // Guard Clause: Test not active
            if (!"ACTIVE".equalsIgnoreCase(config.status())) {
                return null;
            }

            // 0. If winning variant declared, route straight to it
            if (config.winningVariant() != null && !config.winningVariant().isBlank()) {
                for (Variant v : config.variants()) {
                    if (v.key().equalsIgnoreCase(config.winningVariant())) {
                        return new VariantResolution(v.url(), v.key());
                    }
                }
            }

            // 1. Check for sticky session cookie
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
                long maxAge = (config.cookieTtlSeconds() != null && config.cookieTtlSeconds() > 0)
                        ? config.cookieTtlSeconds() : 2592000L;
                response.getHeaders().add("Set-Cookie", "ab_" + shortCode + "=" + chosen.key() + "; Path=/; Max-Age=" + maxAge + "; SameSite=Lax");
                return new VariantResolution(chosen.url(), chosen.key());
            }
        } catch (Exception e) {
            log.error("Failed to resolve A/B variant for [{}]: {}", shortCode, e.getMessage());
        }
        return null;
    }

    private Variant selectWeightedVariant(List<Variant> variants) {
        if (variants == null || variants.isEmpty()) {
            return null;
        }

        int totalWeight = variants.stream().mapToInt(Variant::weight).sum();
        if (totalWeight <= 0) {
            return variants.get(0);
        }

        int roll = ThreadLocalRandom.current().nextInt(1, totalWeight + 1);
        int cumulative = 0;
        for (Variant v : variants) {
            cumulative += v.weight();
            if (roll <= cumulative) {
                return v;
            }
        }
        return variants.get(0);
    }

    private String checkDeviceOverride(SmartRules rules, ServerHttpRequest request) {
        String ua = request.getHeaders().getFirst("User-Agent");
        if (ua == null || ua.isBlank() || rules == null || rules.devices() == null) {
            return null;
        }
        String uaLower = ua.toLowerCase();

        if ((uaLower.contains("iphone") || uaLower.contains("ipad")) && rules.devices().containsKey("iOS")) {
            return rules.devices().get("iOS");
        }
        if (uaLower.contains("android") && rules.devices().containsKey("Android")) {
            return rules.devices().get("Android");
        }

        return null;
    }

    private Mono<String> resolveFromGrpc(String shortCode, String routeKey, String hitsKey,
                                         Duration adaptiveTtl, long hits,
                                         ServerHttpRequest request, ServerHttpResponse response) {
        return coreGrpcClient.getDestinationUrl(shortCode)
                .flatMap(grpcResponse -> {
                    // Guard Clause: Link not found or disabled
                    if (!grpcResponse.getIsFound() || !grpcResponse.getIsActive()) {
                        return Mono.empty();
                    }

                    // Build standardized DTO from gRPC single-query response
                    ShortCodePayloadDto payload = ShortCodePayloadDto.fromGrpc(shortCode, grpcResponse, hits, objectMapper);

                    // Pre-warm consolidated Redis Hash in one operation
                    Map<String, String> hash = payload.toHash(objectMapper);
                    if (!hash.isEmpty()) {
                        redisTemplate.opsForHash().putAll(routeKey, hash)
                                .then(redisTemplate.expire(routeKey, adaptiveTtl))
                                .subscribe();
                    }

                    // Keep hits counter alive for 24h
                    redisTemplate.expire(hitsKey, Duration.ofDays(1)).subscribe();

                    // Determine destination and variant
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

                    emitTelemetry(shortCode, selectedVariant, request);
                    return Mono.just(mergeQueryParams(dest, request.getQueryParams()));
                })
                .onErrorResume(e -> {
                    log.error("Failed to resolve URL via gRPC for shortCode [{}]: {}", shortCode, e.getMessage());
                    return Mono.empty();
                });
    }

    private String mergeQueryParams(String url, MultiValueMap<String, String> queryParams) {
        if (queryParams == null || queryParams.isEmpty() || url == null) {
            return url != null ? url : "";
        }
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(url);
        queryParams.forEach((key, values) -> {
            for (String val : values) {
                builder.replaceQueryParam(key, val);
            }
        });
        return builder.build().toUriString();
    }

    private void emitTelemetry(String shortCode, String variant, ServerHttpRequest request) {
        String ip = request.getHeaders().getFirst("X-Forwarded-For");
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getHeaders().getFirst("X-Real-IP");
        }
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
                params.getFirst("utm_campaign")
        );
        clickEventProducer.publishClickEvent(event);
    }
}
