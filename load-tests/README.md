# urlShortener — Unified Load Testing & Benchmark Suite

This directory contains the universal, pure **Node.js** load testing suite for the **URL Shortener Redirection Engine**. It exercises real-world ingress through **Nginx on Port 80**, evaluating end-to-end latency (P50, P90, P95, P99), asynchronous Kafka event streaming, and PostgreSQL batch ingestion.

The entire suite uses a single, generic entrypoint CLI with `--help` and zero external npm dependencies:
$$\textbf{node load-tests/cli.js <command> [options]}$$

---

## Directory Structure

```
load-tests/
├── k6/
│   └── realistic_load_test.js     # k6 load script (Zipfian links, User-Agents, GeoIPs, A/B cookies)
├── results/                       # Historical benchmark outputs & telemetry
│   ├── <date_time>.md             # Timestamped run summary (YYYY-MM-DD_HH-mm-ss.md)
│   └── <date_time>.json           # Raw k6 metrics JSON (YYYY-MM-DD_HH-mm-ss.json)
├── cli.js                         # Unified single entrypoint CLI (test, ramp, clean, seed, ip, stats)
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
  ramp (or step)   Run stepped ramp-up test to find hardware limits
  clean (or purge) Wipe test click data (Postgres click_analytics, Redis, Kafka)
  seed             Seed demo campaigns, short URLs, and A/B test splits
  ip (or host)     Print local IP addresses and cross-machine test commands
  stats            Inspect PostgreSQL click_analytics row count and Kafka lag

TEST OPTIONS:
  -d, --duration <time>   Duration of the test (default: "1m", e.g. 30s, 1m, 3m, 5m)
  -r, --rps <rate>        Target arrival rate in req/sec (default: 100)
  -t, --target <ip/host>  Target machine IP or hostname for cross-machine testing
  -m, --ramp <time>       Warm-up ramp duration for initial start stage (default: "5s")
  -v, --vus <count>       Max virtual users allocated (default: auto-capped at 1,000)
  -u, --url <url>         Target ingress base URL (default: "http://r.localhost")
  --clean                 Auto-purge database and Kafka before running the test
  --seed                  Auto-seed demo links before running the test

CLEAN OPTIONS:
  --full                  Destroy all Docker volumes completely (docker compose down -v)
```

---

## 3. Execution Modes: Local vs. Cross-Machine

### Mode A: Same Machine (Default)
By default (without the `--target` flag), the CLI executes entirely on the local machine:
- Targets `http://r.localhost` directly.
- Attaches the test container to the local Docker network (`nginx-ingress`).
- Inspects local PostgreSQL `click_analytics` and Kafka lag before and after the test.

```bash
node load-tests/cli.js test -d 1m -r 5000
```

### Mode B: Cross-Machine Wi-Fi Testing (Flag-Activated)
When provided with the `--target <IP>` or `-t <IP>` flag, the CLI switches to cross-machine mode:
- Routes requests to the remote target IP over Wi-Fi / LAN.
- Sets in-container DNS resolution (`--add-host=r.localhost:<IP>`) so Nginx routes to the redirect service.
- Performs a pre-flight connectivity check against port 80.
- Skips local Docker inspection on the client machine and directs the user to check server stats.

#### Step 1: On the Server Machine (Machine A)
Start the stack and get the host's Wi-Fi IP:
```bash
docker compose up -d
node load-tests/cli.js ip
```
*(If prompted by firewall, allow incoming traffic on Port 80).*

#### Step 2: On the Tester Machine (Machine B)
Run the load test targeting Machine A's IP:
```bash
node load-tests/cli.js test --target <MACHINE_A_IP> -d 2m -r 5000
```

Or run an automated stepped ramp saturation test:
```bash
node load-tests/cli.js ramp --target <MACHINE_A_IP> --start 1000 --step 500
```

#### Step 3: On the Server Machine (Machine A)
Inspect database rows ingested and Kafka consumer lag:
```bash
node load-tests/cli.js stats
```

---

## 4. Common Workflows

### A. Seed Demo Content (One-Time)

Populates campaigns, short links (`youtube`, `launch-deal`, `promo-2026`, etc.), and A/B test splits:

```bash
node load-tests/cli.js seed
```

Or seed against a remote server:
```bash
node load-tests/cli.js seed --target <MACHINE_A_IP>
```

```
Login as :
email : test.dev@gmail.com
password : P@ssword-123
```

### B. Standard 1-Minute Baseline Test (Local)

```bash
node load-tests/cli.js test -d 1m -r 100
```

### C. Sustained Stress / Soak Test (5,000 RPS)

```bash
node load-tests/cli.js test -d 30m -r 5000
```

### D. Stepped Ramp Saturation Test

Tests ascending throughput brackets (1000, 1500, 2000, ... rps) until degradation:

```bash
node load-tests/cli.js ramp --start 1000 --step 500
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

## 5. Reviewing Test Results

Every test run outputs clean, timestamped telemetry directly to `results/`:

1. **`results/<YYYY-MM-DD_HH-mm-ss>.md`**: Auto-generated markdown report with:
    - Test execution command and environment configuration (local or cross-machine)
    - Achieved RPS and total requests
    - Latency percentiles: **Median (P50), P90, P95, P99, P99.9, and Max**
    - SLA targets and status indicators
    - Database row count and disk storage delta
2. **`results/<YYYY-MM-DD_HH-mm-ss>.json`**: Raw k6 JSON export containing every counter, rate, and trend metric.
3. **Live Web UI Dashboard**: Open `http://localhost:5173` to see visual analytics populated in real time (Analytics Hub, A/B Variant Comparison Chart, GeoIP maps, and referrer charts).
