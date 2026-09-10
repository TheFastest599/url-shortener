package com.urlshortener.redirect.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.urlshortener.redirect.dto.ClickEvent;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
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
        String abKey = "url:ab:" + shortCode;
        String redirectKey = "url:redirect:" + shortCode;
        String rulesKey = "url:rules:" + shortCode;
        String hitsKey = "url:hits:" + shortCode;

        // 1. Concurrently increment popularity counter and MGET Strategy 1 keys in parallel
        Mono<Long> hitCountMono = redisTemplate.opsForValue().increment(hitsKey);
        Mono<List<String>> cacheLookupMono = redisTemplate.opsForValue().multiGet(List.of(abKey, redirectKey, rulesKey));

        return Mono.zip(hitCountMono, cacheLookupMono)
                .flatMap(tuple -> {
                    Long hits = tuple.getT1();
                    Duration adaptiveTtl = calculateAdaptiveTtl(hits != null ? hits : 1L);

                    List<String> results = tuple.getT2();
                    String abJson = (results != null && !results.isEmpty()) ? results.get(0) : null;
                    String fallbackUrl = (results != null && results.size() > 1) ? results.get(1) : null;
                    String rulesJson = (results != null && results.size() > 2) ? results.get(2) : null;

                    String destinationUrl = null;
                    String selectedVariant = null;

                    // Priority 1: Device OS Override (iOS/Android deep linking)
                    if (rulesJson != null) {
                        destinationUrl = checkDeviceOverride(rulesJson, request);
                    }

                    // Priority 2: Active A/B Test Variant
                    if (destinationUrl == null && abJson != null) {
                        VariantResolution resolution = resolveAbVariant(shortCode, abJson, request, response);
                        if (resolution != null) {
                            destinationUrl = resolution.url();
                            selectedVariant = resolution.variantKey();
                        }
                    }

                    // Priority 3: Fallback to Base Destination URL
                    if (destinationUrl == null) {
                        destinationUrl = fallbackUrl;
                    }

                    // Priority 4: Cache Miss -> Fallback to Core Service over gRPC
                    if (destinationUrl == null) {
                        return resolveFromGrpc(shortCode, adaptiveTtl, hitsKey, request, response);
                    }

                    // Cache Hit: Non-blocking background TTL refresh across active Strategy 1 keys
                    extendAdaptiveTtl(shortCode, abJson != null, rulesJson != null, adaptiveTtl);

                    // Merge visitor's inbound query parameters
                    String finalUrl = mergeQueryParams(destinationUrl, request.getQueryParams());

                    // Async fire-and-forget Kafka telemetry
                    emitTelemetry(shortCode, selectedVariant, request);

                    return Mono.just(finalUrl);
                });
    }

    /**
     * Dynamically scales cache retention based on rolling link popularity:
     * - Cold (<= 10 hits): 2 mins (minimizes Redis memory footprint)
     * - Warm (<= 100 hits): 30 mins
     * - Hot (<= 1000 hits): 2 hours
     * - Viral (> 1000 hits): 6 hours
     */
    Duration calculateAdaptiveTtl(long hits) {
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

    /**
     * Non-blocking background TTL refresh. Keeps Strategy 1 keys synchronized.
     */
    private void extendAdaptiveTtl(String shortCode, boolean hasAb, boolean hasRules, Duration adaptiveTtl) {
        List<String> keys = new ArrayList<>();
        keys.add("url:redirect:" + shortCode);
        if (hasAb) {
            keys.add("url:ab:" + shortCode);
        }
        if (hasRules) {
            keys.add("url:rules:" + shortCode);
        }

        Flux.fromIterable(keys)
                .flatMap(key -> redisTemplate.expire(key, adaptiveTtl))
                .subscribe(); // Executes asynchronously without delaying HTTP redirect response
    }

    VariantResolution resolveAbVariant(String shortCode, String abJson, ServerHttpRequest request, ServerHttpResponse response) {
        try {
            AbConfig config = objectMapper.readValue(abJson, AbConfig.class);

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
            log.error("Failed to parse A/B config for [{}]: {}", shortCode, e.getMessage());
        }
        return null;
    }

    Variant selectWeightedVariant(List<Variant> variants) {
        // Guard Clause: Empty variants
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

    String checkDeviceOverride(String rulesJson, ServerHttpRequest request) {
        String ua = request.getHeaders().getFirst("User-Agent");
        if (ua == null || ua.isBlank()) {
            return null;
        }
        String uaLower = ua.toLowerCase();

        try {
            SmartRules rules = objectMapper.readValue(rulesJson, SmartRules.class);
            if (rules.devices() == null) {
                return null;
            }

            if ((uaLower.contains("iphone") || uaLower.contains("ipad")) && rules.devices().containsKey("iOS")) {
                return rules.devices().get("iOS");
            }
            if (uaLower.contains("android") && rules.devices().containsKey("Android")) {
                return rules.devices().get("Android");
            }
        } catch (Exception ignored) {}

        return null;
    }

    private Mono<String> resolveFromGrpc(String shortCode, Duration adaptiveTtl, String hitsKey,
                                         ServerHttpRequest request, ServerHttpResponse response) {
        return coreGrpcClient.getDestinationUrl(shortCode)
                .flatMap(grpcResponse -> {
                    // Guard Clause: Link not found or disabled
                    if (!grpcResponse.getIsFound() || !grpcResponse.getIsActive()) {
                        return Mono.empty();
                    }

                    String dest = grpcResponse.getDestinationUrl();
                    String selectedVariant = null;

                    // Pre-warm Redis Strategy 1 keys with Adaptive TTL
                    redisTemplate.opsForValue().set("url:redirect:" + shortCode, dest, adaptiveTtl).subscribe();

                    // Priority 1: Device OS Override
                    if (!grpcResponse.getSmartRulesJson().isEmpty()) {
                        redisTemplate.opsForValue().set("url:rules:" + shortCode, grpcResponse.getSmartRulesJson(), adaptiveTtl).subscribe();
                        String override = checkDeviceOverride(grpcResponse.getSmartRulesJson(), request);
                        if (override != null) {
                            dest = override;
                        }
                    }

                    // Priority 2: Active A/B Test Variant
                    if (selectedVariant == null && !grpcResponse.getAbRulesJson().isEmpty()) {
                        redisTemplate.opsForValue().set("url:ab:" + shortCode, grpcResponse.getAbRulesJson(), adaptiveTtl).subscribe();
                        VariantResolution res = resolveAbVariant(shortCode, grpcResponse.getAbRulesJson(), request, response);
                        if (res != null) {
                            dest = res.url();
                            selectedVariant = res.variantKey();
                        }
                    }

                    // Keep hits counter alive for 24h
                    redisTemplate.expire(hitsKey, Duration.ofDays(1)).subscribe();

                    emitTelemetry(shortCode, selectedVariant, request);
                    return Mono.just(mergeQueryParams(dest, request.getQueryParams()));
                });
    }

    String mergeQueryParams(String url, MultiValueMap<String, String> queryParams) {
        if (queryParams == null || queryParams.isEmpty()) {
            return url;
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
        if (ip == null && request.getRemoteAddress() != null) {
            ip = request.getRemoteAddress().getAddress().getHostAddress();
        }
        String ua = request.getHeaders().getFirst("User-Agent");
        String referrer = request.getHeaders().getFirst("Referer");
        MultiValueMap<String, String> params = request.getQueryParams();

        ClickEvent event = new ClickEvent(
                shortCode,
                Instant.now(),
                ip != null ? ip : "127.0.0.1",
                ua != null ? ua : "",
                referrer != null ? referrer : "Direct",
                variant,
                params.getFirst("utm_source"),
                params.getFirst("utm_medium"),
                params.getFirst("utm_campaign")
        );
        clickEventProducer.publishClickEvent(event);
    }

    // Helper records for JSON serialization/deserialization
    @JsonIgnoreProperties(ignoreUnknown = true)
    record AbConfig(String status, String winningVariant, List<Variant> variants, Long cookieTtlSeconds, String testId) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Variant(String key, String url, int weight, Boolean isControl) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SmartRules(Map<String, String> devices, Map<String, String> countries) {}

    record VariantResolution(String url, String variantKey) {}
}
