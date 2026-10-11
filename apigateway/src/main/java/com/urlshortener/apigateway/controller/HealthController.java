package com.urlshortener.apigateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/health", "/api/v1/health"})
    public Mono<ResponseEntity<Map<String, Object>>> getHealthStatus() {
        Map<String, Object> health = Map.of(
                "status", "UP",
                "service", "api-gateway",
                "timestamp", Instant.now().toString()
        );
        return Mono.just(ResponseEntity.ok(health));
    }
}
