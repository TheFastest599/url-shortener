# High-Throughput Redirect Load Testing & Scale Plan (10 to 1,000,000 RPS)

This document outlines the end-to-end, production-grade load testing and scaling roadmap for the **Redirect Microservice** (`url-redirect-service`). It details how to incrementally validate and scale redirect throughput from **10 RPS** up to **1,000,000 RPS**, incorporating realistic clickstream traffic (dynamic user agents, global geo-IPs, referrers, A/B sticky cookies, and Zipfian URL distributions).

---

## Table of Contents

1. [Architectural Overview & Latency Budget](#1-architectural-overview--latency-budget)
2. [Realistic Traffic Modeling (Clickstream Realism)](#2-realistic-traffic-modeling-clickstream-realism)
3. [6-Stage Progressive Scaling Roadmap](#3-6-stage-progressive-scaling-roadmap)
   - [Stage 1: 10 RPS — Functional Verification & Pipeline Sanity](#stage-1-10-rps--functional-verification--pipeline-sanity)
   - [Stage 2: 100 RPS — Concurrency & Cache Warm-Up Baseline](#stage-2-100-rps--concurrency--cache-warm-up-baseline)
   - [Stage 3: 1,000 RPS (1k) — Sustained Reactive Baseline](#stage-3-1000-rps-1k--sustained-reactive-baseline)
   - [Stage 4: 10,000 RPS (10k) — Netty & Redis Saturation Testing](#stage-4-10000-rps-10k--netty--redis-saturation-testing)
   - [Stage 5: 100,000 RPS (100k) — Single-Node Limit & L1 In-Memory Caching](#stage-5-100000-rps-100k--single-node-limit--l1-in-memory-caching)
   - [Stage 6: 1,000,000 RPS (1M) — Clustered Hyper-Scale Architecture](#stage-6-1000000-rps-1m--clustered-hyper-scale-architecture)
4. [Tooling & Load Generator Scripts](#4-tooling--load-generator-scripts)
   - [Modular k6 Realistic Load Test Script](#modular-k6-realistic-load-test-script)
   - [High-Throughput wrk2 / Lua Script for 100k+ RPS](#high-throughput-wrk2--lua-script-for-100k-rps)
5. [Telemetry, Monitoring & Verification Checklist](#5-telemetry-monitoring--verification-checklist)

---

## 1. Architectural Overview & Latency Budget

The redirect service is built on non-blocking reactive Spring WebFlux (Netty) and is engineered to achieve **sub-2ms P99 response times** under heavy load.

```
Visitor Request: GET /r/{shortCode}
                 │
                 ▼
     [ Nginx Reverse Proxy / Load Balancer ]
                 │
                 ▼
     [ Spring WebFlux Netty (port 8082) ]
                 │
                 ├─► [ L1 In-Memory Caffeine Cache (< 0.05ms) ] ── (Hot URLs)
                 │         │ (Miss)
                 │         ▼
                 ├─► [ L2 Redis Cache (MGET < 0.5ms) ] ────────── (Base + A/B rules)
                 │         │ (Miss)
                 │         ▼
                 ├─► [ Core Service Fallback (gRPC :9090 < 2ms) ] ─► Warm L2 Redis
                 │
                 ▼ (Async Non-Blocking Fire-and-Forget)
     [ Apache Kafka Topic: "url-clicks" ] ──► Consumed in 5k batches by Analytics
```

### Latency Budget per Request
- **Total End-to-End SLA**: `< 5.0ms` (P99)
- **L1 Cache Hit**: `< 0.05ms`
- **L2 Redis Round-Trip**: `< 0.8ms`
- **Kafka Producer Hand-off**: `< 0.2ms` (non-blocking in-memory ring buffer)
- **HTTP 302 Header Serialization**: `< 0.1ms`

---

## 2. Realistic Traffic Modeling (Clickstream Realism)

Synthetic tests with identical requests create artificial cache hits and mask real-world pipeline bottlenecks. Our load testing harnesses must inject high-fidelity clickstream entropy across six key vectors:

### 1. Device & Browser Distribution (User-Agents)
Traffic will mirror real internet analytics:
- **Mobile Browsers (55%)**: Mobile Safari (iOS), Chrome Mobile (Android), Samsung Internet.
- **Desktop Browsers (38%)**: Chrome Desktop (Windows/macOS), Safari Desktop, Edge, Firefox.
- **Automated Bots & Crawlers (7%)**: Twitterbot, Slackbot, Googlebot, LinkedInBot, curl.

### 2. Geographic Diversity (IP Addresses)
Clients inject dynamic `X-Forwarded-For` and `X-Real-IP` headers to exercise MaxMind GeoIP resolution across global regions:
- **North America**: US, Canada (`24.0.0.0/8`, `64.0.0.0/8`)
- **Europe**: Germany, UK, France (`80.0.0.0/8`, `82.0.0.0/8`)
- **Asia-Pacific**: India, Japan, Singapore (`103.0.0.0/8`, `115.0.0.0/8`)
- **Local/Private**: RFC 1918 subnets (`127.0.0.1`, `172.18.0.1`, `192.168.1.1`) to ensure fallback to `Unknown` without throwing unhandled exceptions.

### 3. Referrer Diversity
Simulates social media channels and campaigns:
- `https://t.co/` (Twitter/X)
- `https://www.linkedin.com/`
- `https://news.ycombinator.com/`
- `https://youtube.com/`
- `Direct / None` (empty header)

### 4. Zipfian (Pareto 80/20) URL Distribution
Real short links follow a power-law distribution:
- **Top 5% Short Codes**: Receive **70%** of redirect traffic (viral campaigns).
- **Next 15% Short Codes**: Receive **20%** of traffic.
- **Long Tail 80%**: Receive **10%** of traffic (exercises cache misses and cold key resolution).

### 5. Sticky A/B Cookies
- 40% of requests include an existing cookie (`ab_{shortCode}=A` or `ab_{shortCode}=B`) to test deterministic sticky routing.
- 60% are first-time visitors that trigger weighted random assignment and receive a new `Set-Cookie` header.

### 6. Dynamic UTM Parameters
Requests pass query parameters (`?utm_source=newsletter&utm_medium=email&utm_campaign=black_friday`) to test downstream Kafka UTM enrichment and URI normalization.

---

## 3. 6-Stage Progressive Scaling Roadmap

```
Stage 1: 10 RPS       ──► Functional & Event Verification
      │
Stage 2: 100 RPS      ──► Concurrency & Cache Warm-Up
      │
Stage 3: 1,000 RPS    ──► Sustained Reactive Baseline (Single Instance)
      │
Stage 4: 10,000 RPS   ──► Redis Event Loop & Netty Saturation
      │
Stage 5: 100,000 RPS  ──► Single-Node Ceiling & L1 Caffeine In-Memory Cache
      │
Stage 6: 1,000,000 RPS──► Clustered Hyper-Scale (Nginx + Multi-Instance + Kafka Tuning)
```

---

### Stage 1: 10 RPS — Functional Verification & Pipeline Sanity

- **Primary Goal**: Validate the full HTTP request-to-Kafka-to-Analytics pipeline with zero dropped events and exact cookie setting.
- **Concurrency**: 1 – 2 Virtual Users (VUs).
- **Target Metrics**:
  - P50 Latency: `< 2ms`
  - P99 Latency: `< 5ms`
  - Error Rate: `0.00%`
  - HTTP Status: `302 Found` with exact `Location` and `Set-Cookie` headers.
- **Components to Monitor**:
  1. **Kafka Broker**: Topic `url-clicks` receives 10 messages/sec.
  2. **Analytics Ingestion**: Batch consumer logs batch commit every 5 seconds.
  3. **Redis**: Cache hit on key `url:redirect:{code}`.
- **Verification Commands**:
  ```bash
  # Check Kafka message arrival
  docker compose exec kafka-broker kafka-console-consumer.sh \
    --bootstrap-server localhost:9092 --topic url-clicks --max-messages 10
  ```

---

### Stage 2: 100 RPS — Concurrency & Cache Warm-Up Baseline

- **Primary Goal**: Confirm that concurrent Netty event loop threads handle parallel requests without connection thrashing.
- **Concurrency**: 10 – 20 VUs with Keep-Alive enabled.
- **Target Metrics**:
  - P50 Latency: `< 1.5ms`
  - P99 Latency: `< 3ms`
  - CPU Utilization: `< 5%` on `redirect-service`.
- **Potential Bottlenecks**:
  - Cold Redis misses on the long-tail short codes causing temporary gRPC fallback spikes.
- **Expected Outcome**:
  - Redis cache hit ratio exceeds **98%** after initial 30-second warm-up.

---

### Stage 3: 1,000 RPS (1k) — Sustained Reactive Baseline

- **Primary Goal**: Validate continuous, stable operation under standard production enterprise load.
- **Concurrency**: 50 – 100 VUs.
- **Target Metrics**:
  - P50 Latency: `< 1.2ms`
  - P95 Latency: `< 2.5ms`
  - P99 Latency: `< 5.0ms`
  - Kafka throughput: 1,000 events/sec.
  - Analytics consumer lag: `0` (PostgreSQL batch insert comfortably absorbs 1,000 rows/sec via `reWriteBatchedInserts=true`).
- **Tuning at this Stage**:
  - Verify PostgreSQL connection pool sizing in `url-analytics-service` (`HikariCP maximum-pool-size: 20`).
  - Verify Redis connection timeout settings.

---

### Stage 4: 10,000 RPS (10k) — Netty & Redis Saturation Testing

- **Primary Goal**: Push a single `redirect-service` process and single Redis instance to high utilization.
- **Concurrency**: 500 – 1,000 VUs.
- **Target Metrics**:
  - P50 Latency: `< 2.0ms`
  - P99 Latency: `< 8.0ms`
  - Error Rate: `< 0.01%`
- **Identified Failure Modes**:
  1. **TCP Ephemeral Port Exhaustion**: If client connections drop keep-alive, Windows/Linux runs out of available ports (`WSAENOBUFS` / `EADDRNOTAVAIL`).
     - *Fix*: Use persistent HTTP Keep-Alive connection pools.
  2. **Kafka Producer Buffer Saturation**: If Kafka producer uses default `linger.ms=0`, it creates excessive small TCP packets.
     - *Fix*: Set `linger.ms=10`, `batch.size=32768`, `compression.type=lz4` in `redirect/application.yaml`.
  3. **Redis Lettuce Connection Pool Contention**:
     - *Fix*: Configure `LettuceClientConfiguration` with native epoll and shared connection multiplexing.

---

### Stage 5: 100,000 RPS (100k) — Single-Node Limit & L1 In-Memory Caching

- **Primary Goal**: Maximize the throughput of a single machine by eliminating Redis network round trips for viral links.
- **Concurrency**: 2,000 – 5,000 persistent connections.
- **Theoretical Bottleneck**:
  - A single-threaded Redis process caps out at **~100,000 to 140,000 MGET ops/sec**. At 100k RPS, Redis CPU hits 100%.
- **Required Architecture Change: L1 Caffeine Cache**:
  - Implement a near-cache inside `RedirectService` using **Caffeine**:
    ```java
    Cache<String, RedirectPayload> l1Cache = Caffeine.newBuilder()
        .maximumSize(50_000)
        .expireAfterWrite(Duration.ofSeconds(10))
        .recordStats()
        .build();
    ```
  - **Result**: Top 20% viral links are served directly from JVM RAM in **0.01ms**, offloading 80% of queries from Redis. Redis only handles 20,000 RPS.
- **OS Kernel Tuning (Linux / WSL)**:
  ```bash
  # Increase open file descriptor limits
  ulimit -n 500000
  # Increase socket backlog queue
  sysctl -w net.core.somaxconn=65535
  sysctl -w net.ipv4.tcp_max_syn_backlog=65535
  sysctl -w net.ipv4.tcp_tw_reuse=1
  ```

---

### Stage 6: 1,000,000 RPS (1M) — Clustered Hyper-Scale Architecture

- **Primary Goal**: Scale out to 1 Million redirects per second with sub-2ms latency.
- **Traffic Physics at 1M RPS**:
  - **Bandwidth**: 1,000,000 req/s * 350 bytes = **350 MB/s (~2.8 Gbps)** egress network bandwidth.
  - **Kafka Events**: 1,000,000 events/sec = **~400 MB/s** Kafka message ingress.
- **Cluster Deployment Topology**:
  1. **Nginx Edge Layer**: 2 to 4 Nginx load balancer instances running with multi-worker `reuseport` and `least_conn`.
  2. **Redirect Service Replicas**: 8 to 12 containers (each capable of 100k RPS with L1 Caffeine).
  3. **Redis Cluster**: 3-node master-replica Redis Cluster or Redis Sentinel cluster with read replicas.
  4. **Kafka Partitioning**: 16 to 32 partitions on topic `url-clicks` to allow parallel partition processing across multiple analytics ingestion workers.
- **Architecture Diagram**:

```
[ Distributed Load Generators: k6 / wrk2 Cluster (1M RPS) ]
                          │ (2.8 Gbps HTTP/1.1 Keep-Alive)
                          ▼
             [ Nginx Load Balancers (Port 80) ]
                          │
     ┌────────────────────┼────────────────────┐
     ▼                    ▼                    ▼
[ Redirect #1 ]      [ Redirect #2 ]  ... [ Redirect #10 ]
 (Caffeine L1)        (Caffeine L1)        (Caffeine L1)
     │                    │                    │
     └──────────┬─────────┴──────────┬─────────┘
                ▼                    ▼
     [ Redis Cluster (L2) ]   [ Kafka Broker (32 Partitions) ]
```

---

## 4. Tooling & Load Generator Scripts

### Modular k6 Realistic Load Test Script

Save as `load-tests/redirect-benchmark.js`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

// 1. Realistic Test Data Pools
const USER_AGENTS = [
  // Mobile Safari (iOS)
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  // Chrome Mobile (Android)
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.119 Mobile Safari/537.36',
  // Chrome Desktop (Windows)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // Firefox Desktop (macOS)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.3; rv:123.0) Gecko/20100101 Firefox/123.0',
  // Bots & Crawlers
  'Twitterbot/1.0',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'curl/8.4.0'
];

const IPS = [
  '8.8.8.8',       // US
  '103.21.244.0',  // India
  '82.165.197.1',  // Germany
  '212.58.244.20', // UK
  '172.18.0.1'     // Local bridge
];

const REFERRERS = [
  'https://t.co/',
  'https://www.linkedin.com/',
  'https://news.ycombinator.com/',
  'https://youtube.com/',
  '' // Direct
];

const SHORT_CODES = ['youtube', 'careless-whisper', 'promo-test', 'launch2026'];

// 2. Selectable Stage Scenarios
export const options = {
  discardResponseBodies: true, // Crucial for high-throughput memory conservation
  scenarios: {
    // Override with CLI: k6 run --env STAGE=100k redirect-benchmark.js
    ramp_test: {
      executor: 'ramping-arrival-rate',
      startRate: __ENV.START_RPS ? parseInt(__ENV.START_RPS) : 10,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 2000,
      stages: [
        { duration: '30s', target: __ENV.TARGET_RPS ? parseInt(__ENV.TARGET_RPS) : 100 },
        { duration: '1m',  target: __ENV.TARGET_RPS ? parseInt(__ENV.TARGET_RPS) : 100 },
        { duration: '15s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.001'],    // 99.9% success rate
    http_req_duration: ['p(95)<3', 'p(99)<8'], // Sub-8ms P99
  },
};

export default function () {
  // Zipfian distribution: 70% of traffic to the first link
  const code = Math.random() < 0.70 ? SHORT_CODES[0] : SHORT_CODES[Math.floor(Math.random() * SHORT_CODES.length)];
  const ip = IPS[Math.floor(Math.random() * IPS.length)];
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const referrer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];

  // 40% probability of existing sticky cookie
  const params = {
    redirects: 0, // Do NOT follow 302 redirect
    headers: {
      'User-Agent': ua,
      'X-Forwarded-For': ip,
      'Referer': referrer,
    },
  };

  if (Math.random() < 0.40) {
    params.headers['Cookie'] = `ab_${code}=${Math.random() < 0.5 ? 'A' : 'B'}`;
  }

  const res = http.get(`http://localhost:8082/r/${code}?utm_source=k6&utm_medium=loadtest`, params);

  check(res, {
    'status is 302': (r) => r.status === 302,
    'has location header': (r) => r.headers['Location'] !== undefined,
  });
}
```

---

### High-Throughput wrk2 / Lua Script for 100k+ RPS

For pushing past 100,000 RPS on a single client machine, `wrk` with C/epoll has near-zero overhead compared to JavaScript runtimes.

Save as `load-tests/wrk-realistic.lua`:

```lua
-- wrk-realistic.lua
local uas = {
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14) Chrome/122.0.6261.119 Mobile Safari/537.36",
  "Twitterbot/1.0"
}

local ips = {
  "8.8.8.8",
  "103.21.244.0",
  "82.165.197.1",
  "172.18.0.1"
}

request = function()
  local ua = uas[math.random(#uas)]
  local ip = ips[math.random(#ips)]
  local path = (math.random() < 0.75) and "/r/youtube" or "/r/careless-whisper"

  wrk.headers["User-Agent"] = ua
  wrk.headers["X-Forwarded-For"] = ip
  wrk.headers["Connection"] = "keep-alive"
  return wrk.format("GET", path)
end
```

Execution command for 50,000 RPS benchmark:
```bash
wrk -t8 -c1000 -d60s -R50000 --latency -s load-tests/wrk-realistic.lua http://localhost:8082
```

---

## 5. Telemetry, Monitoring & Verification Checklist

During every stage, monitor these metrics across three terminals:

### 1. Redis Statistics & Ops/sec
```bash
docker compose exec redis-cache redis-cli info stats | grep -E "instantaneous_ops_per_sec|total_connections_received|keyspace_hits|keyspace_misses"
```
* **Success Indicator**: `keyspace_hits / (keyspace_hits + keyspace_misses) > 0.98`

### 2. Kafka Topic Lag & Write Rate
```bash
docker compose exec kafka-broker kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group analytics-ingest-group
```
* **Success Indicator**: `LAG` stays under 5,000 records even at high throughput (Analytics batch consumer keeps pace).

### 3. Container Resource Usage
```bash
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```
* **Success Indicator**: Memory remains stable without runaway GC pauses; CPU scale matches traffic tiers.

---

## 6. Execution Roadmap Summary

| Stage | Target RPS | Key Test Focus | Architectural Prerequisite |
| :--- | :--- | :--- | :--- |
| **Stage 1** | **10** | End-to-end event flow & 302 location accuracy | Standard Docker Compose setup |
| **Stage 2** | **100** | Netty concurrency & cache warm-up | Persistent keep-alive connections |
| **Stage 3** | **1,000** | Continuous P99 SLA & Kafka batch ingestion | HikariCP pool tuned to 20 |
| **Stage 4** | **10,000** | Redis Lettuce multiplexing & OS sockets | `somaxconn` tuned, Kafka `linger.ms=10` |
| **Stage 5** | **100,000** | Single-instance maximum throughput | **In-memory L1 Caffeine Cache** enabled |
| **Stage 6** | **1,000,000** | Hyper-scale distributed clustering | Nginx cluster + 8-12 Replicas + 32 Kafka Partitions |
