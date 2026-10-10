# Comprehensive API Endpoints Reference & Service Catalog

This document is the complete, canonical API reference for all **4 microservices** and supporting infrastructure across the **urlShortener** distributed platform.

---

## 1. System Architecture & Port Mapping

In Docker environments, all external client traffic communicates strictly through the **Nginx Edge Ingress** on port 80:
- **`http://localhost`**: Serves the compiled static React SPA and proxies API routes (`/api/v1/**`) to API Gateway (`:8080`).
- **`http://r.localhost/{shortCode}`**: Dedicated high-throughput clean redirect edge directly proxying to the Redirect Service (`:8082`).

In local standalone development, services can also be reached on their direct ports:

| Service Name | Artifact / Directory | Protocol / Port | External / Internal Role |
| :--- | :--- | :--- | :--- |
| **Nginx Edge Ingress** | `nginx` | HTTP **`:80`** | **Public Perimeter**. Serves React SPA, proxies `/api/*` to Gateway, routes `r.localhost` redirects, and executes edge rate limiting. |
| **API Gateway** | `apigateway` | HTTP/WebFlux **`:8080`** | Central security perimeter, JWT auth, HttpOnly RTR cookies, OAuth2, and REST microservice routing. |
| **Core Service** | `core` | HTTP **`:8081`**<br>gRPC **`:9090`** | URL CRUD, Base62 encoding, UTM profiles, tenant mapping, gRPC resolution server. |
| **Redirect Service** | `redirect` | HTTP/WebFlux **`:8082`** | Sub-2ms HTTP 302 redirects, Consolidated Redis Hash cache, Kafka click publishing. |
| **Analytics Service** | `analytics` | HTTP **`:8083`**<br>gRPC **`:9091`** | Kafka `url-clicks` ingestion, MaxMind GeoIP2 resolution, UA/bot parsing, jOOQ telemetry queries. |
| **PostgreSQL** | Docker | TCP **`:5432`** | Databases: `url_shortener_auth`, `url_shortener_core`, `url_shortener_analytics`. |
| **Redis** | Docker | TCP **`:6379`** | In-memory cache for consolidated URL hashes (`url:{code}`) and hit counters (`url:hits:{code}`). |
| **Apache Kafka** | Docker | TCP **`:9092`** | High-throughput event streaming broker (Topic: `url-clicks`). |
| **React Frontend** | `client` | HTTP **`:80`** (Prod) / **`:5173`** (Dev) | Single Page Application (SPA) built with React 19, Vite, Tailwind CSS v4, and shadcn UI. |

---

## 2. API Gateway & Authentication Service (`apigateway` :8080)

The Gateway handles authentication natively and forwards authorized downstream requests with the injected `X-User-Id` header.

### 2.1 User Registration
- **Method / Path:** `POST /api/v1/auth/register`
- **Auth Required:** No (Public)
- **Description:** Registers a new user with email, username, and password. Issues a JWT access token and sets an `HttpOnly` refresh token cookie.
- **Request Body:**
  ```json
  {
    "username": "alex",
    "email": "alex@example.com",
    "password": "Password123"
  }
  ```
- **Response (`201 Created` + `Set-Cookie: refreshToken=...`):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
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

---

### 2.2 User Login
- **Method / Path:** `POST /api/v1/auth/login`
- **Auth Required:** No (Public)
- **Description:** Authenticates credentials. Returns in-memory JWT access token and attaches secure `HttpOnly` refresh cookie.
- **Request Body:**
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123"
  }
  ```
- **Response (`200 OK` + `Set-Cookie: refreshToken=...`):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
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

---

### 2.3 Silent Token Refresh (RTR)
- **Method / Path:** `POST /api/v1/auth/refresh`
- **Auth Required:** No (Uses `HttpOnly` cookie or body)
- **Description:** Rotates the refresh token in PostgreSQL, renews the `HttpOnly` cookie, and returns a fresh JWT access token + user object.
- **Request:** Automatic via cookie (`withCredentials: true`) or optional JSON body `{"refreshToken": "..."}`.
- **Response (`200 OK` + `Set-Cookie: refreshToken=<new_token>`):**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
    "refreshToken": "7c3d2e1a-...",
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

---

### 2.4 User Logout
- **Method / Path:** `POST /api/v1/auth/logout`
- **Auth Required:** No
- **Description:** Clears the client-side `HttpOnly` refresh cookie (`Max-Age=0`).
- **Response (`200 OK` + `Set-Cookie: refreshToken=; Max-Age=0`):**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

### 2.5 OAuth2 Authorization URL
- **Method / Path:** `GET /api/v1/auth/oauth2/{provider}/login`
- **Providers:** `google`, `github`
- **Description:** Returns the third-party OAuth authorization consent URL.
- **Response (`200 OK`):**
  ```json
  {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&scope=openid%20email%20profile"
  }
  ```

---

### 2.6 OAuth2 Provider Callback
- **Method / Path:** `GET /api/v1/auth/oauth2/{provider}/callback?code={authCode}`
- **Description:** Exchanges authorization code for provider user details, unifies account by email, attaches `HttpOnly` cookie, and issues an **`HTTP 302 Found`** redirect to `${app.frontend-url}/oauth2/callback?...`.
- **Response (`302 Found`):**
  `Location: http://localhost:5173/oauth2/callback?accessToken=...&refreshToken=...&id=...&username=...&email=...&role=USER`

