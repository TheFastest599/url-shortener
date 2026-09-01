# Comprehensive API Endpoints Reference & Service Catalog

This document is the complete, canonical API reference for all **4 microservices** and supporting infrastructure across the **urlShortener** distributed platform.

---

## 1. System Architecture & Port Mapping

All external client traffic (Web UI, Mobile, Third-party APIs) communicates strictly through the **API Gateway** (`http://localhost:8080`).

| Service Name | Artifact / Directory | Protocol / Port | Internal Responsibilities |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `apigateway` | HTTP/WebFlux **`:8080`** | Central security perimeter, JWT auth, HttpOnly RTR cookies, OAuth2, and routing. |
| **Core Service** | `core` | HTTP **`:8081`**<br>gRPC **`:9090`** | URL CRUD, Base62 encoding, UTM profiles, tenant mapping, gRPC resolution server. |
| **Redirect Service** | `redirect` | HTTP/WebFlux **`:8082`** | Sub-15ms HTTP 302 redirects, Redis cache-aside, Kafka click publishing. |
| **Analytics Service** | `analytics` | HTTP **`:8083`**<br>gRPC **`:9091`** | Kafka `url-clicks` ingestion, MaxMind GeoIP2 resolution, UA/bot parsing, telemetry queries. |
| **PostgreSQL** | Docker | TCP **`:5432`** | Databases: `url_shortener_auth`, `url_shortener_core`, `url_shortener_analytics`. |
| **Redis** | Docker | TCP **`:6379`** | In-memory cache for hot URL mappings and adaptive hit counters. |
| **Apache Kafka** | Docker | TCP **`:9092`** | High-throughput event streaming broker (Topic: `url-clicks`). |
| **React Frontend** | `client` | HTTP **`:5173`** | Single Page Application (SPA) built with React, Vite, and TanStack Query. |

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
    "destinationUrl": "https://spring.io/projects/spring-boot",
    "customAlias": "spring-boot-docs",
    "utmSource": "newsletter",
    "utmMedium": "email",
    "utmCampaign": "summer_promo"
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
- **Method / Path:** `GET /api/v1/urls/{urlId}`
- **Header:** `Authorization: Bearer <token>`
- **Response (`200 OK`):** URL mapping entity details.

---

### 3.4 Get URL by Shortcode
- **Method / Path:** `GET /api/v1/urls/short/{shortCode}`
- **Description:** Internal/public query to inspect URL mapping by its slug.
- **Response (`200 OK`):** URL mapping entity details.

---

### 3.5 Update Short URL
- **Method / Path:** `PUT /api/v1/urls/{urlId}`
- **Header:** `Authorization: Bearer <token>`
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

### 3.6 Delete Short URL
- **Method / Path:** `DELETE /api/v1/urls/{urlId}`
- **Header:** `Authorization: Bearer <token>`
- **Response (`204 No Content`):** URL mapping deleted.

---

### 3.7 UTM Profile Sub-Resources
- **`POST /api/v1/urls/{urlId}/utm`**: Add a UTM campaign profile.
- **`GET /api/v1/urls/{urlId}/utm`**: List UTM profiles for a URL.
- **`GET /api/v1/urls/utm/{utmId}`**: Get specific UTM profile.
- **`PUT /api/v1/urls/utm/{utmId}`**: Update UTM profile.
- **`DELETE /api/v1/urls/utm/{utmId}`**: Delete UTM profile.

---

### 3.8 gRPC Server Interface (`port: 9090`)
Core hosts the binary **`UrlService`** interface defined in `url_service.proto`:

```protobuf
service UrlService {
  rpc GetDestinationUrl (UrlRequest) returns (UrlResponse);
  rpc CreateUrlMapping (CreateUrlRequest) returns (CreateUrlResponse);
}
```

- **`GetDestinationUrl`**: Used by Redirect service to fetch destination URLs on Redis cache misses.
- **`CreateUrlMapping`**: Programmatic creation via gRPC RPC.

---

## 4. High-Throughput Redirection Service (`redirect` :8082)

Routed via Gateway at `http://localhost:8080/r/{shortCode}`.

### 4.1 Execute URL Redirection
- **Method / Path:** `GET /r/{shortCode}` (or `GET /s/{shortCode}`)
- **Auth Required:** No (Public High-Throughput Endpoint)
- **Execution Flow:**
  1. Checks **Redis Cache** (`url:redirect:{shortCode}`).
  2. If Cache Miss: Queries Core Service over **gRPC (`:9090`)** and populates Redis with adaptive TTL.
  3. Emits a non-blocking click event to Kafka (`url-clicks`).
  4. Returns **`HTTP 302 Found`** with target `Location` header.
- **Response (`302 Found`):**
  `Location: https://spring.io/projects/spring-boot`
