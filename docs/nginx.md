# Nginx Ingress & Reverse Proxy Guide

Architecture, configuration, and routing reference for the unified Nginx edge reverse proxy and React Single-Page Application (SPA) web server.

---

## 1. Role & Ingress Architecture

Nginx serves as the **sole public-facing gateway** on port 80. By encapsulating both static frontend assets and reverse proxy routing into a single lightweight container, it enforces strict port isolation for the backend microservices.

```text
                                  ┌───► [Main Domain: yourdomain.com] ──► /     ──► [Static React SPA]
🌐 Client Browser ──► :80 (Nginx) ├───► [Main Domain: yourdomain.com] ──► /api/ ──► [apigateway-service:8080]
                                  │
                                  └───► [Redirect: r.yourdomain.com]  ──► /*    ──► [redirect-service:8082]
```

### Key Architectural Benefits
- **Zero Port Collisions**: No need to expose ports 8080, 8081, 8082, 8083, or 5173 to the host.
- **Strict Domain Separation**: Main app & APIs live on the main domain; all short link redirection is exclusively handled on the `r.` subdomain.
- **Cleaner Short Links**: Clean URLs (`r.yourdomain.com/{code}`) without redundant `/r/` or `/s/` path prefixes.

---

## 2. Multi-Stage Dockerfile Strategy

[nginx/Dockerfile](../nginx/Dockerfile) compiles the React Vite client during container image build and transfers the static bundle into a minimal Alpine Nginx runtime:

```dockerfile
# Stage 1: Build the React client application
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Lightweight Nginx runtime
FROM nginx:alpine
COPY --from=client-builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. High-Concurrency Tuning & Connection Pooling

To sustain high-throughput load tests and production traffic without socket exhaustion, [nginx/nginx.conf](../nginx/nginx.conf) configures worker concurrency and upstream HTTP/1.1 connection pooling.

### 3.1. Worker Limits
```nginx
worker_processes 2;
worker_rlimit_nofile 65535;

events {
    worker_connections 16384;
    multi_accept on;
}
```
- **`worker_processes 2`**: Capped to 2 worker processes to protect CPU and battery on developer machines while providing dual-core redundancy.
- **`worker_rlimit_nofile 65535`**: Lifts the operating system file descriptor limit per worker so thousands of concurrent sockets can stay open simultaneously.
- **`multi_accept on`**: Accepts all pending connections from the listen queue in a single batch.

### 3.2. Upstream Keep-Alive Connection Pools
By default, Nginx connects to upstream backends using HTTP/1.0, closing the TCP socket after every response. Under load, this causes rapid socket exhaustion (`TIME_WAIT`). Nginx defines persistent upstream pools:

```nginx
upstream redirect_service {
    server redirect:8082;
    keepalive 512;
}

upstream apigateway_service {
    server apigateway:8080;
    keepalive 128;
}
```

To activate these keep-alive pools, proxy locations set:
```nginx
proxy_http_version 1.1;
proxy_set_header Connection "";
```
This keeps idle TCP connections open between Nginx and Spring Boot Netty/Tomcat, eliminating continuous 3-way handshakes and achieving sub-3ms latency.

---

## 4. Dynamic Virtual Hosts & Routing Table

[nginx/nginx.conf](../nginx/nginx.conf) is configured with **zero hardcoded hostnames**, making it fully portable across `localhost`, staging IPs, and production domains:

### 4.1. Dedicated Redirect Domain (`~^r\.(?<main_domain>.+)$`)
Matches any domain starting with `r.` (e.g., `r.localhost`, `r.yourdomain.com`, `r.sho.rt`):

| Request URL | Target Upstream | Dynamic Behavior |
| :--- | :--- | :--- |
| **`http://r.{domain}/{code}`** | `http://redirect_service/r/{code}` | Direct short code & custom alias redirection (clean format via `proxy_pass http://redirect_service/r/;`). |
| **`http://r.{domain}/`** | `return 302 $scheme://$main_domain/;` | Dynamically redirects bare root visits to the parent domain (e.g., `http://yourdomain.com/`). |

### 4.2. Main Platform & API Gateway (`default_server`)
Catch-all for the primary application domain (`yourdomain.com`), `localhost`, or direct cloud IP addresses:

| Request Path | Target Upstream | Behavior & Rules |
| :--- | :--- | :--- |
| **`/`** | `/usr/share/nginx/html` | Serves compiled static React SPA. Falls back to `/index.html` via `try_files` for client-side routing. |
| **`/api/`** | `http://apigateway_service` | Authentication, OAuth2 callbacks, analytics, and URL CRUD proxy. |
| **`~* \.(?:css\|js\|...)$`** | Static cache | 1-year immutable caching (`max-age=31536000, immutable`). |
| **`~ /\. `** | Blocked | Blocks hidden system files (`.env`, `.git`) with 404. |

---

## 5. Distributed IP Rate Limiting (Leaky Bucket)

Nginx enforces high-performance, in-memory IP rate limiting using `limit_req_zone`. It rejects abusive traffic at the network edge before requests ever reach the JVM.

### 5.1. Shared Memory Zones
```nginx
# API routes: 30 requests/second per IP
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

# Redirection routes: 300 requests/second per IP
limit_req_zone $binary_remote_addr zone=redirect_limit:10m rate=300r/s;
```
- **`$binary_remote_addr`**: Stores client IPs in compact 4-byte binary form (IPv4) or 16-byte (IPv6) rather than strings.
- **`10m` memory**: Holds ~160,000 active concurrent IP states in shared memory.

### 5.2. Burst & Custom JSON 429 Responses
- **`burst=150 nodelay`** (Redirection): Absorbs sudden bursts of legitimate redirection traffic without artificial queuing delay.
- **`burst=50 nodelay`** (API Gateway): Accommodates initial dashboard loading bursts.
- **Custom JSON Error Handler**: Returns structured JSON instead of default HTML when rate limits are exceeded:

```json
{
  "error": "Too many requests. Please wait a moment and try again.",
  "status": 429
}
```

---

## 6. Compression & Header Propagation

### Gzip Compression
Static assets are automatically compressed before transmission:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied expired no-cache no-store private auth;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/json application/xml image/svg+xml;
```

### Explicit Proxy Headers
Because Nginx disables parent header inheritance when `proxy_set_header` is declared within a `location` block, all upstream locations explicitly forward client metadata:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

---

## 7. Verification & Health Checks

Once the Docker stack is running, verify Nginx routing from your terminal or browser:

```bash
# 1. Verify React SPA is served
curl -i http://localhost
# Output: HTTP/1.1 200 OK (Contains <!DOCTYPE html> React mount)

# 2. Verify API Gateway routing
curl -i http://localhost/api/v1/auth/me
# Output: HTTP/1.1 401 Unauthorized (Clean response from API Gateway)

# 3. Verify Redirection Service on r.localhost
curl -i http://r.localhost/launch-deal
# Output: HTTP/1.1 302 Found (Location: https://stripe.com)

# 4. Verify Root Redirect on r.localhost
curl -i http://r.localhost/
# Output: HTTP/1.1 302 Found (Location: http://localhost/)
```