---

### 2.7 Gateway Health Status
- **Method / Path:** `GET /health` or `GET /api/v1/health`
- **Response (`200 OK`):**
  ```json
  {
    "status": "UP",
    "service": "api-gateway",
    "timestamp": "2026-08-31T01:45:00Z"
  }
  ```

---

## 3. Core URL & Tenant Management Service (`core` :8081 & gRPC :9090)

All `/api/v1/urls/**` requests are routed via Gateway with JWT verification and `X-User-Id` injection.

### 3.1 Create Short URL
- **Method / Path:** `POST /api/v1/urls`
- **Header:** `Authorization: Bearer <token>`
- **Description:** Creates a new URL mapping. If `customAlias` is omitted, auto-generates a Base62 shortcode.
- **Request Body:**
  ```json
  {
    "destinationUrl": "https://spring.io/projects/spring-boot?utm_source=newsletter&utm_medium=email&utm_campaign=summer_promo",
    "customAlias": "spring-boot-docs",
    "campaignId": "4f938fae-cf71-4a3d-82d3-132d733c70f8"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "id": "77894469-5c04-4934-8f5a-a5993197cb04",
    "shortCode": "spring-boot-docs",
    "destinationUrl": "https://spring.io/projects/spring-boot?utm_source=newsletter&utm_medium=email&utm_campaign=summer_promo",
    "tenantId": "default",
    "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "isActive": true,
    "expiresAt": null,
    "createdAt": "2026-08-31T01:50:00Z",
    "updatedAt": "2026-08-31T01:50:00Z"
  }
  ```

---

### 3.2 Get User's URLs
- **Method / Path:** `GET /api/v1/urls`
- **Header:** `Authorization: Bearer <token>`
- **Description:** Lists all short URLs owned by the authenticated user (`X-User-Id`).
- **Response (`200 OK`):**
  ```json
  [
    {
      "id": "77894469-5c04-4934-8f5a-a5993197cb04",
      "shortCode": "spring-boot-docs",
      "destinationUrl": "https://spring.io/projects/spring-boot",
      "isActive": true,
      "createdAt": "2026-08-31T01:50:00Z"
    }
  ]
  ```

---

### 3.3 Get URL by ID
### 3.3 Get URL by ID or Slug
- **Method / Path:** `GET /api/v1/urls/{urlId}` or `GET /api/v1/urls/code/{shortCode}`
- **Header:** `Authorization: Bearer <token>`
- **Response (`200 OK`):** URL mapping entity details.

---

### 3.4 Update Short URL
- **Method / Path:** `PUT /api/v1/urls/{urlId}` or `PUT /api/v1/urls/code/{shortCode}`
- **Header:** `Authorization: Bearer <token>`
- **Validation Rules:**
  - `destinationUrl`: Must be a valid URL format (`http://` or `https://`).
  - `customAlias`: Optional, 1 to 64 alphanumeric characters, hyphens, or underscores (`^[a-zA-Z0-9_-]+$`).
- **Request Body:**
  ```json
  {
    "destinationUrl": "https://spring.io/projects/spring-framework",
    "customAlias": "spring-framework",
    "isActive": true,
    "expiresAt": "2026-12-31T23:59:59Z"
  }
  ```
- **Response (`200 OK`):** Updated URL mapping entity.

---

### 3.5 Delete Short URL
- **Method / Path:** `DELETE /api/v1/urls/{urlId}` or `DELETE /api/v1/urls/code/{shortCode}`
- **Header:** `Authorization: Bearer <token>`
- **Response (`204 No Content`):** URL mapping deleted. Redis cache key evicted immediately.

