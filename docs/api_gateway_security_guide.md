# Hands-On Guide: Building the Security & Auth Layer in API Gateway (`url-gateway-service`)

Welcome! This document is a complete, step-by-step hands-on guide for building the entire Security, Authentication, and Token Management layer for the **HiClickMe API Gateway** (`url-gateway-service`).

By following this guide, you will learn how to build a modern, high-performance **Reactive Security System** using **Spring WebFlux**, **Spring Security Reactive**, **Spring Data R2DBC**, **PostgreSQL**, and **JSON Web Tokens (JWT)** with **Refresh Token Rotation (RTR)**.

> [!NOTE]
> All entities and database primary/foreign keys in this architecture use **UUID** (`gen_random_uuid()`) instead of auto-incrementing integers for enhanced security, distributed key uniqueness, and API privacy.

---

## Table of Contents
1. [Key Concepts & Architecture](#1-key-concepts--architecture)
2. [Module 1: Database Schema Setup (`url_shortener_auth`)](#module-1-database-schema-setup-url_shortener_auth)
3. [Module 2: R2DBC Reactive Entities & Repositories](#module-2-r2dbc-reactive-entities--repositories)
4. [Module 3: JWT Token Provider Engine](#module-3-jwt-token-provider-engine)
5. [Module 4: Reactive Security Configuration & Web Filter](#module-4-reactive-security-configuration--web-filter)
6. [Module 5: Data Transfer Objects (DTOs)](#module-5-data-transfer-objects-dtos)
7. [Module 6: Reactive AuthService (Business Logic)](#module-6-reactive-authservice-business-logic)
8. [Module 7: Auth REST Controller](#module-7-auth-rest-controller)
9. [Module 8: Step-by-Step Testing & Verification Guide](#module-8-step-by-step-testing--verification-guide)

---

## 1. Key Concepts & Architecture

Before writing code, let's understand why we use these specific components:

* **Reactive I/O (Spring WebFlux):** Unlike standard Spring MVC which uses one thread per request (blocking Tomcat), WebFlux runs on an event loop (Netty). It can process thousands of concurrent requests with very small memory usage.
* **Non-Blocking Database Access (R2DBC):** JDBC is blocking, which defeats the purpose of WebFlux. R2DBC (Reactive Relational Database Connectivity) allows PostgreSQL queries to run asynchronously via reactive `Mono` and `Flux` streams.
* **Stateless JWT Authentication:** The Gateway signs a short-lived **Access Token** (e.g. 15 mins). On every request, the Gateway verifies the token signature locally in memory **without querying PostgreSQL**, making API verification microsecond-fast.
* **Refresh Token Rotation (RTR):** A long-lived **Refresh Token** (7 days) is stored in an `HttpOnly` secure cookie. Every time the access token expires, the client calls `/refresh`. The Gateway invalidates the old refresh token, issues a brand-new refresh token + access token pair, and saves the record in PostgreSQL.

---

## Module 1: Database Schema Setup (`url_shortener_auth`)

Create a Flyway migration file at `apigateway/src/main/resources/db/migration/V1__init_auth_schema.sql`.

```sql
-- V1__init_auth_schema.sql: Initial Auth Database Schema for HiClickMe (UUID Primary Keys)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (Core Identity Reference)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'USER' NOT NULL,
    auth_type VARCHAR(50) DEFAULT 'EMAIL' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. User Passwords Table (One-to-One with users)
CREATE TABLE IF NOT EXISTS user_passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. User OAuth Credentials Table (Optional OAuth providers)
CREATE TABLE IF NOT EXISTS user_oauth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_provider_user_id UNIQUE (provider, provider_user_id)
);

-- 4. Refresh Tokens Table (Rotation & Replay Detection)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
```

---

## Module 2: R2DBC Reactive Entities & Repositories

Create package `com.urlshortener.apigateway.entity` and `com.urlshortener.apigateway.repository`.

### 1. `User.java` Entity
File: `apigateway/src/main/java/com/urlshortener/apigateway/entity/User.java`

```java
package com.urlshortener.apigateway.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("users")
public class User {

    @Id
    private UUID id;

    private String username;

    private String email;

    private String role;

    @Column("auth_type")
    private String authType;

    @Column("created_at")
    private Instant createdAt;

    @Column("updated_at")
    private Instant updatedAt;
}
```

### 2. `UserPassword.java` Entity
File: `apigateway/src/main/java/com/urlshortener/apigateway/entity/UserPassword.java`

```java
package com.urlshortener.apigateway.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("user_passwords")
public class UserPassword {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("password_hash")
    private String passwordHash;

    @Column("updated_at")
    private Instant updatedAt;
}
```

### 3. `RefreshToken.java` Entity
File: `apigateway/src/main/java/com/urlshortener/apigateway/entity/RefreshToken.java`

```java
package com.urlshortener.apigateway.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("refresh_tokens")
public class RefreshToken {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    private String token;

    @Column("expiry_date")
    private Instant expiryDate;

    private Boolean revoked;

    @Column("created_at")
    private Instant createdAt;
}
```

### 4. Reactive Repositories
File: `apigateway/src/main/java/com/urlshortener/apigateway/repository/UserRepository.java`

```java
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
```

File: `apigateway/src/main/java/com/urlshortener/apigateway/repository/UserPasswordRepository.java`

```java
package com.urlshortener.apigateway.repository;

import com.urlshortener.apigateway.entity.UserPassword;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserPasswordRepository extends ReactiveCrudRepository<UserPassword, UUID> {
    Mono<UserPassword> findByUserId(UUID userId);
}
```

File: `apigateway/src/main/java/com/urlshortener/apigateway/repository/RefreshTokenRepository.java`

```java
package com.urlshortener.apigateway.repository;

import com.urlshortener.apigateway.entity.RefreshToken;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface RefreshTokenRepository extends ReactiveCrudRepository<RefreshToken, UUID> {
    Mono<RefreshToken> findByToken(String token);
    Mono<Void> deleteByUserId(UUID userId);
}
```

---

## Module 3: JWT Token Provider Engine

Create package `com.urlshortener.apigateway.security` and add `JwtTokenProvider.java`.

File: `apigateway/src/main/java/com/urlshortener/apigateway/security/JwtTokenProvider.java`

```java
package com.urlshortener.apigateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:defaultSecretKeyWhichIsAtLeast32BytesLongForHS256BitSecurity!}") String secret,
            @Value("${app.jwt.expiration-ms:900000}") long accessTokenExpirationMs // Default: 15 mins
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public String generateAccessToken(UUID userId, String username, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("username", username)
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID getUserIdFromToken(String token) {
        return UUID.fromString(getClaimsFromToken(token).getSubject());
    }
}
```

---

## Module 4: Reactive Security Configuration & Web Filter

### 1. `BearerTokenSecurityContextRepository.java`
File: `apigateway/src/main/java/com/urlshortener/apigateway/security/BearerTokenSecurityContextRepository.java`

Extracts `Authorization: Bearer <token>` from HTTP headers and builds the Reactive Security Context.

```java
package com.urlshortener.apigateway.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
public class BearerTokenSecurityContextRepository implements ServerSecurityContextRepository {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Mono<Void> save(ServerWebExchange exchange, SecurityContext context) {
        return Mono.empty(); // Stateless JWT: no session saving needed
    }

    @Override
    public Mono<SecurityContext> load(ServerWebExchange exchange) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtTokenProvider.validateToken(token)) {
                Claims claims = jwtTokenProvider.getClaimsFromToken(token);
                String userId = claims.getSubject();
                String role = claims.get("role", String.class);

                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);

                return Mono.just(new SecurityContextImpl(auth));
            }
        }
        return Mono.empty();
    }
}
```

### 2. `SecurityConfig.java`
File: `apigateway/src/main/java/com/urlshortener/apigateway/config/SecurityConfig.java`

Configures reactive route authorization, password encoder, and web filter chain.

```java
package com.urlshortener.apigateway.config;

import com.urlshortener.apigateway.security.BearerTokenSecurityContextRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final BearerTokenSecurityContextRepository securityContextRepository;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .securityContextRepository(securityContextRepository)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/api/v1/auth/**").permitAll()
                        .pathMatchers("/r/**").permitAll()
                        .anyExchange().authenticated()
                )
                .build();
    }
}
```

---

## Module 5: Data Transfer Objects (DTOs)

Create package `com.urlshortener.apigateway.dto`.

### 1. `RegisterRequest.java`
```java
package com.urlshortener.apigateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 6) String password
) {}
```

### 2. `LoginRequest.java`
```java
package com.urlshortener.apigateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}
```

### 3. `RefreshTokenRequest.java`
```java
package com.urlshortener.apigateway.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
    @NotBlank String refreshToken
) {}
```

### 4. `AuthResponse.java`
```java
package com.urlshortener.apigateway.dto;

import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn,
    UserDto user
) {
    public record UserDto(UUID id, String username, String email, String role) {}
}
```

---

## Module 6: Reactive AuthService (Business Logic)

Create package `com.urlshortener.apigateway.service` and add `AuthService.java`.

File: `apigateway/src/main/java/com/urlshortener/apigateway/service/AuthService.java`

```java
package com.urlshortener.apigateway.service;

import com.urlshortener.apigateway.dto.*;
import com.urlshortener.apigateway.entity.RefreshToken;
import com.urlshortener.apigateway.entity.User;
import com.urlshortener.apigateway.entity.UserPassword;
import com.urlshortener.apigateway.repository.RefreshTokenRepository;
import com.urlshortener.apigateway.repository.UserPasswordRepository;
import com.urlshortener.apigateway.repository.UserRepository;
import com.urlshortener.apigateway.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserPasswordRepository passwordRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public Mono<AuthResponse> register(RegisterRequest request) {
        return userRepository.existsByEmail(request.email())
                .flatMap(emailExists -> {
                    if (emailExists) {
                        return Mono.error(new IllegalArgumentException("Email already registered"));
                    }
                    return userRepository.existsByUsername(request.username());
                })
                .flatMap(usernameExists -> {
                    if (usernameExists) {
                        return Mono.error(new IllegalArgumentException("Username already taken"));
                    }

                    User user = User.builder()
                            .username(request.username())
                            .email(request.email())
                            .role("USER")
                            .authType("EMAIL")
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();

                    return userRepository.save(user);
                })
                .flatMap(savedUser -> {
                    UserPassword userPassword = UserPassword.builder()
                            .userId(savedUser.getId())
                            .passwordHash(passwordEncoder.encode(request.password()))
                            .updatedAt(Instant.now())
                            .build();

                    return passwordRepository.save(userPassword)
                            .thenReturn(savedUser);
                })
                .flatMap(this::generateAuthResponse);
    }

    public Mono<AuthResponse> login(LoginRequest request) {
        return userRepository.findByEmail(request.email())
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Invalid email or password")))
                .flatMap(user -> passwordRepository.findByUserId(user.getId())
                        .flatMap(userPassword -> {
                            if (!passwordEncoder.matches(request.password(), userPassword.getPasswordHash())) {
                                return Mono.error(new IllegalArgumentException("Invalid email or password"));
                            }
                            return generateAuthResponse(user);
                        })
                );
    }

    @Transactional
    public Mono<AuthResponse> refreshToken(RefreshTokenRequest request) {
        return refreshTokenRepository.findByToken(request.refreshToken())
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Invalid refresh token")))
                .flatMap(refreshToken -> {
                    if (refreshToken.getRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())) {
                        return Mono.error(new IllegalArgumentException("Refresh token is expired or revoked"));
                    }

                    // Revoke old refresh token (Refresh Token Rotation)
                    refreshToken.setRevoked(true);

                    return refreshTokenRepository.save(refreshToken)
                            .then(userRepository.findById(refreshToken.getUserId()))
                            .flatMap(this::generateAuthResponse);
                });
    }

    private Mono<AuthResponse> generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getUsername(), user.getEmail(), user.getRole()
        );
        String rawRefreshToken = jwtTokenProvider.generateRefreshToken();

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .userId(user.getId())
                .token(rawRefreshToken)
                .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .createdAt(Instant.now())
                .build();

        return refreshTokenRepository.save(refreshTokenEntity)
                .map(savedToken -> new AuthResponse(
                        accessToken,
                        rawRefreshToken,
                        "Bearer",
                        900,
                        new AuthResponse.UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole())
                ));
    }
}
```

---

## Module 7: Auth REST Controller

Create package `com.urlshortener.apigateway.controller` and add `AuthController.java`.

File: `apigateway/src/main/java/com/urlshortener/apigateway/controller/AuthController.java`

```java
package com.urlshortener.apigateway.controller;

import com.urlshortener.apigateway.dto.*;
import com.urlshortener.apigateway.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Mono<ResponseEntity<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/refresh")
    public Mono<ResponseEntity<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refreshToken(request)
                .map(ResponseEntity::ok);
    }
}
```

---

## Module 8: Step-by-Step Testing & Verification Guide

Once you code these files, test your API Gateway manually using `curl` or Postman:

### 1. User Registration (`POST /api/v1/auth/register`)
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex",
    "email": "alex@example.com",
    "password": "Password123"
  }'
```
**Expected Response (`HTTP 201 Created`):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "4a2b1c8f-...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "username": "alex",
    "email": "alex@example.com",
    "role": "USER"
  }
}
```

### 2. User Sign-In (`POST /api/v1/auth/login`)
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@example.com",
    "password": "Password123"
  }'
```

### 3. Calling an Authenticated Protected Endpoint
```bash
curl -X GET http://localhost:8080/api/v1/dashboard/links \
  -H "Authorization: Bearer <your_access_token_here>"
```
* **With valid token:** Proceed to Gateway controller/gRPC logic.
* **Without token / invalid signature:** `HTTP 401 Unauthorized`.

---

## Summary
You have designed a modern, production-grade **Reactive Authentication System**:
1. Non-blocking database CRUD via **R2DBC**.
2. Password hashing via **BCrypt**.
3. Microsecond local JWT token validation.
4. Secure **Refresh Token Rotation (RTR)** with **UUID** keys.
