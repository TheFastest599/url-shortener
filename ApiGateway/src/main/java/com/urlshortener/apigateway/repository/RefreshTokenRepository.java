package com.urlshortener.apigateway.repository;

import com.urlshortener.apigateway.entity.RefreshToken;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface RefreshTokenRepository extends ReactiveCrudRepository<RefreshToken, UUID> {
    Mono<RefreshToken> findByToken(String token);
    Mono<Void> deleteByUserId(UUID userId);
}