---

### 3.6 Campaign Management
- **`POST /api/v1/campaigns`**: Create a marketing campaign folder.
  - **Validation:** `name` is required (`@NotBlank`, 1–100 chars), `description` optional (max 500 chars).
  ```json
  {
    "name": "Summer Launch 2026",
    "description": "Multi-channel launch campaign across search and social"
  }
  ```
- **`GET /api/v1/campaigns`**: List campaigns. Supports pagination and search:
  - Query params: `page` (default: 0), `size` (default: 10), `search` (filter by name/description), `sortBy` (`name` | `createdAt`), `direction` (`ASC` | `DESC`).
  - If `page` is omitted, returns a flat array of all user campaigns.
- **`GET /api/v1/campaigns/{id}`**: Get campaign details by UUID along with aggregated link counts.
- **`PUT /api/v1/campaigns/{id}`**: Update campaign metadata:
  ```json
  {
    "name": "Summer Launch 2026 - Extended",
    "description": "Extended multi-channel campaign"
  }
  ```
- **`GET /api/v1/campaigns/{id}/urls`**: Retrieve all short URLs assigned to the campaign.
- **`DELETE /api/v1/campaigns/{id}`**: Delete campaign (associated links are unlinked by setting `campaign_id = NULL`, preserving the URLs).

---

### 3.7 A/B/n Multivariate Testing Management
The platform provides both top-level resource endpoints (`/api/v1/ab-tests`) and shortcode-scoped aliases (`/api/v1/urls/{shortCode}/ab-test`).

#### Top-Level Resource Endpoints:
- **`GET /api/v1/ab-tests`**: Paginated search across all user experiments:
  - Query params: `page` (int), `size` (int), `search` (name), `status` (`ACTIVE` | `PAUSED` | `CONCLUDED`), `sortBy`, `direction`.
- **`POST /api/v1/ab-tests`**: Create and launch an A/B test.
  - **Validation Rules:**
    - `shortCode`: Required, 1 to 64 chars (`@NotBlank`).
    - `name`: Required, 1 to 100 chars (`@NotBlank`).
    - `cookieTtlSeconds`: Integer, minimum 60 seconds (defaults to 2,592,000 / 30 days).
    - `variants`: Minimum 2 variants, maximum 4 variants. Variant weights must sum to **exactly 100%**. Each destination URL must be valid.
  ```json
  {
    "shortCode": "summer-promo",
    "name": "Summer Landing Page Copy Test",
    "cookieTtlSeconds": 2592000,
    "variants": [
      { "key": "A", "destinationUrl": "https://site.com/v1", "weight": 50, "isControl": true },
      { "key": "B", "destinationUrl": "https://site.com/v2", "weight": 50, "isControl": false }
    ]
  }
  ```
- **`GET /api/v1/ab-tests/{id}`**: Get experiment configuration, variant distributions, and current status.
- **`PUT /api/v1/ab-tests/{id}`**: Update experiment variants, weights (must sum to 100%), and cookie TTL.
- **`PUT /api/v1/ab-tests/{id}/status`**: Lifecycle transitions:
  ```json
  {
    "status": "CONCLUDED",
    "winningVariant": "B"
  }
  ```
- **`DELETE /api/v1/ab-tests/{id}`**: Deletes the test. Traffic routing reverts to the short link's original default destination URL.

#### Shortcode-Scoped Aliases:
- **`GET /api/v1/ab-tests/code/{shortCode}`** or **`GET /api/v1/urls/{shortCode}/ab-test`**: Retrieve test by shortcode.
- **`POST /api/v1/urls/{shortCode}/ab-test`**: Configure test using path shortcode.
- **`PUT /api/v1/urls/{shortCode}/ab-test/status`**: Update status using path shortcode.
- **`DELETE /api/v1/urls/{shortCode}/ab-test`**: Delete test using path shortcode.

---

### 3.8 gRPC Server Interface (`port: 9090`)
Core hosts the binary **`UrlService`** interface defined in `url_service.proto`:

```protobuf
service UrlService {
  rpc GetDestinationUrl (UrlRequest) returns (UrlResponse);
  rpc CreateUrlMapping (CreateUrlRequest) returns (CreateUrlResponse);
}

message UrlResponse {
  string destination_url = 1;
  bool is_active = 2;
  bool is_found = 3;
  string short_code = 4;
  string ab_rules_json = 5;      // A/B test active variants and weights configuration
  string smart_rules_json = 6;   // Device and Geo targeting rules
}
```