- **Response on Inactive / Missing:** `404 Not Found`.

---

## 5. Telemetry & Analytics Service (`analytics` :8083)

Routed via Gateway at `http://localhost:8080/api/v1/analytics/**`.

### 5.1 Comprehensive Analytics Overview
- **Method / Path:** `GET /api/v1/analytics/{shortCode}?days={N}&includeBots={bool}`
- **Header:** `Authorization: Bearer <token>`
- **Query Params:**
  - `days` (integer, default: `30`): Historical lookback window.
  - `includeBots` (boolean, default: `false`): Include/exclude automated scrapers.
- **Response (`200 OK`):**
  ```json
  {
    "shortCode": "e2e-4968",
    "totalClicks": 73,
    "humanClicks": 13,
    "botClicks": 60,
    "botPercentage": 82.2,
    "timeSeries": [
      {
        "timestamp": "2026-08-31T00:00:00Z",
        "clicks": 73
      }
    ],
    "topCountries": [
      { "name": "United States", "count": 8, "percentage": 61.5 },
      { "name": "India", "count": 5, "percentage": 38.5 }
    ],
    "topCities": [
      { "city": "San Francisco", "country": "United States", "count": 8, "percentage": 61.5 }
    ],
    "topBrowsers": [
      { "name": "Chrome", "count": 6, "percentage": 46.2 },
      { "name": "Firefox", "count": 4, "percentage": 30.8 },
      { "name": "Safari", "count": 3, "percentage": 23.1 }
    ],
    "topOperatingSystems": [
      { "name": "macOS", "count": 7, "percentage": 53.8 },
      { "name": "Windows", "count": 6, "percentage": 46.2 }
    ],
    "topDevices": [
      { "name": "Desktop", "count": 11, "percentage": 84.6 },
      { "name": "Mobile", "count": 2, "percentage": 15.4 }
    ],
    "topReferrers": [
      { "name": "https://github.com", "count": 5, "percentage": 38.5 },
      { "name": "https://twitter.com", "count": 4, "percentage": 30.8 },
      { "name": "Direct / None", "count": 4, "percentage": 30.8 }
    ]
  }
  ```

---

### 5.2 Granular Time-Series Graph Data
- **Method / Path:** `GET /api/v1/analytics/{shortCode}/timeseries?interval={HOUR|DAY}&days={N}`
- **Header:** `Authorization: Bearer <token>`
- **Description:** Returns point arrays for Chart.js / Recharts with hourly or daily bucket resolution.
- **Response (`200 OK`):**
  ```json
  [
    { "timestamp": "2026-08-31T01:00:00Z", "clicks": 42 },
    { "timestamp": "2026-08-31T02:00:00Z", "clicks": 31 }
  ]
  ```

---

### 5.3 Top Countries Breakdown
- **Method / Path:** `GET /api/v1/analytics/{shortCode}/countries?includeBots=false&limit=10`
- **Response (`200 OK`):** Array of `{ name, count, percentage }`.

---

### 5.4 Top Browsers Breakdown
- **Method / Path:** `GET /api/v1/analytics/{shortCode}/browsers?includeBots=false&limit=10`
- **Response (`200 OK`):** Array of `{ name, count, percentage }`.

---

### 5.5 Traffic Sources & Referrers
- **Method / Path:** `GET /api/v1/analytics/{shortCode}/referrers?includeBots=false&limit=10`
- **Response (`200 OK`):** Array of `{ name, count, percentage }`.

---

### 5.6 Kafka Event Consumer
- **Topic Consumed:** `url-clicks`
- **Payload (`ClickEvent`):**
  ```json
  {
    "shortCode": "e2e-4968",
    "timestamp": "2026-08-31T01:54:00Z",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
    "referrer": "https://github.com"
  }
  ```
- **Processing:** Resolves GeoIP country & city via MaxMind GeoLite2, detects bot scrapers, classifies device/browser/OS, and inserts into `click_analytics`.

---

## 6. End-to-End cURL Command Cheat Sheet

```bash
# 1. Login & Store Token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"Password123"}' | jq -r '.accessToken')

# 2. Create Short URL
curl -X POST http://localhost:8080/api/v1/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"destinationUrl":"https://spring.io/projects/spring-boot","customAlias":"my-spring-link"}'

# 3. Retrieve User URLs
curl -X GET http://localhost:8080/api/v1/urls \
  -H "Authorization: Bearer $TOKEN"

# 4. Perform Redirection (Follows 302)
curl -i http://localhost:8080/r/my-spring-link

# 5. Fetch Full Analytics Overview
curl -X GET http://localhost:8080/api/v1/analytics/my-spring-link \
  -H "Authorization: Bearer $TOKEN"
```
