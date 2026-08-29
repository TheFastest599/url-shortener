# Hands-On Guide: Nginx Reverse Proxy, React Client & Full Docker Orchestration

Welcome! This document is a complete, step-by-step hands-on guide for configuring **Nginx Reverse Proxy**, integrating the **React Client (`client/`)**, and orchestrating the entire URL shortener platform with **Docker Compose**.

---

## Table of Contents
1. [Architecture & Ingress Routing](#1-architecture--ingress-routing)
2. [Module 1: Nginx Configuration (`nginx/nginx.conf`)](#module-1-nginx-configuration-nginxnginxconf)
3. [Module 2: Multi-Stage Dockerfile for React Client (`client/Dockerfile`)](#module-2-multi-stage-dockerfile-for-react-client-clientdockerfile)
4. [Module 3: Spring Boot Microservices Dockerfile Template](#module-3-spring-boot-microservices-dockerfile-template)
5. [Module 4: Multi-Database PostgreSQL Initialization (`scripts/init-dbs.sql`)](#module-4-multi-database-postgresql-initialization-scriptsinit-dbssql)
6. [Module 5: Master Docker Compose (`docker-compose.yml`)](#module-5-master-docker-compose-docker-composeyml)
7. [Module 6: Local Development Setup & Vite Proxy](#module-6-local-development-setup--vite-proxy)
8. [Module 7: Step-by-Step Testing & Verification](#module-7-step-by-step-testing--verification)

---

## 1. System Topology & Request Routing

In production and local testing, **Nginx** is the ONLY container exposed to ports **80** (HTTP) and **443** (HTTPS). The React frontend runs on internal port **`3000`**, and Nginx reverse-proxies all traffic:

```text
                               [ User / Web Browser ]
                                         │
                                         ▼ (Port 80 / 443 SSL)
                          [ Nginx Ingress Reverse Proxy ]
                                         │
               ┌─────────────────────────┴─────────────────────────┐
               │                                                   │
      (Route: '/' -> Port 3000)                           (Route: '/api/**' & '/r/**')
               ▼                                                   ▼
     [ React Client Container ]                         [ Spring API Gateway ]
       (Running on Port 3000)                                  (Port 8080)
                                                                   │
                               ┌───────────────────────────────────┼───────────────────────────────────┐
                               │                                   │                                   │
                               ▼                                   ▼                                   ▼
                      [ url-core-service ]               [ url-redirect-service ]            [ url-analytics-service ]
                         (REST: 8081)                          (REST: 8082)                        (REST: 8083)
                         (gRPC: 9090)                          (Reactive)                          (Kafka Consumer)
                               │                                   │                                   │
                               ▼                                   ▼                                   ▼
                     [ PostgreSQL: Core ]                   [ Redis Cache ]                [ PostgreSQL: Analytics ]
                                                                   │                                   ▲
                                                                   └────────► [ Kafka Topic ] ─────────┘
                                                                             ("url-clicks")
```

---

## Module 1: Nginx Configuration with Port 80 & 443 SSL (`nginx/nginx.conf`)

Create directory `nginx/` and file `nginx/nginx.conf`. This configuration handles:
1. **Port 80:** Plain HTTP traffic (or auto-redirects to HTTPS).
2. **Port 443:** SSL/TLS termination with HTTP/2 support.
3. **Reverse Proxying:**
   * `/` $\rightarrow$ `frontend:3000` (React Client)
   * `/api/` $\rightarrow$ `api-gateway:8080` (API Gateway)
   * `/r/` $\rightarrow$ `api-gateway:8080` (Fast Redirects)

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    upstream frontend_client {
        server frontend:3000;
    }

    upstream api_gateway {
        server api-gateway:8080;
    }

    # ==========================================
    # 1. HTTP Server (Port 80)
    # ==========================================
    server {
        listen 80;
        server_name localhost;

        # Proxy API & Redirect calls
        location /api/ {
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /r/ {
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Proxy Frontend UI
        location / {
            proxy_pass http://frontend_client;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # ==========================================
    # 2. HTTPS Server (Port 443 SSL) - For Local Prod Testing
    # ==========================================
    server {
        listen 443 ssl;
        server_name localhost;

        ssl_certificate /etc/nginx/certs/nginx.crt;
        ssl_certificate_key /etc/nginx/certs/nginx.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location /api/ {
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        location /r/ {
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        location / {
            proxy_pass http://frontend_client;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }
}
```

---

## Module 2: React Frontend Service on Port 3000 (`client/Dockerfile`)

Create file `client/Dockerfile`. This builds React and serves it internally on port **`3000`**:

```dockerfile
# Stage 1: Build React App with Node 20
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve React on Port 3000 using minimal Nginx
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf

# Configure internal server on port 3000
RUN echo 'server { listen 3000; root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; }' > /etc/nginx/conf.d/client.conf

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

---

## Module 3: Spring Boot Microservices Dockerfile Template

The exact same multi-stage Dockerfile can be used for each microservice (`apigateway/Dockerfile`, `core/Dockerfile`, `redirect/Dockerfile`, `analytics/Dockerfile`):

```dockerfile
# Multi-stage Java Build with Eclipse Temurin JDK 17
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Pre-generate and build jar skipping unit tests
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

---

## Module 4: Multi-Database PostgreSQL Initialization (`scripts/init-dbs.sql`)

Create file `scripts/init-dbs.sql` to initialize the 3 logical databases when the PostgreSQL container starts for the first time:

```sql
-- scripts/init-dbs.sql: Initializes 3 isolated logical databases
CREATE DATABASE url_shortener_auth;
CREATE DATABASE url_shortener_core;
CREATE DATABASE url_shortener_analytics;
```

---

## Module 5: Master Docker Compose (`docker-compose.yml`)

Update `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  # ==========================================
  # 1. SHARED INFRASTRUCTURE
  # ==========================================

  postgres:
    image: postgres:16-alpine
    container_name: postgres-db
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_password
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./scripts/init-dbs.sql:/docker-entrypoint-initdb.d/init-dbs.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.2-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: kafka-broker
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: 'broker,controller'
      KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka:29093'
      KAFKA_LISTENERS: 'PLAINTEXT://0.0.0.0:29092,CONTROLLER://0.0.0.0:29093,PLAINTEXT_HOST://0.0.0.0:9092'
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: 'CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT'
      KAFKA_CONTROLLER_LISTENER_NAMES: 'CONTROLLER'
      KAFKA_INTER_BROKER_LISTENER_NAME: 'PLAINTEXT'
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_LOG_DIRS: '/tmp/kraft-combined-logs'
      CLUSTER_ID: 'MkU3OEVBNTcwNTJENDM2Qk'

  # ==========================================
  # 2. SPRING BOOT MICROSERVICES
  # ==========================================

  api-gateway:
    build: ./apigateway
    container_name: api-gateway
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      REDIS_HOST: redis
      CORE_SERVICE_URL: http://url-core:8081
      REDIRECT_SERVICE_URL: http://url-redirect:8082
      ANALYTICS_SERVICE_URL: http://url-analytics:8083
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  url-core:
    build: ./core
    container_name: url-core
    ports:
      - "8081:8081"
      - "9090:9090"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      REDIS_HOST: redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  url-redirect:
    build: ./redirect
    container_name: url-redirect
    ports:
      - "8082:8082"
    environment:
      REDIS_HOST: redis
      CORE_GRPC_HOST: url-core
      CORE_GRPC_PORT: 9090
      KAFKA_BOOTSTRAP_SERVERS: kafka:29092
    depends_on:
      redis:
        condition: service_started
      kafka:
        condition: service_started

  url-analytics:
    build: ./analytics
    container_name: url-analytics
    ports:
      - "8083:8083"
      - "9091:9091"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      KAFKA_BOOTSTRAP_SERVERS: kafka:29092
    depends_on:
      postgres:
        condition: service_healthy
      kafka:
        condition: service_started

  # ==========================================
  # 3. REACT FRONTEND & NGINX INGRESS
  # ==========================================

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: react-frontend
    expose:
      - "3000"

  nginx-ingress:
    image: nginx:alpine
    container_name: nginx-ingress
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - frontend
      - api-gateway

volumes:
  pg_data:
```

---

## Module 6: Local Development Setup & Vite Proxy

When developing locally (running Vite `npm run dev` on port `5173`), configure `client/vite.config.js` to proxy `/api` and `/r` directly to Spring Cloud Gateway (`http://localhost:8080`):

```javascript
// client/vite.config.js
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/r': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
});
```

---

## Module 7: Step-by-Step Testing & Verification

### 1. Hybrid Development Mode (Fastest during coding):
1. **Start Docker infrastructure only:**
   ```powershell
   docker compose up redis kafka postgres -d
   ```
2. **Run Spring Boot services** from IntelliJ / Maven (`apigateway`, `core`, `redirect`, `analytics`).
3. **Run React Client:**
   ```powershell
   cd client
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### 2. Full Docker Production Mode (1-Command Automatic Build & Run):
1. **Start the complete platform (Docker automatically builds React & Java jars):**
   ```powershell
   docker compose up --build -d
   ```
2. **Verify endpoints in browser:**
   * Frontend: `http://localhost`
   * API Gateway Health: `http://localhost/api/v1/health`
   * Short Link Redirection: `http://localhost/r/{shortCode}`