- **Resilience**: Configured with keepalive permit settings (`permit-keep-alive-time: 10s`, `permit-keep-alive-without-calls: true`) to maintain persistent channel health with the Redirect service.

---

## 4. High-Throughput Redirection Service (`redirect` :8082)

Routed through Nginx Edge Ingress on `http://r.localhost/{shortCode}` (clean redirect format), Gateway at `http://localhost/r/{shortCode}`, or directly at `:8082/r/{shortCode}`.

### 4.1 Execute URL Redirection
- **Method / Path:** `GET /{shortCode}` (on `r.localhost`) or `GET /r/{shortCode}`
- **Auth Required:** No (Public High-Throughput Endpoint)
- **Execution Flow:**
  1. Concurrently checks **Consolidated Redis Hash** (`url:{shortCode}`) and increments popularity counter (`url:hits:{shortCode}`) via reactive `Mono.zip`.
  2. If Cache Miss: Queries Core Service over **gRPC (`:9090`)** with a 5-second deadline and stores consolidated hash payload (`targetUrl`, `urlId`, `campaignId`, `abTestId`, `smartRules`, `abConfig`) with dynamic adaptive TTL.
  3. **Device Deep-Link Evaluation**: If smart rules match incoming User-Agent (iOS / Android / Desktop), overrides target URL.
  4. **A/B Test Evaluation**: If A/B rules exist, checks for sticky visitor cookie (`ab_{shortCode}`). If absent, evaluates cumulative weighted random distribution, selects variant, and attaches `Set-Cookie` header.
  5. Emits an asynchronous, non-blocking click event to Kafka (`url-clicks`) carrying IP, User-Agent, Referrer, UTM parameters, and selected variant.
  6. Returns **`HTTP 302 Found`** with target `Location` header.
- **Response (`302 Found`):**
  `Location: https://spring.io/projects/spring-boot`
- **Response on Inactive / Missing:** `404 Not Found`.

---

## 5. Telemetry & Analytics Service (`analytics` :8083)

Routed via Gateway at `http://localhost:8080/api/v1/analytics/**`. Powered by **jOOQ** for dynamic SQL filtering and multi-dimensional aggregations.

### 5.1 Comprehensive Analytics Overview by Shortcode
- **Method / Path:** `GET /api/v1/analytics/{shortCode}?days={N}&interval={INTERVAL}&timezone={TZ}&includeBots={bool}`
- **Header:** `Authorization: Bearer <token>`
- **Validation Rules:**
  - `shortCode`: `@NotBlank`, max 64 chars.
  - `days`: `@Min(1)`, `@Max(365)` (default: `30`).
  - `interval`: Optional `@Pattern` (`HOUR`, `DAY`, `WEEK`, `MONTH`).
  - `timezone`: Max 50 chars (default: `UTC`).
  - `includeBots`: Boolean (default: `false`).
- **Response (`200 OK`):**
  ```json
  {
    "shortCode": "summer-sale-2026",
    "totalClicks": 73,
    "humanClicks": 65,
    "botClicks": 8,
    "botPercentage": 10.9,
    "timeSeries": [
      { "timestamp": "2026-09-01T00:00:00Z", "clicks": 73 }
    ],
    "topCountries": [
      { "name": "United States", "count": 45, "percentage": 69.2 },
      { "name": "India", "count": 20, "percentage": 30.8 }
    ],
    "topCities": [
      { "city": "San Francisco", "country": "United States", "count": 25, "percentage": 38.5 }
    ],
    "topBrowsers": [
      { "name": "Chrome", "count": 40, "percentage": 61.5 },
      { "name": "Safari", "count": 25, "percentage": 38.5 }
    ],
    "topOperatingSystems": [
      { "name": "macOS", "count": 35, "percentage": 53.8 },
      { "name": "Windows", "count": 30, "percentage": 46.2 }
    ],
    "topDevices": [
      { "name": "Desktop", "count": 50, "percentage": 76.9 },
      { "name": "Mobile", "count": 15, "percentage": 23.1 }
    ],
    "topReferrers": [
      { "name": "https://github.com", "count": 30, "percentage": 46.2 },
      { "name": "Direct / None", "count": 35, "percentage": 53.8 }
    ]
  }
  ```

---

### 5.2 Analytics Overview by URL UUID
- **Method / Path:** `GET /api/v1/analytics/urls/{urlId}?days={N}&includeBots={bool}`
- **Description:** Returns the complete metrics overview queried directly by the primary URL UUID.

---

