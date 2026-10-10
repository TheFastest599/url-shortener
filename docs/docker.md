# Docker Orchestration Guide

Complete guide to the multi-container Docker Compose architecture, Spring profiles integration, container networking, and deployment lifecycle.

---

## 1. System Topology & Architecture

The entire platform runs as an isolated microservices mesh inside a single user-defined bridge network (`url-shortener-net`). Only the **Nginx Ingress** exposes a public port (`80:80`). All databases, message brokers, and backend microservices communicate strictly over private container DNS names.

```mermaid
graph TD
    ClientBrowser["🌐 Client / Browser"] -->|Port 80| NGINX["nginx-ingress (Port 80)"]

    subgraph External Ingress Routing
        NGINX -->|"Host: localhost (/)"| ReactSPA["React Vite SPA (Static HTML/JS)"]
        NGINX -->|"Host: localhost (/api/v1/*)"| GATEWAY["apigateway-service:8080"]
        NGINX -->|"Host: r.localhost (/*)<br/>or localhost (/r/*)"| REDIRECT["redirect-service:8082"]
    end

    subgraph Internal Docker Network [url-shortener-net]
        GATEWAY -->|HTTP REST| CORE["core-service:8081"]
        GATEWAY -->|HTTP REST| ANALYTICS["analytics-service:8083"]
        GATEWAY -->|R2DBC / JDBC| POSTGRES[("postgres-db:5432<br/>url_shortener_auth")]
        GATEWAY -->|Reactive Redis| REDIS[("redis-cache:6379")]

        REDIRECT -->|"Consolidated Hash url:{code}"| REDIS
        REDIRECT -->|"gRPC Channel :9090 Fallback"| CORE
        REDIRECT -->|"Async Event Stream"| KAFKA{{"kafka-broker:29092"}}

        ANALYTICS -->|"Consumer Batch (5k/5s)"| KAFKA
        ANALYTICS -->|"reWriteBatchedInserts"| POSTGRES

        CORE -->|"JPA / Flyway / jOOQ"| POSTGRES
        CORE -->|"Hash Eviction (DEL url:{code})"| REDIS
    end
```

---

## 2. Container Service Matrix

| Service | Container Name | Image / Base | Internal Port | Exposed Port | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **nginx** | `nginx-ingress` | `nginx:alpine` | `80` | `80:80` | Unified reverse proxy & SPA static web server |
| **apigateway** | `apigateway-service` | Temurin 17 JRE | `8080` | *None* | JWT Auth, OAuth2 callbacks, rate limiting |
| **redirect** | `redirect-service` | Temurin 17 JRE | `8082` | *None* | Sub-10ms URL redirection & Kafka event emitter |
| **core** | `core-service` | Temurin 17 JRE | `8081`, `9090` | *None* | URL shortener CRUD & gRPC server (port 9090) |
| **analytics** | `analytics-service` | Temurin 17 JRE | `8083`, `9091` | *None* | Kafka batch consumer & aggregations |
| **postgres** | `postgres-db` | `postgres:16-alpine` | `5432` | *None* | Relational database (Auth, Core, Analytics) |
| **redis** | `redis-cache` | `redis:7.2-alpine` | `6379` | *None* | Redirection cache & token-bucket rate limiter |
| **kafka** | `kafka-broker` | `cp-kafka:7.6.0` | `29092` | *None* | KRaft mode message broker (ClickEvents) |

---

## 3. Spring Profiles Architecture (`default` vs `docker`)

All Spring Boot microservices utilize **multi-document YAML configuration** with two operational profiles:

1. **`default` Profile (Host Machine / Local IDE)**:
   - Activated automatically during `mvn spring-boot:run` or local IDE execution.
   - Connects to services on `localhost` (`localhost:5432`, `localhost:6379`, `localhost:9092`).
   - Uses local OAuth callbacks: `http://localhost:8080/api/v1/auth/oauth2/{provider}/callback`.
   - Uses local frontend origin: `http://localhost:5173`.

2. **`docker` Profile (Container Mesh)**:
   - Activated automatically by `docker-compose.yml` via `SPRING_PROFILES_ACTIVE: docker`.
   - Hardcodes container DNS names (`postgres`, `redis`, `kafka:29092`, `core`).
   - Uses production OAuth callbacks: `http://localhost/api/v1/auth/oauth2/{provider}/callback`.
   - Uses production frontend origin: `http://localhost`.

### Why This Architecture Eliminates Configuration Drift
Because networking targets and callback URIs are baked into their respective profile declarations:
- You **never** need to change or comment/uncomment variables in `.env` when moving between local dev and Docker.
- `.env` files contain **strictly secrets and credentials** (`DB_PASSWORD`, `JWT_SECRET`, `CLIENT_ID`, `CLIENT_SECRET`).

