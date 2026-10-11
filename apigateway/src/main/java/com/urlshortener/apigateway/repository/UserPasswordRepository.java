package com.urlshortener.apigateway.repository;

import com.urlshortener.apigateway.entity.UserPassword;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserPasswordRepository extends ReactiveCrudRepository<UserPassword, UUID> {
    Mono<UserPassword> findByUserId(UUID userId);
}
