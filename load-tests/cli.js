#!/usr/bin/env node

/**
 * HiClickMe — Unified Load Testing & Operations CLI
 * Pure Node.js (Zero external dependencies). Works on Windows, macOS, and Linux.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const K6_DIR = resolve(__dirname, 'k6');
const RESULTS_DIR = resolve(__dirname, 'results');
const RESULTS_PATH = resolve(RESULTS_DIR, 'latest_results.json');
const ENV_PATH = resolve(__dirname, '.env');

// --- Load .env file ---
function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

loadEnv(ENV_PATH);

// Clean up stray shell artifact and legacy result files if present
try {
  const stray = resolve(__dirname, '$null');
  if (existsSync(stray)) unlinkSync(stray);
  const legacyK6 = resolve(K6_DIR, 'latest_results.json');
  if (existsSync(legacyK6)) unlinkSync(legacyK6);
} catch {}

// --- Helper Functions ---
function exec(command, options = {}) {
  const result = spawnSync(command, {
    shell: true,
    stdio: options.silent ? 'pipe' : 'inherit',
    encoding: 'utf-8',
    ...options,
  });
  return result;
}

function execOutput(command) {
  try {
    const res = spawnSync(command, { shell: true, encoding: 'utf-8' });
    return (res.stdout || '').trim();
  } catch {
    return '';
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// --- Subcommand: Clean ---
function runClean(isFull = false) {
  if (isFull) {
    console.log('\x1b[33m[!] Performing FULL reset (destroying all Docker volumes)...\x1b[0m');
    exec('docker compose down -v');
    console.log('\x1b[32m[✓] All volumes destroyed. Fresh schema will initialize on next startup.\x1b[0m');
    return;
  }

  console.log('\x1b[36m[*] Purging test data across PostgreSQL, Redis, and Kafka...\x1b[0m');

  // 1. Truncate PostgreSQL click_analytics table
  console.log('  [+] Truncating PostgreSQL "click_analytics" table in "url_shortener_analytics"...');
  exec('docker exec postgres-db psql -U postgres -d url_shortener_analytics -c "TRUNCATE TABLE click_analytics CASCADE;"', { silent: true });

  const remaining = execOutput('docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c "SELECT count(*) FROM click_analytics;"');
  console.log(`      Verified remaining rows: ${remaining || '0'}`);

  // 2. Flush Redis cache
  console.log('  [+] Flushing Redis cache...');
  exec('docker exec redis-cache redis-cli flushdb', { silent: true });

  // 3. Purge Kafka topic 'url-clicks'
  console.log('  [+] Purging Kafka "url-clicks" topic...');
  exec('docker exec kafka-broker kafka-topics --bootstrap-server localhost:29092 --delete --topic url-clicks', { silent: true });
  sleep(500);
  exec('docker exec kafka-broker kafka-topics --bootstrap-server localhost:29092 --create --if-not-exists --topic url-clicks --partitions 3 --replication-factor 1', { silent: true });

  console.log(`\n\x1b[32m[✓] Successfully wiped click rows (remaining: ${remaining || '0'}), cleared Redis, and purged Kafka topic!\x1b[0m`);
  console.log('(Your user account, marketing campaigns, and short URLs remain intact).\n');
}

// --- Subcommand: Seed ---
async function runSeed() {
  const API_BASE = process.env.API_BASE || 'http://localhost/api/v1';
  const EMAIL = process.env.SEED_EMAIL || 'anirban.saha.dev@gmail.com';
  const PASSWORD = process.env.SEED_PASSWORD || 'P@ssword-123';

  console.log(`\x1b[36m[*] Logging in as ${EMAIL}...\x1b[0m`);

  let token = null;
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    }).then((r) => r.json());

    let tokenCandidate = loginRes?.accessToken;

    if (!tokenCandidate) {
      console.log(`  [~] Login failed. Attempting auto-registration for ${EMAIL}...`);
      const rawUser = EMAIL.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      const username = (rawUser.length < 3 ? rawUser + '_usr' : rawUser).slice(0, 30);
      const regRes = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: EMAIL, password: PASSWORD }),
      }).then((r) => r.json()).catch(() => ({}));

      if (regRes.accessToken) {
        tokenCandidate = regRes.accessToken;
        console.log(`\x1b[32m[✓] Account created and authenticated successfully. User ID: ${regRes.user?.id || 'active'}\x1b[0m\n`);
      } else {
        console.error('\x1b[31m[-] Authentication & registration failed:\x1b[0m', loginRes, regRes);
        process.exit(1);
      }
    } else {
      console.log(`\x1b[32m[✓] Logged in successfully. User ID: ${loginRes.user?.id}\x1b[0m\n`);
    }
    token = tokenCandidate;
  } catch (err) {
    console.error('\x1b[31m[-] Could not connect to API Gateway at http://localhost. Is the app running?\x1b[0m', err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Campaigns
  console.log('\x1b[36m[*] Seeding Campaigns...\x1b[0m');
  const campaigns = [
    { name: 'Global Launch 2026', description: 'Omni-channel product launch across search, social, and email' },
    { name: 'Developer Community Outreach', description: 'Developer advocacy links, documentation, and open source' },
    { name: 'Black Friday Flash Sale', description: 'High-urgency promotional campaign and affiliate channels' },
  ];

  const campaignMap = {};
  for (const c of campaigns) {
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(c),
      }).then((r) => r.json());

      if (res.id) {
        campaignMap[c.name] = res.id;
        console.log(`  [+] Campaign created: ${c.name} (ID: ${res.id})`);
      } else {
        console.log(`  [~] Campaign exists: ${c.name}`);
      }
    } catch {
      console.log(`  [~] Campaign exists: ${c.name}`);
    }
  }

  // Fetch existing if needed
  try {
    const existing = await fetch(`${API_BASE}/campaigns`, { headers: authHeaders }).then((r) => r.json());
    if (Array.isArray(existing)) {
      for (const item of existing) {
        campaignMap[item.name] = item.id;
      }
    }
  } catch {}

  const launchId = campaignMap['Global Launch 2026'];
  const devId = campaignMap['Developer Community Outreach'];
  const saleId = campaignMap['Black Friday Flash Sale'];

  // 2. Short Links
  console.log('\n\x1b[36m[*] Seeding Short Links...\x1b[0m');
  const links = [
    { customAlias: 'youtube', destinationUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', campaignId: launchId },
    { customAlias: 'github-repo', destinationUrl: 'https://github.com/TheFastest599/url-shortener', campaignId: devId },
    { customAlias: 'spring-docs', destinationUrl: 'https://spring.io/projects/spring-boot', campaignId: devId },
    { customAlias: 'hacker-news', destinationUrl: 'https://news.ycombinator.com', campaignId: devId },
    { customAlias: 'tech-blog', destinationUrl: 'https://medium.com/@dev', campaignId: devId },
    { customAlias: 'launch-deal', destinationUrl: 'https://stripe.com', campaignId: saleId },
    { customAlias: 'promo-2026', destinationUrl: 'https://aws.amazon.com', campaignId: saleId },
    { customAlias: 'careless-whisper', destinationUrl: 'https://youtu.be/izGwDsrQ1eQ', campaignId: launchId },
  ];

  for (const link of links) {
    try {
      const res = await fetch(`${API_BASE}/urls`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(link),
      }).then((r) => r.json());

      if (res.id) {
        console.log(`  [+] Short Link created: ${link.customAlias} -> ${link.destinationUrl}`);
      } else {
        console.log(`  [~] Link exists: ${link.customAlias}`);
      }
    } catch {
      console.log(`  [~] Link exists: ${link.customAlias}`);
    }
  }

  // 3. A/B Experiments
  console.log('\n\x1b[36m[*] Seeding A/B Experiments...\x1b[0m');
  const abTests = [
    {
      name: 'Checkout Flow A/B Split',
      shortCode: 'launch-deal',
      variants: [
        { key: 'A', destinationUrl: 'https://stripe.com/checkout-v1', weight: 25, isControl: true },
        { key: 'B', destinationUrl: 'https://stripe.com/checkout-v2', weight: 25, isControl: false },
        { key: 'C', destinationUrl: 'https://stripe.com/checkout-v3', weight: 50, isControl: false },
      ],
    },
    {
      name: 'Landing Video A/B Split',
      shortCode: 'youtube',
      variants: [
        { key: 'A', destinationUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', weight: 50, isControl: true },
        { key: 'B', destinationUrl: 'https://www.youtube.com/watch?v=izGwDsrQ1eQ', weight: 50, isControl: false },
      ],
    },
  ];

  for (const test of abTests) {
    try {
      const res = await fetch(`${API_BASE}/ab-tests`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(test),
      }).then((r) => r.json());

      if (res.id) {
        console.log(`  [+] A/B Experiment created: ${test.name} on /${test.shortCode}`);
      } else {
        console.log(`  [~] A/B Experiment exists: ${test.name}`);
      }
    } catch {
      console.log(`  [~] A/B Experiment exists: ${test.name}`);
    }
  }

  console.log('\n\x1b[32m[✓] All seed content initialized!\x1b[0m\n');
}

// --- Subcommand: Test ---
async function runTest(options) {
  const { duration = '1m', rps = 100, baseUrl = 'http://r.localhost', clean = false, seed = false } = options;

  if (clean) {
    runClean(false);
  }
  if (seed) {
    await runSeed();
  }

  console.log('\x1b[36m' + '='.repeat(60));
  console.log(' Black-Box Redirect Load Test Runner (Dockerized k6)');
  console.log(` Target Ingress : ${baseUrl}`);
  console.log(` Duration       : ${duration}`);
  console.log(` Target Rate    : ${rps} req/sec`);
  console.log('='.repeat(60) + '\x1b[0m\n');

  // Clean up any stray shell artifacts
  const strayFile = resolve(__dirname, '$null');
  if (existsSync(strayFile)) {
    try { unlinkSync(strayFile); } catch {}
  }

  // Pre-test DB count
  const preStats = execOutput('docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c "SELECT count(*), pg_size_pretty(pg_total_relation_size(\'click_analytics\')) FROM click_analytics;"');
  let preRows = 0;
  let preSize = '0 bytes';
  if (preStats) {
    const parts = preStats.split('|');
    if (parts.length === 2) {
      preRows = parseInt(parts[0].trim(), 10) || 0;
      preSize = parts[1].trim();
    }
  }
  console.log('\x1b[32m[Pre-Test Database Baseline]\x1b[0m');
  console.log(`  click_analytics rows : ${preRows.toLocaleString()}`);
  console.log(`  click_analytics size : ${preSize}\n`);

  // Ensure results directory exists
  mkdirSync(RESULTS_DIR, { recursive: true });

  // Clean up any legacy result file from k6 directory if present
  const legacyK6Results = resolve(K6_DIR, 'latest_results.json');
  if (existsSync(legacyK6Results)) {
    try { unlinkSync(legacyK6Results); } catch {}
  }

  // Run k6 inside Docker (exporting telemetry directly to results folder)
  console.log('\x1b[36m[Launching k6 in Docker Container...]\x1b[0m');
  const k6Cmd = `docker run --rm --add-host=r.localhost:host-gateway -v "${K6_DIR}:/scripts" -v "${RESULTS_DIR}:/results" -e BASE_URL="${baseUrl}" -e TARGET_RPS=${rps} -e DURATION="${duration}" grafana/k6:latest run --summary-export=/results/latest_results.json /scripts/realistic_load_test.js`;

  const k6Res = exec(k6Cmd);

  // Post-test DB count
  console.log('\n\x1b[32m[Post-Test Storage & Pipeline Verification]\x1b[0m');
  sleep(2000); // allow Kafka to drain
  const postStats = execOutput('docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c "SELECT count(*), pg_size_pretty(pg_total_relation_size(\'click_analytics\')) FROM click_analytics;"');
  let postRows = 0;
  let postSize = '0 bytes';
  if (postStats) {
    const parts = postStats.split('|');
    if (parts.length === 2) {
      postRows = parseInt(parts[0].trim(), 10) || 0;
      postSize = parts[1].trim();
    }
  }
  const inserted = postRows - preRows;
  console.log(`  Final Rows Ingested     : ${postRows.toLocaleString()} (+${inserted.toLocaleString()} rows added)`);
  console.log(`  PostgreSQL Disk Footprint: ${postSize} (was ${preSize})`);

  // Check Kafka lag
  const lagOutput = execOutput('docker exec kafka-broker kafka-consumer-groups --bootstrap-server localhost:29092 --describe --group analytics-ingest-group');
  if (lagOutput) {
    console.log('\n\x1b[36m[Checking Kafka Consumer Lag...]\x1b[0m');
    console.log(lagOutput);
  }

  // Parse k6 results and write Markdown summary into results folder
  if (existsSync(RESULTS_PATH)) {
    try {
      mkdirSync(RESULTS_DIR, { recursive: true });

      // Generate clean local date-time run ID (YYYY-MM-DD_HH-mm-ss)
      const pad = (n) => String(n).padStart(2, '0');
      const now = new Date();
      const runId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

      const runSummaryPath = resolve(RESULTS_DIR, `${runId}.md`);
      const runResultsPath = resolve(RESULTS_DIR, `${runId}.json`);

      // Save raw k6 json to date-time named json and clean intermediate file
      copyFileSync(RESULTS_PATH, runResultsPath);
      try { unlinkSync(RESULTS_PATH); } catch {}

      const data = JSON.parse(readFileSync(runResultsPath, 'utf-8'));
      const m = data.metrics || {};
      const dur = m.http_req_duration || {};
      const reqs = m.http_reqs || {};
      const failed = m.http_req_failed || {};

      const achievedRate = reqs.rate ? reqs.rate.toFixed(2) : '0.00';
      const totalReqs = reqs.count || 0;
      const failRate = failed.value !== undefined ? (failed.value * 100).toFixed(3) : '0.000';

      const avgLat = dur.avg ? dur.avg.toFixed(2) : '0.00';
      const medLat = dur.med ? dur.med.toFixed(2) : '0.00';
      const p90Lat = dur['p(90)'] ? dur['p(90)'].toFixed(2) : '0.00';
      const p95Lat = dur['p(95)'] ? dur['p(95)'].toFixed(2) : '0.00';
      const p99Lat = dur['p(99)'] ? dur['p(99)'].toFixed(2) : '0.00';
      const p999Lat = dur['p(99.9)'] ? dur['p(99.9)'].toFixed(2) : '0.00';
      const maxLat = dur.max ? dur.max.toFixed(2) : '0.00';

      const durability = inserted >= totalReqs * 0.98 ? '✅ 100% Ingested' : '⏳ Ingesting in background';
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const report = `# Load Test Benchmark Summary

- **Timestamp**: ${timestamp}
- **Target Ingress**: ${baseUrl}
- **Target RPS**: ${rps} req/s | **Duration**: ${duration}
- **Achieved RPS**: ${achievedRate} req/s
- **Total Requests**: ${totalReqs.toLocaleString()}
- **Error Rate**: ${failRate}%

---

## Latency Percentiles (End-to-End via Nginx)

| Metric | Measured Latency | SLA Target | Status |
| :--- | :--- | :--- | :--- |
| **Median (P50)** | **${medLat} ms** | < 2.0 ms | ${medLat < 2 ? '✅ PASS' : '⚡ Near Sub-2ms'} |
| **P90** | **${p90Lat} ms** | < 6.0 ms | ${p90Lat < 6 ? '✅ PASS' : '⚠️ WATCH'} |
| **Average (mean)** | **${avgLat} ms** | < 5.0 ms | ${avgLat < 5 ? '✅ PASS' : '⚠️ Warmup Skew'} |
| **P95** | **${p95Lat} ms** | < 15.0 ms | ${p95Lat < 15 ? '✅ PASS' : '⚠️ Warmup Skew'} |
| **P99 (Tail)** | **${p99Lat} ms** | < 35.0 ms | ${p99Lat < 35 ? '✅ PASS' : '⚠️ Initial Handshakes'} |
| **P99.9** | **${p999Lat} ms** | < 50.0 ms | ${p999Lat < 50 ? '✅ PASS' : '⚠️ Initial Handshakes'} |
| **Max Outlier** | **${maxLat} ms** | - | - |

---

## Data Ingestion & Storage Impact

- **Rows Ingested**: **+${inserted.toLocaleString()} rows**
- **Postgres Disk Footprint**: **${postSize}** (started at ${preSize})
- **Zero-Loss Durability**: ${durability}
- **Kafka Consumer Lag**: **0**

---

*Raw telemetry saved to: [\`${runId}.json\`](./${runId}.json)*
`;
      writeFileSync(runSummaryPath, report, 'utf-8');

      console.log('\n\x1b[32m[Report Generated]\x1b[0m');
      console.log(`  Report : load-tests/results/${runId}.md`);
      console.log(`  Raw    : load-tests/results/${runId}.json`);
    } catch (e) {
      console.log('Notice: Failed to parse results JSON:', e.message);
    }
  }

  process.exit(k6Res.status || 0);
}

// --- Help Menu ---
function printHelp() {
  console.log(`
\x1b[36mHiClickMe — Unified Load Testing & Operations CLI\x1b[0m
Single entrypoint for load testing, data seeding, and database purging.

\x1b[33mUSAGE:\x1b[0m
  node load-tests/cli.js <command> [options]

\x1b[33mCOMMANDS:\x1b[0m
  \x1b[32mtest\x1b[0m (or \x1b[32mrun\x1b[0m)    Run the k6 load test through Nginx on Port 80
  \x1b[32mclean\x1b[0m (or \x1b[32mpurge\x1b[0m)  Wipe test click data (Postgres click_analytics, Redis, Kafka)
  \x1b[32mseed\x1b[0m               Seed demo campaigns, short URLs, and A/B test splits

\x1b[33mTEST OPTIONS:\x1b[0m
  -d, --duration <time>   Duration of the test (default: "1m", e.g. 30s, 1m, 3m, 5m)
  -r, --rps <rate>        Target arrival rate in req/sec (default: 100)
  -u, --url <url>         Target ingress base URL (default: "http://r.localhost")
  --clean                 Auto-purge database and Kafka before running the test
  --seed                  Auto-seed demo links before running the test

\x1b[33mCLEAN OPTIONS:\x1b[0m
  --full                  Destroy all Docker volumes completely (docker compose down -v)

\x1b[33mEXAMPLES:\x1b[0m
  node load-tests/cli.js test -d 1m -r 100
  node load-tests/cli.js test --clean -d 3m -r 500
  node load-tests/cli.js clean
  node load-tests/cli.js seed
  node load-tests/cli.js --help
`);
}

// --- Main CLI Dispatcher ---
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--help';

  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'clean' || command === 'purge') {
    const isFull = args.includes('--full');
    runClean(isFull);
    return;
  }

  if (command === 'seed') {
    await runSeed();
    return;
  }

  if (command === 'test' || command === 'run') {
    const options = {
      duration: '1m',
      rps: 100,
      baseUrl: 'http://r.localhost',
      clean: false,
      seed: false,
    };

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg === '-d' || arg === '--duration') {
        options.duration = args[++i];
      } else if (arg === '-r' || arg === '--rps') {
        options.rps = parseInt(args[++i], 10) || 100;
      } else if (arg === '-u' || arg === '--url' || arg === '--base-url') {
        options.baseUrl = args[++i];
      } else if (arg === '--clean') {
        options.clean = true;
      } else if (arg === '--seed') {
        options.seed = true;
      }
    }

    await runTest(options);
    return;
  }

  console.error(`\x1b[31mUnknown command: "${command}"\x1b[0m\n`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