### 5.3 Dedicated Campaign-Level Rollup Analytics
- **Method / Path:** `GET /api/v1/analytics/campaigns/{campaignId}?days={N}&includeBots={bool}`
- **Header:** `Authorization: Bearer <token>`
- **Description:** Uses single-query jOOQ joins across all URLs assigned to the campaign to aggregate total traffic, bot breakdown, conversion rates, and top-performing links within that campaign.

---

### 5.4 Dedicated A/B Test Experiment Analytics
- **Method / Path:** `GET /api/v1/analytics/ab-tests/{identifier}?days={N}&includeBots={bool}`
- **Header:** `Authorization: Bearer <token>`
- **Identifier:** Supports either the experiment **UUID** or the **`shortCode`**.
- **Description:** Returns real-time variant traffic counts, percentage splits, statistical conversion rates, and confidence intervals to evaluate winning variants.

---

### 5.5 Granular Time-Series Graph Data
- **Method / Path:** `GET /api/v1/analytics/{shortCode}/timeseries?interval={HOUR|DAY}&days={N}`
- **Header:** `Authorization: Bearer <token>`
- **Response (`200 OK`):** Point array formatted for Recharts / Chart.js:
  ```json
  [
    { "timestamp": "2026-09-01T01:00:00Z", "clicks": 42 },
    { "timestamp": "2026-09-01T02:00:00Z", "clicks": 31 }
  ]
  ```

---

### 5.6 Breakdown Sub-Endpoints
- **`GET /api/v1/analytics/{shortCode}/countries?includeBots=false&limit=10`**: Top visitor countries.
- **`GET /api/v1/analytics/{shortCode}/browsers?includeBots=false&limit=10`**: Top browsers.
- **`GET /api/v1/analytics/{shortCode}/referrers?includeBots=false&limit=10`**: Top referrer domains.

---

### 5.7 Kafka Batch Ingestion & JDBC Multi-Row Ingestion
- **Topic Consumed:** `url-clicks`
- **Consumer Mechanism:** Kafka Batch Listener (`ClickEventConsumer`) with configurable batch size (`batch.size=100`, `poll.timeout=500ms`).
- **Bulk Insert Engine:** `ClickAnalyticsBatchRepository` constructs multi-row PostgreSQL `INSERT INTO click_analytics (...) VALUES (...), (...)...` statements, bypassing Hibernate single-row overhead to sustain >50,000 writes/sec.

---

## 6. Unified Error Response & Validation Schema

All microservices (`apigateway`, `core`, `analytics`) utilize centralized Spring `@RestControllerAdvice` global exception handlers conforming to RFC-7807 problem details.

### 6.1 Validation Failure (`400 Bad Request`)
When JSR-380 Bean Validation fails on `@Valid` request bodies or parameters:
```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Experiment name is required.",
  "fieldErrors": {
    "name": "Experiment name is required.",
    "shortCode": "Short code cannot exceed 64 characters"
  },
  "timestamp": "2026-09-28T00:20:00Z"
}
```

### 6.2 Entity Not Found (`404 Not Found`)
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "URL mapping not found for short code: unknown-slug",
  "timestamp": "2026-09-28T00:20:00Z"
}
```

### 6.3 Authentication & Authorization Failures (`401` / `403`)
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "timestamp": "2026-09-28T00:20:00Z"
}
```

---

## 7. End-to-End cURL Command Cheat Sheet

```bash
# 1. Login & Extract Bearer Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"Password123"}' | jq -r '.accessToken')

# 2. Create Short URL with Custom Alias (Up to 64 chars)
curl -X POST http://localhost:8080/api/v1/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"destinationUrl":"https://spring.io/projects/spring-boot","customAlias":"spring-boot-docs"}'

# 3. Create A/B Test Experiment
curl -X POST http://localhost:8080/api/v1/ab-tests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "shortCode": "spring-boot-docs",
    "name": "Docs Landing Test",
    "variants": [
      {"key": "A", "destinationUrl": "https://spring.io/projects/spring-boot", "weight": 50, "isControl": true},
      {"key": "B", "destinationUrl": "https://docs.spring.io/spring-boot/index.html", "weight": 50, "isControl": false}
    ]
  }'

# 4. Perform Redirection (Follows 302 and sets cookie)
curl -i http://localhost:8080/r/spring-boot-docs

# 5. Fetch Real-Time A/B Test Analytics
curl -X GET http://localhost:8080/api/v1/analytics/ab-tests/spring-boot-docs \
  -H "Authorization: Bearer $TOKEN"
```

