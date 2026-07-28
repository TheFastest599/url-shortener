# API Gateway (`url-gateway-service`) Implementation Plan

## 1. Project Overview & Role
The **API Gateway** (`url-gateway-service`) acts as the single edge entrypoint for external traffic on port `8080`. It handles reverse proxy routing, reactive security (AuthN/AuthZ with JWT and OAuth2), Redis-backed edge rate limiting, and REST-to-gRPC protocol translation for downstream microservices.

---

## 2. Core Technical Architecture & Dependencies

### Technology Stack
* **Framework:** Spring Boot 3.2+ with Spring Cloud Gateway (Reactive WebFlux)
* **Database Driver:** Spring Data R2DBC + PostgreSQL Reactive (`r2dbc-postgresql`)
* **Security:** Spring Security Reactive (`@EnableWebFluxSecurity`), JJWT (`0.12.5`), BCrypt
* **Caching & Rate Limiting:** Spring Data Redis Reactive (`ReactiveStringRedisTemplate`) + Lua Scripts
* **Inter-Service Communication:** gRPC Client (`net.devh:grpc-client-spring-boot-starter`)

### Port & Database Assignment
* **HTTP Port:** `8080`
* **Target Database:** `hiclickme_auth` (hosted on single PostgreSQL instance `:5432`)

---

## 3. Step-by-Step Execution Plan

### Phase 1: Project & Build Setup (`pom.xml` & `application.yml`)
1. **Refactor Maven Metadata:**
   * Update `artifactId` to `url-gateway-service` and `name` to `API Gateway Service`.
2. **Add Reactive Dependencies:**
   * `spring-cloud-starter-gateway`
   * `spring-boot-starter-data-r2dbc` & `r2dbc-postgresql`
   * `spring-boot-starter-security` & `spring-boot-starter-data-redis-reactive`
   * `io.jsonwebtoken` (api, impl, jackson)
   * `net.devh:grpc-client-spring-boot-starter` & Protobuf Maven plugin
3. **Configure `application.yml`:**
   * R2DBC URL: `r2dbc:postgresql://localhost:5432/hiclickme_auth`
   * Redis Connection: `localhost:6379`
   * Gateway Routes: Forward `/r/**` to `http://localhost:8082` (Redirect Service).

---

### Phase 2: Database Schema & R2DBC Entities (`hiclickme_auth`)
1. **Define Schema Migration Script (`schema.sql`):**
   * `users` (id, username, email, role, auth_type, created_at, updated_at)
   * `user_passwords` (id, user_id, password_hash, updated_at)
   * `user_oauth_credentials` (id, user_id, provider, provider_user_id, access_token, refresh_token, expires_at)
   * `refresh_tokens` (id, user_id, token, expiry_date, revoked, created_at)
2. **Build R2DBC Reactive Entity Models:**
   * `User.java`, `UserPassword.java`, `UserOAuthCredential.java`, `RefreshToken.java`
3. **Build Reactive Repositories:**
   * `UserRepository` (`ReactiveCrudRepository<User, Long>`)
   * `UserPasswordRepository` (`ReactiveCrudRepository<UserPassword, Long>`)
   * `RefreshTokenRepository` (`ReactiveCrudRepository<RefreshToken, Long>`)

---

### Phase 3: JWT Engine & Security Gating
1. **`JwtTokenProvider` Component:**
   * Generate short-lived access tokens (15 mins) with `userId`, `username`, `role`, and `tenantId` claims.
   * Generate long-lived refresh tokens (7 days).
   * Token parsing, signature verification, and expiration validation.
2. **Reactive Security Configuration (`SecurityConfiguration.java`):**
   * Disable CSRF (Stateless JWT mode).
   * Permit `/api/v1/auth/**` and `/r/**` public routes.
   * Enforce authentication on `/api/v1/dashboard/**` and all admin APIs.
   * Implement `BearerTokenSecurityContextRepository` to extract `Authorization: Bearer <token>` and populate Reactive `SecurityContext`.

---

### Phase 4: Auth Controllers & Service Implementation
1. **DTO Definitions:**
   * `RegisterRequest`, `LoginRequest`, `AuthResponse`, `RefreshTokenRequest`
2. **`AuthService.java` (Reactive Business Logic):**
   * `register()`: Check duplicate email/username $\rightarrow$ Hash password $\rightarrow$ Save user & password record $\rightarrow$ Return JWT + set `HttpOnly` refresh token cookie.
   * `login()`: Lookup user $\rightarrow$ Compare password hash $\rightarrow$ Issue JWT + set `HttpOnly` refresh token cookie.
   * `refresh()`: Validate refresh token against DB $\rightarrow$ Perform Refresh Token Rotation (RTR) $\rightarrow$ Return new Access Token.
   * `logout()`: Revoke refresh token in DB.
3. **`AuthController.java`:**
   * Expose reactive REST endpoints returning `Mono<ResponseEntity<AuthResponse>>`.

---

### Phase 5: Distributed Edge Rate Limiting
1. **Redis Lua Script (`request_rate_limiter.lua`):**
   * Implement atomic Token Bucket algorithm in Redis (refill rate: 1 token/sec, max bucket: 60 tokens).
2. **`GatewayRateLimitingFilter.java`:**
   * Implement Spring Cloud Gateway `GlobalFilter` and `Ordered`.
   * Check client IP (`rate:limit:global:<ip>`) reactively against Redis before passing request downstream.
   * Return HTTP `429 Too Many Requests` if token limit is exceeded.

---

### Phase 6: REST-to-gRPC Protocol Translation
1. **Protobuf Stub Generation:**
   * Include compiled `url_service.proto` stubs.
2. **`DashboardGatewayController.java`:**
   * Expose `/api/v1/dashboard/links`.
   * Intercept REST request + `@AuthenticationPrincipal UserPrincipal`.
   * Construct `CreateUrlMappingRequest` Protobuf object.
   * Call `url-core-service` via `@GrpcClient("url-core-service")`.
   * Map Protobuf response back to REST DTO.

---

## 4. Verification & Testing Strategy

### Automated Tests
* **Repository Tests:** Test R2DBC reactive queries against `hiclickme_auth`.
* **Security & Auth Tests:** Test `/api/v1/auth/register` and `/api/v1/auth/login` using `WebTestClient`.
* **Rate Limiter Test:** Fire 65 rapid requests and verify HTTP `429` response on the 61st request.

### Manual Verification
1. Run local PostgreSQL instance (`:5432`).
2. Run Gateway service (`:8080`).
3. Send POST request to `/api/v1/auth/register` via Postman/curl and verify JWT output + PostgreSQL table creation.
