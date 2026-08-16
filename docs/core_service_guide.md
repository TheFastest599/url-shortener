# Hands-On Guide: Building the Core Service (`url-core-service`)

Welcome! This document is a complete, step-by-step hands-on guide for building the **Core Microservice** (`url-core-service`).

The Core service manages URL mapping persistence, custom alias reservations, Base62 shortcode generation algorithms, tenant/user metadata, and runs a high-performance **gRPC Server** on port **9090** to serve fast URL resolution queries from the Redirect service.

> [!NOTE]
> All primary keys use **UUID** (`gen_random_uuid()`) for security, distributed uniqueness, and API privacy. Database: `url_shortener_core` (PostgreSQL Port `5432`).

---

## Table of Contents
1. [Key Concepts & Architecture](#1-key-concepts--architecture)
2. [Module 1: Database Schema Setup (`url_shortener_core`)](#module-1-database-schema-setup-url_shortener_core)
3. [Module 2: JPA Entities & Repositories](#module-2-jpa-entities--repositories)
4. [Module 3: Base62 Encoding & Shortcode Generator Engine](#module-3-base62-encoding--shortcode-generator-engine)
5. [Module 4: gRPC Protocol Buffer Definition & Server Implementation](#module-4-grpc-protocol-buffer-definition--server-implementation)
6. [Module 5: Core URL Management Service & REST Controllers](#module-5-core-url-management-service--rest-controllers)
7. [Module 6: Step-by-Step Testing & Verification Guide](#module-6-step-by-step-testing--verification-guide)

---

## 1. Key Concepts & Architecture

* **Base62 Shortcode Engine:** Converts numerical counter IDs or random cryptographic hashes into a compact 6–7 character alphanumeric string using character set `[0-9a-zA-Z]`.
* **gRPC Server (:9090):** Provides low-latency, binary HTTP/2 Protobuf RPC methods (`GetDestinationUrl`, `CreateUrlMapping`) consumed internally by the Redirect Service.
* **Database Isolation:** Operates strictly on its own database `url_shortener_core`.

---

## Module 1: Database Schema Setup (`url_shortener_core`)

Create a Flyway migration at `core/src/main/resources/db/migration/V1__init_core_schema.sql`.

```sql
-- V1__init_core_schema.sql: Core Database Schema (url_shortener_core)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. URL Mappings Table
CREATE TABLE IF NOT EXISTS url_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(10) UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    tenant_id VARCHAR(50) DEFAULT 'default' NOT NULL,
    user_id UUID NOT NULL, -- Logical FK to Auth DB users table
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_url_mappings_short_code ON url_mappings(short_code);
CREATE INDEX IF NOT EXISTS idx_url_mappings_user_id ON url_mappings(user_id);

-- 2. UTM Profiles Table
CREATE TABLE IF NOT EXISTS utm_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_mapping_id UUID NOT NULL REFERENCES url_mappings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_utm_profiles_url_mapping ON utm_profiles(url_mapping_id);
```

---

## Module 2: JPA Entities & Repositories

### 1. `UrlMapping.java` Entity
File: `core/src/main/java/com/urlshortener/core/entity/UrlMapping.java`

```java
package com.urlshortener.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "url_mappings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UrlMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "short_code", nullable = false, unique = true, length = 10)
    private String shortCode;

    @Column(name = "destination_url", nullable = false, columnDefinition = "TEXT")
    private String destinationUrl;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
```

---

### 2. `UrlMappingRepository.java`
File: `core/src/main/java/com/urlshortener/core/repository/UrlMappingRepository.java`

```java
package com.urlshortener.core.repository;

import com.urlshortener.core.entity.UrlMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UrlMappingRepository extends JpaRepository<UrlMapping, UUID> {
    Optional<UrlMapping> findByShortCode(String shortCode);
    boolean existsByShortCode(String shortCode);
    List<UrlMapping> findByUserId(UUID userId);
}
```

---

### 3. `UtmProfile.java` Entity
File: `core/src/main/java/com/urlshortener/core/entity/UtmProfile.java`

```java
package com.urlshortener.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "utm_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtmProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "url_mapping_id", nullable = false)
    private UUID urlMappingId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "utm_source", length = 100)
    private String utmSource;

    @Column(name = "utm_medium", length = 100)
    private String utmMedium;

    @Column(name = "utm_campaign", length = 100)
    private String utmCampaign;

    @Column(name = "utm_term", length = 100)
    private String utmTerm;

    @Column(name = "utm_content", length = 100)
    private String utmContent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
```

---

### 4. `UtmProfileRepository.java`
File: `core/src/main/java/com/urlshortener/core/repository/UtmProfileRepository.java`

```java
package com.urlshortener.core.repository;

import com.urlshortener.core.entity.UtmProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UtmProfileRepository extends JpaRepository<UtmProfile, UUID> {
    List<UtmProfile> findByUrlMappingId(UUID urlMappingId);
}
```

---

## Module 3: Base62 Encoding & Shortcode Generator Engine

File: `core/src/main/java/com/urlshortener/core/util/Base62.java`

```java
package com.urlshortener.core.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class Base62 {

    private static final String BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = BASE62_ALPHABET.length();
    private static final SecureRandom RANDOM = new SecureRandom();

    public String encode(long number) {
        StringBuilder sb = new StringBuilder();
        while (number > 0) {
            sb.append(BASE62_ALPHABET.charAt((int) (number % BASE)));
            number /= BASE;
        }
        return sb.reverse().toString();
    }

    public String generateRandomShortCode(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(BASE62_ALPHABET.charAt(RANDOM.nextInt(BASE)));
        }
        return sb.toString();
    }
}
```

---

## Module 4: gRPC Protocol Buffer Definition & Server Implementation

### 1. Protobuf Schema (`url_service.proto`)
File: `core/src/main/proto/url_service.proto`

```protobuf
syntax = "proto3";

package com.urlshortener.grpc;

option java_multiple_files = true;
option java_package = "com.urlshortener.grpc";

service UrlService {
  rpc GetDestinationUrl (UrlRequest) returns (UrlResponse);
  rpc CreateUrlMapping (CreateUrlRequest) returns (CreateUrlResponse);
}

message UrlRequest {
  string short_code = 1;
}

message UrlResponse {
  string destination_url = 1;
  bool is_active = 2;
  bool is_found = 3;
  string short_code = 4;
}

message CreateUrlRequest {
  string destination_url = 1;
  string custom_alias = 2;
  string user_id = 3;
}

message CreateUrlResponse {
  string short_code = 1;
  string destination_url = 2;
  bool success = 3;
}
```

---

### 2. gRPC Server Implementation (`UrlGrpcService.java`)
File: `core/src/main/java/com/urlshortener/core/grpc/UrlGrpcService.java`

```java
package com.urlshortener.core.grpc;

import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.grpc.UrlRequest;
import com.urlshortener.grpc.UrlResponse;
import com.urlshortener.grpc.UrlServiceGrpc;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import net.devh.boot.grpc.server.service.GrpcService;

import java.util.Optional;

@GrpcService
@RequiredArgsConstructor
public class UrlGrpcService extends UrlServiceGrpc.UrlServiceImplBase {

    private final UrlMappingRepository urlMappingRepository;

    @Override
    public void getDestinationUrl(UrlRequest request, StreamObserver<UrlResponse> responseObserver) {
        Optional<UrlMapping> mappingOpt = urlMappingRepository.findByShortCode(request.getShortCode());

        // Guard Clause: Eliminate negative space (Not Found) first
        if (mappingOpt.isEmpty()) {
            UrlResponse notFoundResponse = UrlResponse.newBuilder()
                    .setShortCode(request.getShortCode())
                    .setIsFound(false)
                    .build();
            responseObserver.onNext(notFoundResponse);
            responseObserver.onCompleted();
            return;
        }

        // Happy Path: Flat, clean, unnested execution
        UrlMapping mapping = mappingOpt.get();
        UrlResponse response = UrlResponse.newBuilder()
                .setShortCode(mapping.getShortCode())
                .setDestinationUrl(mapping.getDestinationUrl())
                .setIsActive(mapping.getIsActive())
                .setIsFound(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
```

---

## Module 5: Core URL Management Service, UTM Support & REST Controllers

### 1. Request DTOs
File: `core/src/main/java/com/urlshortener/core/dto/CreateUrlRequest.java`

```java
package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record CreateUrlRequest(
        @NotBlank(message = "Destination URL is required")
        @URL(message = "Must be a valid URL")
        String destinationUrl,
        String customAlias,
        String utmSource,
        String utmMedium,
        String utmCampaign,
        String utmTerm,
        String utmContent
) {}
```

File: `core/src/main/java/com/urlshortener/core/dto/UpdateUrlRequest.java`

```java
package com.urlshortener.core.dto;

import org.hibernate.validator.constraints.URL;

import java.time.Instant;

public record UpdateUrlRequest(
        @URL(message = "Must be a valid URL")
        String destinationUrl,
        Boolean isActive,
        Instant expiresAt
) {}
```

File: `core/src/main/java/com/urlshortener/core/dto/CreateUtmRequest.java`

```java
package com.urlshortener.core.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateUtmRequest(
        @NotBlank(message = "Profile name is required")
        String name,
        String utmSource,
        String utmMedium,
        String utmCampaign,
        String utmTerm,
        String utmContent
) {}
```

File: `core/src/main/java/com/urlshortener/core/dto/UpdateUtmRequest.java`

```java
package com.urlshortener.core.dto;

public record UpdateUtmRequest(
        String name,
        String utmSource,
        String utmMedium,
        String utmCampaign,
        String utmTerm,
        String utmContent
) {}
```

---

### 2. `UrlCoreService.java` (Negative Space Programming)
File: `core/src/main/java/com/urlshortener/core/service/UrlCoreService.java`

```java
package com.urlshortener.core.service;

import com.urlshortener.core.dto.CreateUrlRequest;
import com.urlshortener.core.dto.CreateUtmRequest;
import com.urlshortener.core.dto.UpdateUrlRequest;
import com.urlshortener.core.dto.UpdateUtmRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.entity.UtmProfile;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.core.repository.UtmProfileRepository;
import com.urlshortener.core.util.Base62;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UrlCoreService {

    private final UrlMappingRepository urlRepository;
    private final UtmProfileRepository utmRepository;
    private final Base62 base62;
    private final StringRedisTemplate redisTemplate;

    // ==========================================
    // URL CRUD OPERATIONS
    // ==========================================

    @Transactional
    public UrlMapping createShortUrl(CreateUrlRequest request, UUID userId) {
        // Guard Clause: Validate custom alias availability immediately
        if (request.customAlias() != null && !request.customAlias().isBlank()) {
            if (urlRepository.existsByShortCode(request.customAlias())) {
                throw new IllegalArgumentException("Custom alias already in use");
            }
        }

        String shortCode = (request.customAlias() != null && !request.customAlias().isBlank())
                ? request.customAlias()
                : generateUniqueShortCode();

        String finalDestinationUrl = appendUtmParams(request);

        UrlMapping mapping = UrlMapping.builder()
                .shortCode(shortCode)
                .destinationUrl(finalDestinationUrl)
                .tenantId("default")
                .userId(userId)
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        UrlMapping savedMapping = urlRepository.save(mapping);

        if (hasUtmParams(request)) {
            saveDefaultUtmProfile(savedMapping.getId(), request);
        }

        return savedMapping;
    }

    @Transactional
    public UrlMapping updateShortUrl(UUID urlId, UpdateUrlRequest request, UUID userId) {
        // Guard Clause 1: Validate entity existence
        UrlMapping mapping = urlRepository.findById(urlId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to modify this URL");
        }

        // Happy Path: Flat updates
        if (request.destinationUrl() != null && !request.destinationUrl().isBlank()) {
            mapping.setDestinationUrl(request.destinationUrl());
        }
        if (request.isActive() != null) {
            mapping.setIsActive(request.isActive());
        }
        if (request.expiresAt() != null) {
            mapping.setExpiresAt(request.expiresAt());
        }
        mapping.setUpdatedAt(Instant.now());

        UrlMapping updated = urlRepository.save(mapping);
        evictRedirectCache(mapping.getShortCode());
        return updated;
    }

    @Transactional
    public void deleteShortUrl(UUID urlId, UUID userId) {
        // Guard Clause 1: Validate existence
        UrlMapping mapping = urlRepository.findById(urlId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to delete this URL");
        }

        // Happy Path: Delete & evict cache
        urlRepository.delete(mapping);
        evictRedirectCache(mapping.getShortCode());
    }

    public List<UrlMapping> getUserUrls(UUID userId) {
        return urlRepository.findByUserId(userId);
    }

    public UrlMapping getUrl(UUID urlId, UUID userId) {
        // Guard Clause 1: Validate existence
        UrlMapping mapping = urlRepository.findById(urlId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to access this URL");
        }

        return mapping;
    }

    public Optional<UrlMapping> getUrlFromShortCode(String shortCode) {
        // Public lookup by shortcode
        return urlRepository.findByShortCode(shortCode);
    }

    // ==========================================
    // UTM PROFILE OPERATIONS
    // ==========================================

    @Transactional
    public UtmProfile addUtmProfile(UUID urlMappingId, CreateUtmRequest request) {
        // Guard Clause: Validate parent URL mapping exists
        UrlMapping mapping = urlRepository.findById(urlMappingId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        // Happy Path
        UtmProfile profile = UtmProfile.builder()
                .urlMappingId(mapping.getId())
                .name(request.name())
                .utmSource(request.utmSource())
                .utmMedium(request.utmMedium())
                .utmCampaign(request.utmCampaign())
                .utmTerm(request.utmTerm())
                .utmContent(request.utmContent())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return utmRepository.save(profile);
    }

    @Transactional
    public UtmProfile updateUtmProfile(UUID utmId, UpdateUtmRequest request) {
        // Guard Clause: Validate existence
        UtmProfile profile = utmRepository.findById(utmId)
                .orElseThrow(() -> new IllegalArgumentException("UTM profile not found"));

        // Happy Path: Flat updates
        if (request.name() != null) profile.setName(request.name());
        if (request.utmSource() != null) profile.setUtmSource(request.utmSource());
        if (request.utmMedium() != null) profile.setUtmMedium(request.utmMedium());
        if (request.utmCampaign() != null) profile.setUtmCampaign(request.utmCampaign());
        if (request.utmTerm() != null) profile.setUtmTerm(request.utmTerm());
        if (request.utmContent() != null) profile.setUtmContent(request.utmContent());
        profile.setUpdatedAt(Instant.now());

        return utmRepository.save(profile);
    }

    @Transactional
    public void deleteUtmProfile(UUID utmId) {
        // Guard Clause: Validate existence
        if (!utmRepository.existsById(utmId)) {
            throw new IllegalArgumentException("UTM profile not found");
        }

        // Happy Path
        utmRepository.deleteById(utmId);
    }

    public List<UtmProfile> getUtmProfiles(UUID urlMappingId, UUID userId) {
        // Guard Clause 1: Validate parent URL exists
        UrlMapping mapping = urlRepository.findById(urlMappingId)
                .orElseThrow(() -> new IllegalArgumentException("URL mapping not found"));

        // Guard Clause 2: Validate ownership
        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to access UTM profiles for this URL");
        }

        return utmRepository.findByUrlMappingId(urlMappingId);
    }

    public UtmProfile getUtmProfile(UUID utmProfileId, UUID userId) {
        // Guard Clause 1: Validate UTM profile exists
        UtmProfile profile = utmRepository.findById(utmProfileId)
                .orElseThrow(() -> new IllegalArgumentException("UTM profile not found"));

        // Guard Clause 2: Validate parent URL ownership
        UrlMapping mapping = urlRepository.findById(profile.getUrlMappingId())
                .orElseThrow(() -> new IllegalArgumentException("Parent URL mapping not found"));

        if (!mapping.getUserId().equals(userId)) {
            throw new IllegalStateException("Unauthorized to access this UTM profile");
        }

        return profile;
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    private String generateUniqueShortCode() {
        String shortCode;
        do {
            shortCode = base62.generateRandomShortCode(7);
        } while (urlRepository.existsByShortCode(shortCode));
        return shortCode;
    }

    private void saveDefaultUtmProfile(UUID urlMappingId, CreateUrlRequest request) {
        UtmProfile profile = UtmProfile.builder()
                .urlMappingId(urlMappingId)
                .name("Default Campaign")
                .utmSource(request.utmSource())
                .utmMedium(request.utmMedium())
                .utmCampaign(request.utmCampaign())
                .utmTerm(request.utmTerm())
                .utmContent(request.utmContent())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        utmRepository.save(profile);
    }

    private boolean hasUtmParams(CreateUrlRequest request) {
        return request.utmSource() != null || request.utmCampaign() != null || request.utmMedium() != null;
    }

    private void evictRedirectCache(String shortCode) {
        try {
            redisTemplate.delete("url:redirect:" + shortCode);
        } catch (Exception ignored) {}
    }

    private String appendUtmParams(CreateUrlRequest request) {
        // Guard Clause: If no UTM params, return base URL directly
        if (!hasUtmParams(request)) {
            return request.destinationUrl();
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(request.destinationUrl());
        if (request.utmSource() != null && !request.utmSource().isBlank()) builder.queryParam("utm_source", request.utmSource());
        if (request.utmMedium() != null && !request.utmMedium().isBlank()) builder.queryParam("utm_medium", request.utmMedium());
        if (request.utmCampaign() != null && !request.utmCampaign().isBlank()) builder.queryParam("utm_campaign", request.utmCampaign());
        if (request.utmTerm() != null && !request.utmTerm().isBlank()) builder.queryParam("utm_term", request.utmTerm());
        if (request.utmContent() != null && !request.utmContent().isBlank()) builder.queryParam("utm_content", request.utmContent());
        return builder.build().toUriString();
    }
}
```

---

### 3. `UrlCoreController.java` (Complete REST API Endpoints)
File: `core/src/main/java/com/urlshortener/core/controller/UrlCoreController.java`

```java
package com.urlshortener.core.controller;

import com.urlshortener.core.dto.CreateUrlRequest;
import com.urlshortener.core.dto.CreateUtmRequest;
import com.urlshortener.core.dto.UpdateUrlRequest;
import com.urlshortener.core.dto.UpdateUtmRequest;
import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.entity.UtmProfile;
import com.urlshortener.core.service.UrlCoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/urls")
@RequiredArgsConstructor
public class UrlCoreController {

    private final UrlCoreService urlCoreService;

    // --- URL ENDPOINTS ---

    @PostMapping
    public ResponseEntity<UrlMapping> createShortUrl(
            @Valid @RequestBody CreateUrlRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.createShortUrl(request, userId));
    }

    @GetMapping
    public ResponseEntity<List<UrlMapping>> getUserUrls(
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUserUrls(userId));
    }

    @GetMapping("/{urlId}")
    public ResponseEntity<UrlMapping> getUrl(
            @PathVariable UUID urlId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUrl(urlId, userId));
    }

    @GetMapping("/short/{shortCode}")
    public ResponseEntity<Optional<UrlMapping>> getUrlFromShortCode(@PathVariable String shortCode) {
        return ResponseEntity.ok(urlCoreService.getUrlFromShortCode(shortCode));
    }

    @PutMapping("/{urlId}")
    public ResponseEntity<UrlMapping> updateShortUrl(
            @PathVariable UUID urlId,
            @Valid @RequestBody UpdateUrlRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.updatedShortUrl(urlId, request, userId));
    }

    @DeleteMapping("/{urlId}")
    public ResponseEntity<Void> deleteShortUrl(
            @PathVariable UUID urlId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        urlCoreService.deleteShortUrl(urlId, userId);
        return ResponseEntity.noContent().build();
    }

    // --- UTM PROFILE ENDPOINTS ---

    @PostMapping("/{urlId}/utm")
    public ResponseEntity<UtmProfile> addUtmProfile(
            @PathVariable UUID urlId,
            @Valid @RequestBody CreateUtmRequest request) {
        return ResponseEntity.ok(urlCoreService.addUtmProfile(urlId, request));
    }

    @GetMapping("/{urlId}/utm")
    public ResponseEntity<List<UtmProfile>> getUtmProfiles(
            @PathVariable UUID urlId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUtmProfiles(urlId, userId));
    }

    @GetMapping("/utm/{utmId}")
    public ResponseEntity<UtmProfile> getUtmProfile(
            @PathVariable UUID utmId,
            @RequestHeader(value = "X-User-Id", defaultValue = "00000000-0000-0000-0000-000000000001") UUID userId) {
        return ResponseEntity.ok(urlCoreService.getUtmProfile(utmId, userId));
    }

    @PutMapping("/utm/{utmId}")
    public ResponseEntity<UtmProfile> updateUtmProfile(
            @PathVariable UUID utmId,
            @RequestBody UpdateUtmRequest request) {
        return ResponseEntity.ok(urlCoreService.updateUtmProfile(utmId, request));
    }

    @DeleteMapping("/utm/{utmId}")
    public ResponseEntity<Void> deleteUtmProfile(@PathVariable UUID utmId) {
        urlCoreService.deleteUtmProfile(utmId);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Module 6: Step-by-Step Testing & Verification Guide

### 1. Test gRPC Endpoint via `grpcurl`
```bash
grpcurl -plaintext -d '{"short_code": "1234"}' localhost:9090 com.urlshortener.grpc.UrlService/GetDestinationUrl
```

---

## Summary
The Core Service manages:
1. Shortcode generation via **Base62**.
2. URL mapping CRUD on database **`url_shortener_core`**.
3. High-performance binary **gRPC Server on port 9090**.
