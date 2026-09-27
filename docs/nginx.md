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
FROM node:20-alpine AS build-client
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# .env.production sets VITE_API_GATEWAY_URL to empty for relative proxy routing
RUN npm run build

# Stage 2: Lightweight Nginx runtime
FROM nginx:alpine
# Copy compiled static assets
COPY --from=build-client /app/dist /usr/share/nginx/html
# Copy ingress configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Dynamic Virtual Hosts & Routing Table

[nginx/nginx.conf](../nginx/nginx.conf) is configured with **zero hardcoded hostnames**, making it fully portable across `localhost`, staging IPs, and production domains:

### 3.1. Dedicated Redirect Domain (`~^r\.(?<main_domain>.+)$`)
Matches any domain starting with `r.` (e.g., `r.localhost`, `r.yourdomain.com`, `r.sho.rt`):

| Request URL | Target Upstream | Dynamic Behavior |
| :--- | :--- | :--- |
| **`http://r.{domain}/{code}`** | `http://redirect:8082/r/{code}` | Direct short link & custom alias redirection (clean format). |
| **`http://r.{domain}/`** | `$scheme://$main_domain/` | Dynamically redirects root visits to the parent domain (e.g., `http://yourdomain.com/`). |

### 3.2. Main Platform & API Gateway (`default_server`)
Catch-all for the primary application domain (`yourdomain.com`), `localhost`, or direct cloud IP addresses:

| Request Path | Target Upstream | Behavior & Rules |
| :--- | :--- | :--- |
| **`/`** | `/usr/share/nginx/html` | Serves compiled static React SPA. Falls back to `/index.html` via `try_files` for client-side routing. |
| **`/api/`** | `http://apigateway:8080/api/` | Authentication, OAuth2 callbacks, analytics, and URL CRUD proxy. |

---

## 4. Location Blocks Breakdown

### 4.1. Single Page Application (SPA)
```nginx
location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html;
}
```
- **`try_files $uri $uri/ /index.html`**: Ensures direct browser navigation or page reloads on deep links (e.g. `http://localhost/analytics` or `http://localhost/login`) route back to `index.html` so React Router can render the correct component.

### 4.2. High-Speed Redirection
```nginx
location /r/ {
    proxy_pass http://redirect:8082/r/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /s/ {
    proxy_pass http://redirect:8082/s/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
- Trailing slashes on `location /r/` and `proxy_pass http://redirect:8082/r/` ensure paths are forwarded seamlessly without altering URI parameters.

### 4.3. API Gateway & Authentication
```nginx
location /api/ {
    proxy_pass http://apigateway:8080/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```
- Includes WebSocket upgrade support (`$http_upgrade`) for any real-time client socket connections.

---

## 5. Distributed IP Rate Limiting (Leaky Bucket)

Nginx enforces high-performance, in-memory IP rate limiting using `limit_req_zone`. It rejects abusive traffic at the network edge before requests ever reach the JVM.

### 5.1. Shared Memory Zones
```nginx
# API routes: 30 requests/second per IP
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

# Redirection routes: 100 requests/second per IP
limit_req_zone $binary_remote_addr zone=redirect_limit:10m rate=100r/s;
```
- **`$binary_remote_addr`**: Stores client IPs in compact 4-byte binary form (IPv4) or 16-byte (IPv6) rather than strings.
- **`10m` memory**: Holds ~160,000 active concurrent IP states.

### 5.2. Burst & JSON 429 Responses
- **`burst=50 nodelay`**: Accommodates brief legitimate spikes (e.g. initial dashboard loading) without queuing latency.
- **Custom JSON Error Handler**: Returns structured JSON instead of HTML when the threshold is exceeded:
```json
{
  "error": "Too many requests. Please wait a moment and try again.",
  "status": 429
}
```

---

## 6. Security & Compression Configuration

### Security Headers
The following HTTP security headers are injected into all responses:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### Gzip Compression
Static assets are automatically compressed before transmission:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
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

# 3. Verify Redirection Service
curl -i http://localhost/r/test123
# Output: HTTP/1.1 404 Not Found (or 302 Found if short code exists)
```
