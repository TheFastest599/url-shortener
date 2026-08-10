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

                    // 2. Check Redis cache first
                    return  redisTemplate.opsForValue().get(cacheKey)
                            .flatMap(cacheUrl -> {
                                // Cache Hit : Extend TTL based on rolling popularity
                                return redisTemplate.expire(cacheKey, adaptiveTtl)
                                        .thenReturn(cacheUrl);
                            })
                            .switchIfEmpty(
                                    // Cache Miss: Query Core Service via gRPC
                                    coreGrpcClient.getDestinationUrl(shortCode)
                                            .flatMap(response -> {
                                                if (response.getIsFound() && response.getIsActive()) {
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
                    // Fire-and-Forget kafka Click Tracking Event
                    ClickEvent event = new ClickEvent(shortCode, userAgent, ip, referrer, Instant.now());
                    clickEventProducer.publishClickEvent(event);
                });
    };

    private Duration calculateAdaptiveTtl(long hits) {
        if (hits <= 10) {
            return Duration.ofMinutes(2); // Cold Key : Keep Redis memory minimal
        } else if (hits <= 100) {
            return Duration.ofMinutes(30); // Warm Key
        } else if (hits <= 1000) {
            return Duration.ofHours(2);
        } else {
            return Duration.ofHours(6);
        }
    }
}
