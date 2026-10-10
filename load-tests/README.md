# urlShortener — Unified Load Testing & Benchmark Suite

This directory contains the universal, pure **Node.js** load testing suite for the **URL Shortener Redirection Engine**. It exercises real-world ingress through **Nginx on Port 80**, evaluating end-to-end latency (P50, P90, P95, P99), asynchronous Kafka event streaming, and PostgreSQL batch ingestion.

The entire suite uses a single, generic entrypoint CLI with `--help` and zero external npm dependencies:
$$\textbf{node load-tests/cli.js <command> [options]}$$

---

## 📁 Directory Structure

```
load-tests/
├── k6/
│   └── realistic_load_test.js     # k6 load script (Zipfian links, User-Agents, GeoIPs, A/B cookies)
├── results/                       # Historical benchmark outputs & telemetry
│   ├── <date_time>.md             # Timestamped run summary (YYYY-MM-DD_HH-mm-ss.md)
│   └── <date_time>.json           # Raw k6 metrics JSON (YYYY-MM-DD_HH-mm-ss.json)
├── cli.js                         # Unified single entrypoint CLI (test, clean, seed)
└── README.md                      # This guide
```

---

## 1. Prerequisites

Ensure the application stack is running:

```bash
docker compose up -d
```

Verify services are healthy:

```bash
docker compose ps
```

---

## 2. CLI Usage & Help

```bash
node load-tests/cli.js --help
```

Output:

```text
urlShortener — Unified Load Testing & Operations CLI
Single entrypoint for load testing, data seeding, and database purging.

USAGE:
  node load-tests/cli.js <command> [options]

COMMANDS:
  test (or run)    Run the k6 load test through Nginx on Port 80
  clean (or purge)  Wipe test click data (Postgres click_analytics, Redis, Kafka)
  seed               Seed demo campaigns, short URLs, and A/B test splits

TEST OPTIONS:
  -d, --duration <time>   Duration of the test (default: "1m", e.g. 30s, 1m, 3m, 5m)
  -r, --rps <rate>        Target arrival rate in req/sec (default: 100)
  -u, --url <url>         Target ingress base URL (default: "http://r.localhost")
  --clean                 Auto-purge database and Kafka before running the test
  --seed                  Auto-seed demo links before running the test

CLEAN OPTIONS:
  --full                  Destroy all Docker volumes completely (docker compose down -v)
```

---

## 3. Common Workflows

### A. Seed Demo Content (One-Time)

Populates campaigns, short links (`youtube`, `launch-deal`, `promo-2026`, etc.), and A/B test splits:

```bash
node load-tests/cli.js seed
```

```
Login as :
email : test.dev@gmail.com
password : P@ssword-123
```

### B. Standard 1-Minute Baseline Test

```bash
node load-tests/cli.js test -d 1m -r 100
```

### C. Sustained Stress / Soak Test (3 to 5 Minutes)

```bash
node load-tests/cli.js test -d 3m -r 500
```

### D. High-Throughput Spike Test (1,000+ RPS Burst)

```bash
node load-tests/cli.js test -d 15s -r 1000
```

### E. Auto-Clean and Test in One Step

Wipes old click data, runs a 1-minute benchmark, and saves the new report:

```bash
node load-tests/cli.js test --clean -d 1m -r 100
```

### F. Fast Data Purge Between Runs

Truncates PostgreSQL `click_analytics`, flushes Redis, and recreates Kafka `url-clicks` in `< 0.1s` (preserves your account and short URLs):

```bash
node load-tests/cli.js clean
```

---

## 4. Reviewing Test Results

Every test run outputs clean, timestamped telemetry directly to `results/`:

1. **`results/<YYYY-MM-DD_HH-mm-ss>.md`**: Auto-generated markdown report with:
    - Achieved RPS and total requests
    - Latency percentiles: **Median (P50), P90, P95, P99, P99.9, and Max**
    - SLA targets and status indicators
    - Database row count and disk storage delta
2. **`results/<YYYY-MM-DD_HH-mm-ss>.json`**: Raw k6 JSON export containing every counter, rate, and trend metric.
3. **Live Web UI Dashboard**: Open `http://localhost:5173` to see visual analytics populated in real time (Analytics Hub, A/B Variant Comparison Chart, GeoIP maps, and referrer charts).
