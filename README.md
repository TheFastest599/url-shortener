# HiClickMe — Enterprise Multi-Tenant URL Shortener Platform 🚀

A high-throughput, event-driven URL shortening and analytics platform built with **Java 17, Spring Boot 3, Spring Cloud Gateway, Reactive WebFlux, gRPC, jOOQ, PostgreSQL, Redis, Apache Kafka (KRaft), Nginx, and React 19 (Vite)**.

---

## 🏛️ System Architecture & Ingress Matrix

```text
[ Browser / Client: http://localhost (Port 80) ]
                       │
                       ▼
       ┌───────────────────────────────┐
       │     nginx-ingress (Port 80)   │
       │   (Reverse Proxy + React SPA) │
       └───────────────┬───────────────┘
                       │ (Internal Docker Network: url-shortener-net)
       ┌───────────────┴───────────────────────────────┐
       │                                               │
       ▼ (Route: '/r/**', '/s/**')                     ▼ (Route: '/api/**')
┌───────────────┐                             ┌────────────────┐
│ redirect:8082 │                             │ apigateway:8080│
│ (Fast Engine) │                             │ (Cloud Gateway)│
└───────┬───────┘                             └───┬────────┬───┘
        │                                         │        │
        ├──────────────────────────┐              │        │
        │                          │              ▼        ▼
        ▼ (gRPC:9090)              ▼        ┌──────────┐ ┌───────────────┐
┌───────────────┐            ┌───────────┐  │ core:8081│ │ analytics:8083│
│   core:9090   │            │   redis   │  └────┬─────┘ └───────┬───────┘
└───────┬───────┘            └───────────┘       │               │
        │                          ▲             │               │
        └──────────────────────────┼─────────────┘               │
                                   │                             ▼
                                   │                     ┌───────────────┐
                                   └──────► [ Kafka ] ──►│ postgres:5432 │
                                            ("url-clicks")│ (analytics)   │
                                                         └───────────────┘
```

### 🔒 Host Port Exposure & Isolation Matrix

Only **Nginx Ingress** publishes a port (`80`) to the host machine. All databases, message brokers, and internal microservices run isolated inside the private Docker bridge network (`url-shortener-net`):

| Service | Internal Port | Host Port Exposed | Role & Routing |
| :--- | :--- | :--- | :--- |
| **Nginx Ingress** | `80` | **`80:80`** | Single public entrypoint. Serves React SPA at `/` and proxies `/r/`, `/s/`, and `/api/`. |
| **React Client** | `80` | *Built into Nginx* | Single Page Application bundled directly into the Nginx image. |
| **`redirect`** | `8082` | *Internal only* | Sub-5ms reactive redirect engine (302 redirects, Redis cache, Kafka producer). |
| **`apigateway`** | `8080` | *Internal only* | Spring Cloud Gateway (JWT authentication, role authorization, routing). |
| **`core`** | `8081` (REST), `9090` (gRPC) | *Internal only* | URL & UTM management, campaigns, A/B testing, gRPC resolution engine. |
| **`analytics`** | `8083` (REST), `9091` (gRPC) | *Internal only* | Kafka batch consumer, MaxMind GeoIP resolution, time-series aggregations. |
| **PostgreSQL** | `5432` | *Internal only* | Multi-database instance (`url_shortener_auth`, `url_shortener_core`, `url_shortener_analytics`). |
| **Redis** | `6379` | *Internal only* | In-memory cache for fast link lookup & distributed rate limiting. |
| **Kafka (KRaft)**| `29092` | *Internal only* | High-throughput event stream for click tracking (`url-clicks` topic). |

---

## 🐳 Running with Docker Compose (Production End-to-End)

The entire platform—including in-Docker Maven compilation for all 4 Spring Boot microservices, Node.js compilation for the React frontend, database initialization, and Nginx reverse proxying—builds and boots with a single command.

### 1. Build and Start All Services
```bash
docker compose up --build -d
```

