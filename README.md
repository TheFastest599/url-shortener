# HiClickMe — Enterprise Multi-Tenant URL Shortener Platform 🚀

A high-throughput, event-driven URL shortening and analytics platform built with **Java 17, Spring Boot 3, Spring Cloud Gateway, Reactive WebFlux, gRPC, PostgreSQL, Redis, Apache Kafka (KRaft), Nginx, and React 19 (Vite)**.

---

## 🏛️ System Architecture & Port Matrix

```text
[ Browser / Laptop: http://localhost (80) & https://localhost (443) ]
                               │
                               ▼
                [ Nginx Ingress Reverse Proxy ]
               (Listens on Port 80 & Port 443 SSL)
                               │
               ┌───────────────┴───────────────┐
               │                               │
       (location /)                  (location /api/ & /r/)
               ▼                               ▼
     [ React Frontend ]             [ Spring API Gateway ]
   (Internal Port 3000)                   (Port 8080)
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               │                               │                               │
               ▼                               ▼                               ▼
      [ url-core-service ]           [ url-redirect-service ]        [ url-analytics-service ]
         (REST: 8081)                      (REST: 8082)                    (REST: 8083)
         (gRPC: 9090)                      (Reactive)                      (Kafka Consumer)
               │                               │                               │
               ▼                               ▼                               ▼
     [ PostgreSQL: Core ]               [ Redis Cache ]            [ PostgreSQL: Analytics ]
                                               │                               ▲
                                               └────────► [ Kafka Topic ] ─────┘
                                                         ("url-clicks")
```

| Service | Port(s) | Technology | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **Nginx Ingress** | `80` (HTTP), `443` (HTTPS) | Nginx Alpine | SSL Termination, Reverse Proxy, Static Caching |
| **React Client** | `5173` (Dev) / `3000` (Docker) | React 19 + Vite | Interactive Analytics Dashboard & URL Shortening UI |
| **`apigateway`** | `8080` | Spring Cloud Gateway, R2DBC | JWT Authentication, Tenant Routing, Downstream Header Injection |
| **`core`** | `8081` (REST), `9090` (gRPC) | Spring Boot, JPA, Hibernate | URL & UTM CRUD, Admin Ownership Validation, Redis Eviction |
| **`redirect`** | `8082` | Spring WebFlux, Reactive Redis | Sub-5ms 302 Redirection, Adaptive TTL, Kafka Click Tracking |
| **`analytics`** | `8083` (REST), `9091` (gRPC) | Kafka Consumer, MaxMind GeoIP2 | Stream Ingestion, Bot Detection, Time-Series Graph Aggregation |
| **PostgreSQL** | `5432` | PostgreSQL 16 Alpine | 3 Logical DBs (`auth`, `core`, `analytics`) |
| **Redis** | `6379` | Redis 7.2 Alpine | In-Memory URL Cache & Sliding Window Rate Limiting |
| **Kafka** | `9092` | Confluent Kafka 7.6 (KRaft) | Event-Driven Asynchronous Click Tracking (`url-clicks`) |

---

## 🛠️ Prerequisites

* **Java 17 JDK** (`JAVA_HOME` configured)
* **Maven 3.9+**
* **Node.js 20+** & **npm**
* **Docker & Docker Compose**
* MaxMind GeoIP Database: `analytics/src/main/resources/geoip/GeoLite2-City.mmdb`

---

## 💻 Setup Mode 1: Local Hybrid Development (Recommended during Coding)

In this mode, Docker runs only the databases, cache, and Kafka broker, while you run Spring Boot in IntelliJ/CLI and React in Vite dev server with instant Hot Module Replacement (HMR).

### Step 1: Start Shared Infrastructure
```powershell
docker compose up redis kafka postgres -d
```

### Step 2: Run Microservices (In separate terminals or IntelliJ)

* **API Gateway (`port 8080`):**
  ```powershell
  cd apigateway
  mvn spring-boot:run
  ```

* **Core Service (`REST 8081` / `gRPC 9090`):**
  ```powershell
  cd core
  mvn spring-boot:run
  ```

* **Redirect Service (`port 8082`):**
  ```powershell
  cd redirect
  mvn spring-boot:run
  ```

* **Analytics Service (`port 8083`):**
  ```powershell
  cd analytics
  mvn spring-boot:run
  ```

### Step 3: Run React Client (Vite Dev Server)
```powershell
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🐳 Setup Mode 2: Full Docker Production Mode (1-Command Build & Run)

In this mode, Docker automatically compiles the React frontend, builds all Spring Boot JRE 17 images, initializes the 3 PostgreSQL databases, and launches Nginx on ports **80** and **443**.

### Step 1: Generate Local SSL Certificates (Optional for HTTPS)
```powershell
New-Item -ItemType Directory -Force -Path "nginx\certs"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/certs/nginx.key -out nginx/certs/nginx.crt -subj "/CN=localhost"
```

### Step 2: Build & Start the Complete Stack
```powershell
docker compose up --build -d
```

### Step 3: Access the Application
* **Frontend Web Application:** `http://localhost/` or `https://localhost/`
* **Short Link Redirection:** `http://localhost/r/{shortCode}`
* **Gateway Health:** `http://localhost/api/v1/health`

### Step 4: Stop / Reset the Stack
```powershell
# Stop all containers
docker compose down

# Stop and wipe all database volumes for a clean slate
docker compose down -v
```

---

## 🐘 Connecting External pgAdmin / DBeaver

| Parameter | Value |
| :--- | :--- |
| **Host** | `localhost` |
| **Port** | `5432` |
| **User** | `postgres` |
| **Password** | `postgres_password` |
| **Databases** | `url_shortener_auth`, `url_shortener_core`, `url_shortener_analytics` |

---

## 📚 Deep-Dive Architecture & Component Documentation

* **[API Endpoints Reference & Service Catalog](docs/api_endpoints_reference.md)** — Complete catalog of all HTTP REST endpoints, gRPC methods, Kafka events, and cURL cheat sheet across all 4 services.
* **[Master Architecture & Design Doc](docs/url_shortener_design_doc.md)** — Complete 13-section technical architecture blueprint.
* **[Nginx & Docker Orchestration Guide](docs/nginx_and_docker_orchestration_guide.md)** — Ingress routing, SSL setup, and Docker Compose configs.
* **[API Gateway & Security Guide](docs/api_gateway_security_guide.md)** — JWT security filter chain, BCrypt, and R2DBC.
* **[Core Service Guide](docs/core_service_guide.md)** — Base62 encoding, UTM builder, and gRPC server.
* **[Redirect Service Guide](docs/redirect_service_guide.md)** — Sub-5ms reactive redirects, Redis Adaptive TTL, and Kafka producer.
* **[Analytics Service Guide](docs/analytics_service_guide.md)** — MaxMind GeoIP resolution, Bot filtering, and SQL time-series projections.
