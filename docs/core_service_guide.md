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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
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
import com.urlshortener.grpc.*;
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

        if (mappingOpt.isPresent()) {
            UrlMapping mapping = mappingOpt.get();
            UrlResponse response = UrlResponse.newBuilder()
                    .setShortCode(mapping.getShortCode())
                    .setDestinationUrl(mapping.getDestinationUrl())
                    .setIsActive(mapping.getIsActive())
                    .setIsFound(true)
                    .build();
            responseObserver.onNext(response);
        } else {
            UrlResponse response = UrlResponse.newBuilder()
                    .setShortCode(request.getShortCode())
                    .setIsFound(false)
                    .build();
            responseObserver.onNext(response);
        }
        responseObserver.onCompleted();
    }
}
```

---

## Module 5: Core URL Management Service & REST Controllers

### 1. `UrlCoreService.java`
File: `core/src/main/java/com/urlshortener/core/service/UrlCoreService.java`

```java
package com.urlshortener.core.service;

import com.urlshortener.core.entity.UrlMapping;
import com.urlshortener.core.repository.UrlMappingRepository;
import com.urlshortener.core.util.Base62;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UrlCoreService {

    private final UrlMappingRepository repository;
    private final Base62 base62;

    @Transactional
    public UrlMapping createShortUrl(String destinationUrl, String customAlias, UUID userId) {
        String shortCode;

        if (customAlias != null && !customAlias.isBlank()) {
            if (repository.existsByShortCode(customAlias)) {
                throw new IllegalArgumentException("Custom alias already in use");
            }
            shortCode = customAlias;
        } else {
            do {
                shortCode = base62.generateRandomShortCode(7);
            } while (repository.existsByShortCode(shortCode));
        }

        UrlMapping mapping = UrlMapping.builder()
                .shortCode(shortCode)
                .destinationUrl(destinationUrl)
                .tenantId("default")
                .userId(userId)
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return repository.save(mapping);
    }

    public List<UrlMapping> getUserUrls(UUID userId) {
        return repository.findByUserId(userId);
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