---

## 4. Multi-Stage Dockerfile Strategy & JVM Memory Capping

All microservices utilize a dual-stage Docker build with Debian glibc for `protobuf-maven-plugin` compatibility and Alpine for lightweight runtime:

```dockerfile
# Stage 1: Build stage with Debian glibc for protobuf-maven-plugin
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B || true

COPY src ./src
RUN mvn package -DskipTests -Djooq.codegen.skip=true -B

# Stage 2: Minimal runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/target/*.jar app.jar

USER appuser
EXPOSE 8080

# Cap JVM heap to prevent out-of-memory thrashing on cloud VMs (e.g. GitHub Codespaces)
ENV JAVA_OPTS="-XX:+UseG1GC -Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
```

> [!NOTE]
> **Why Cap Heap with `JAVA_OPTS`?**
> In containers without explicit Docker memory limits, the JVM defaults to sizing heap relative to the host machine's total RAM. On a 2-core / 8 GB cloud VM (like GitHub Codespaces), 4 unconstrained Spring Boot JVMs + Kafka spike memory to 100% and cause CPU thrashing. Explicitly setting `-Xms256m -Xmx512m` caps total heap across all 4 services to ~2 GB, guaranteeing deterministic stability.

---

## 5. Startup Dependency Tree & Healthchecks

Docker Compose orchestrates deterministic container startup using comprehensive health probes:

```text
postgres (healthy: checks 3 DBs) ──┐
                                  ├──► core (service_started) ───────┐
redis (healthy: ping) ────────────┤                                  ├──► redirect (service_started) ──┐
                                  ├──► apigateway (service_started) ─┤                                 ├──► nginx (Port 80)
kafka (healthy: start_period 25s)─┴──► analytics (service_started) ──┘                                 │
                                                                                                       │
React SPA (compiled into nginx image) ─────────────────────────────────────────────────────────────────┘
```

### Cold-Boot Resilience in Cloud Environments
1. **PostgreSQL Multi-Database Healthcheck**:
   On initial volume boot, PostgreSQL creates a temporary internal server to execute [scripts/init.sql](../scripts/init.sql). A basic `pg_isready -U postgres` check would declare healthy prematurely while the temporary server is shutting down. The Docker Compose healthcheck verifies that all three target databases actually exist and accept connections:
   ```yaml
   healthcheck:
       test: ["CMD-SHELL", "pg_isready -U postgres -d url_shortener_core && pg_isready -U postgres -d url_shortener_analytics && pg_isready -U postgres -d url_shortener_auth"]
       interval: 5s
       timeout: 5s
       retries: 10
       start_period: 25s
   ```
2. **Flyway Connection Retries**:
   All three database-backed services (`core`, `analytics`, `apigateway`) configure:
   ```yaml
   spring:
     flyway:
       connect-retries: 20
       connect-retries-interval: 2s
   ```
   This provides a 40-second connection retry buffer during heavy I/O cold boots.
3. **Kafka KRaft Initialization**:
   Kafka's healthcheck includes a `start_period: 25s` to allow cluster quorum voting to settle before health polling begins.

---

## 6. Database Initialization

On initial container creation, [scripts/init.sql](../scripts/init.sql) runs automatically inside `postgres-db`:

```sql
CREATE DATABASE url_shortener_auth;
CREATE DATABASE url_shortener_core;
CREATE DATABASE url_shortener_analytics;
```

Each microservice then runs its own Flyway database migrations upon startup to create schemas and tables.

---

## 7. Persistent Volumes

Data persists across container restarts and rebuilds via three managed Docker volumes:

| Volume Name | Target Container Path | Content |
| :--- | :--- | :--- |
| `pg_data` | `/var/lib/postgresql/data` | PostgreSQL databases & tables |
| `redis_data` | `/data` | Redis in-memory cache dumps (RDB/AOF) |
| `kafka_data` | `/var/lib/kafka/data` | Kafka partition logs & cluster state |

---

## 8. CLI Command Cheat Sheet

### Start the Stack
```bash
# Build and start all 8 services in the background
docker compose up --build -d

# Start without rebuilding images (fast restart)
docker compose up -d
```

### Monitor Services
```bash
# Check status and health of all containers
docker compose ps

# Follow logs across all microservices
docker compose logs -f

# Follow logs of a specific service
docker compose logs -f apigateway
docker compose logs -f redirect
```

### Stop and Cleanup
```bash
# Stop all running containers (preserves volume data)
docker compose down

# Stop and wipe persistent volume data (fresh database start)
docker compose down -v
```
