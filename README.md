# HiClickMe — Multi-Tenant URL Shortener Microservices

A high-performance URL shortening & analytics platform built with Java 17, Spring Boot, Spring Cloud Gateway, Reactive WebFlux, gRPC, PostgreSQL, Redis, and Apache Kafka.

---

## ⚡ Lightweight Quick Start Command (Low Memory / Fast Run)

To run any microservice module locally without running into memory allocation limits, use this **single-line memory-optimized command**:

### PowerShell (Windows):
```powershell
$env:MAVEN_OPTS="-Xmx256m"; mvn spring-boot:run -DskipTests
```

### CMD (Windows):
```cmd
set MAVEN_OPTS=-Xmx256m && mvn spring-boot:run -DskipTests
```

---

## 🚀 How to Run the Services

### 1. Start Infrastructure (Redis, Kafka, Local PostgreSQL)
```powershell
docker compose up -d
```

### 2. Run API Gateway Microservice (Port 8080)
```powershell
cd apigateway
$env:MAVEN_OPTS="-Xmx256m"; mvn spring-boot:run -DskipTests
```

### 3. Run Redirect Microservice (Port 8082)
```powershell
cd redirect
$env:MAVEN_OPTS="-Xmx256m"; mvn spring-boot:run -DskipTests
```

### 4. Run Core Admin Microservice (Port 8081 / gRPC 9090)
```powershell
cd core
$env:MAVEN_OPTS="-Xmx256m"; mvn spring-boot:run -DskipTests
```

### 5. Run Analytics Ingestion Microservice (Port 8083 / gRPC 9091)
```powershell
cd analytics
$env:MAVEN_OPTS="-Xmx256m"; mvn spring-boot:run -DskipTests
```

---

## 🌐 Subdomain & Domain Architecture

* **Web App (Frontend):** `http://lvh.me:3000`
* **API Gateway:** `http://api.lvh.me:8080/api/v1/...`
* **Redirection Service:** `http://r.lvh.me:8080/xyz123` or `http://localhost:8080/r/xyz123`

---

## 📚 Documentation & Guides
* **[Design Document](docs/url_shortener_design_doc.md)**
* **[API Gateway Guide](docs/api_gateway_security_guide.md)**
* **[Core Service Guide](docs/core_service_guide.md)**
* **[Redirect Service Guide](docs/redirect_service_guide.md)**
* **[Analytics Service Guide](docs/analytics_service_guide.md)**
