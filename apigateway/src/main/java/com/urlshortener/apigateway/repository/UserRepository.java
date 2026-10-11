package com.urlshortener.apigateway.repository;

import com.urlshortener.apigateway.entity.User;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserRepository extends ReactiveCrudRepository<User, UUID> {
    Mono<User> findByEmail(String email);
    Mono<User> findByUsername(String username);
    Mono<Boolean> existsByEmail(String email);
    Mono<Boolean> existsByUsername(String username);
}