### 2. Verify Container Health & Status
```bash
docker compose ps
```
All containers will start in deterministic dependency order:
1. `postgres`, `redis`, and `kafka` boot and pass health checks (`service_healthy`).
2. `core` and `analytics` initialize their database schemas and gRPC listeners.
3. `redirect` and `apigateway` connect to cache, brokers, and upstream services.
4. `nginx` serves the unified frontend and routing.

### 3. Stream Container Logs
```bash
# View live logs across all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f apigateway
docker compose logs -f redirect
docker compose logs -f core
docker compose logs -f analytics
docker compose logs -f nginx
```

### 4. Access the Platform
* **Web UI (React SPA):** [http://localhost](http://localhost)
* **Short Link Redirection:** `http://localhost/r/{shortCode}` or `http://localhost/s/{shortCode}`
* **API Gateway Health Check:** `http://localhost/api/v1/health`
* **Public Auth Endpoints:** `http://localhost/api/v1/auth/login`, `http://localhost/api/v1/auth/register`

### 5. Rebuilding a Specific Service After Code Edits
```bash
# Rebuild and restart only the core service
docker compose build core
docker compose up -d core

# Rebuild and restart Nginx & Frontend
docker compose build nginx
docker compose up -d nginx
```

### 6. Stopping & Resetting
```bash
# Stop all running containers
docker compose down

# Stop all containers and wipe persistent volumes (Postgres DBs, Redis cache, Kafka data)
docker compose down -v
```

---

## 💻 Local Hybrid Development (Optional for Hot-Reloading)

If you are developing locally and prefer hot-reloading in your IDE and Vite dev server:

### Step 1: Start Shared Infrastructure
```bash
docker compose up postgres redis kafka -d
```

### Step 2: Run Microservices (Separate Terminals)
```bash
# Terminal 1: API Gateway (Port 8080)
cd apigateway && mvn spring-boot:run

# Terminal 2: Core Service (REST 8081 / gRPC 9090)
cd core && mvn spring-boot:run

# Terminal 3: Redirect Service (Port 8082)
cd redirect && mvn spring-boot:run

# Terminal 4: Analytics Service (Port 8083)
cd analytics && mvn spring-boot:run
```

### Step 3: Run React Client (Vite Dev Server)
```bash
cd client
npm install
npm run dev
```
Access the dev server at `http://localhost:5173`.

---

## 🗄️ Database Initialization

The PostgreSQL container automatically runs [scripts/init.sql](scripts/init.sql) on its first boot to create the isolated databases:
* `url_shortener_auth` — Managed by `apigateway` (Flyway migrations for users, roles, tokens)
* `url_shortener_core` — Managed by `core` (Flyway migrations for URL mappings, campaigns, A/B tests)
* `url_shortener_analytics` — Managed by `analytics` (Flyway migrations for click events, geo-data)

---

## 📚 Deep-Dive Architecture & Component Guides

* **[Docker Orchestration Guide](docs/docker.md)** — In-depth breakdown of multi-stage Maven builds, Spring profiles (`default` vs `docker`), dependency ordering, and volumes.
* **[Nginx Ingress & Reverse Proxy Guide](docs/nginx.md)** — Complete reference for reverse proxy routing, React SPA compilation, caching, and security headers.
* **[API Endpoints Reference & Service Catalog](docs/api_endpoints_reference.md)** — Complete catalog of all HTTP REST endpoints, gRPC methods, Kafka events, and cURL cheat sheets.
* **[Master Architecture & Design Doc](docs/url_shortener_design_doc.md)** — High-level distributed systems design, data models, and caching strategies.
* **[API Gateway & Security Guide](docs/api_gateway_security_guide.md)** — JWT authentication filter chain, BCrypt, reactive security, and rate limiting.
* **[Core Service Guide](docs/core_service_guide.md)** — Base62 generation, smart routing, UTM templates, campaigns, and gRPC server.
* **[Redirect Service Guide](docs/redirect_service_guide.md)** — Sub-5ms reactive redirects, adaptive TTL caching, and asynchronous Kafka click tracking.
* **[Analytics Service Guide](docs/analytics_service_guide.md)** — Kafka stream ingestion, MaxMind GeoIP resolution, bot detection, and SQL time-series projections.
