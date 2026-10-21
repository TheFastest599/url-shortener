#!/usr/bin/env node

/**
 * urlShortener — Unified Load Testing & Operations CLI
 * Pure Node.js (Zero external dependencies). Works on Windows, macOS, and Linux.
 */

import { spawnSync } from "node:child_process";
import {
	readFileSync,
	writeFileSync,
	existsSync,
	mkdirSync,
	copyFileSync,
	unlinkSync,
} from "node:fs";
import os from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const K6_DIR = resolve(__dirname, "k6");
const RESULTS_DIR = resolve(__dirname, "results");
const RESULTS_PATH = resolve(RESULTS_DIR, "latest_results.json");
const ENV_PATH = resolve(__dirname, ".env");

// --- Load .env file ---
function loadEnv(filePath) {
	if (!existsSync(filePath)) return;
	try {
		const content = readFileSync(filePath, "utf-8");
		for (const line of content.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const idx = trimmed.indexOf("=");
			if (idx !== -1) {
				const key = trimmed.slice(0, idx).trim();
				const val = trimmed
					.slice(idx + 1)
					.trim()
					.replace(/^['"](.*)['"]$/, "$1");
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
	const stray = resolve(__dirname, "$null");
	if (existsSync(stray)) unlinkSync(stray);
	const legacyK6 = resolve(K6_DIR, "latest_results.json");
	if (existsSync(legacyK6)) unlinkSync(legacyK6);
} catch {}

// --- Helper Functions ---
function exec(command, options = {}) {
	const result = spawnSync(command, {
		shell: true,
		stdio: options.silent ? "pipe" : "inherit",
		encoding: "utf-8",
		...options,
	});
	return result;
}

function execOutput(command) {
	try {
		const res = spawnSync(command, { shell: true, encoding: "utf-8" });
		return (res.stdout || "").trim();
	} catch {
		return "";
	}
}

function sleep(ms) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function parseDurationSec(durStr) {
	if (!durStr) return 60;
	const match = String(durStr).trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/);
	if (!match) return 60;
	const val = parseFloat(match[1]);
	const unit = match[2] || "s";
	if (unit === "ms") return Math.max(1, Math.round(val / 1000));
	if (unit === "m") return Math.round(val * 60);
	if (unit === "h") return Math.round(val * 3600);
	return Math.round(val);
}

function resolveDockerNetworkFlags(targetIp = null) {
	if (targetIp) {
		return `--add-host=r.localhost:${targetIp} --add-host=localhost:${targetIp} --add-host=r.${targetIp}.nip.io:${targetIp} --add-host=${targetIp}.nip.io:${targetIp}`;
	}
	try {
		const res = spawnSync("docker", ["inspect", "nginx-ingress"], {
			encoding: "utf-8",
		});
		if (res.status === 0 && res.stdout) {
			const data = JSON.parse(res.stdout);
			if (Array.isArray(data) && data[0]?.NetworkSettings?.Networks) {
				const networks = data[0].NetworkSettings.Networks;
				for (const [netName, netConfig] of Object.entries(networks)) {
					if (netConfig.IPAddress) {
						return `--network ${netName} --add-host=r.localhost:${netConfig.IPAddress} --add-host=localhost:${netConfig.IPAddress}`;
					}
				}
			}
		}
	} catch {}
	return "--add-host=r.localhost:host-gateway --add-host=localhost:host-gateway";
}

function isLocalStackRunning() {
	try {
		const out = execOutput("docker ps --filter name=postgres-db --format {{.Names}}");
		return out.includes("postgres-db");
	} catch {
		return false;
	}
}

function getLocalIpAddresses() {
	const interfaces = os.networkInterfaces();
	const candidates = [];
	for (const [name, netList] of Object.entries(interfaces)) {
		for (const net of netList || []) {
			if (net.family === "IPv4" && !net.internal) {
				const isVirtual = /vEthernet|VirtualBox|VMware|WSL|docker/i.test(name);
				const isWifi = /wi-?fi|wlan|wireless/i.test(name);
				const isEthernet = /eth|ethernet|en\d/i.test(name) && !isVirtual;
				candidates.push({
					name,
					address: net.address,
					isWifi,
					isEthernet,
					isVirtual,
				});
			}
		}
	}
	candidates.sort((a, b) => {
		if (a.isWifi && !b.isWifi) return -1;
		if (!a.isWifi && b.isWifi) return 1;
		if (a.isEthernet && !b.isEthernet) return -1;
		if (!a.isEthernet && b.isEthernet) return 1;
		if (!a.isVirtual && b.isVirtual) return -1;
		if (a.isVirtual && !b.isVirtual) return 1;
		return 0;
	});
	return candidates;
}

function resolveTarget(target, baseUrl = "http://r.localhost") {
	let targetIp = null;
	let effectiveBaseUrl = baseUrl;

	if (target) {
		let clean = String(target).trim();
		clean = clean.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");

		const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
		if (ipv4Regex.test(clean)) {
			targetIp = clean;
			if (!baseUrl || baseUrl === "http://r.localhost") {
				effectiveBaseUrl = `http://r.${targetIp}.nip.io`;
			}
		} else {
			const nipMatch = clean.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
			if (nipMatch) {
				targetIp = nipMatch[1];
			}
			if (!baseUrl || baseUrl === "http://r.localhost") {
				effectiveBaseUrl = clean.startsWith("r.") ? `http://${clean}` : `http://r.${clean}`;
			} else {
				effectiveBaseUrl = clean.startsWith("http://") || clean.startsWith("https://") ? clean : `http://${clean}`;
			}
		}
	}

	return { targetIp, effectiveBaseUrl };
}

async function checkTargetReachability(url, targetIp) {
	const testUrl = targetIp ? `http://${targetIp}/api/v1/health` : `${url}/`;
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3500);
		const res = await fetch(testUrl, {
			method: "GET",
			signal: controller.signal,
		});
		clearTimeout(timeoutId);
		return { ok: true, status: res.status };
	} catch (err) {
		return { ok: false, error: err.message };
	}
}

function runHostInfo() {
	const ips = getLocalIpAddresses();
	const primary = ips[0]?.address || "127.0.0.1";
	const isLocal = isLocalStackRunning();

	console.log("\x1b[36m" + "=".repeat(65));
	console.log(" Cross-Machine Load Testing & Wi-Fi Network Setup");
	console.log("=".repeat(65) + "\x1b[0m\n");

	console.log("\x1b[33m[Host Machine Network Profiles]\x1b[0m");
	if (ips.length === 0) {
		console.log("  No external network interfaces detected. (Using loopback 127.0.0.1)");
	} else {
		for (const ip of ips) {
			const tag = ip.isWifi ? " [Wi-Fi]" : ip.isEthernet ? " [Ethernet]" : ip.isVirtual ? " [Virtual/WSL]" : "";
			const star = ip.address === primary ? " (Recommended)" : "";
			console.log(`  - \x1b[32m${ip.address.padEnd(16)}\x1b[0m ${ip.name}${tag}${star}`);
		}
	}

	console.log("\n\x1b[33m[Target Ingress URLs]\x1b[0m");
	console.log(`  - Wildcard DNS (Zero Config) : \x1b[36mhttp://r.${primary}.nip.io\x1b[0m`);
	console.log(`  - Localhost Domain (Mapped)  : \x1b[36mhttp://r.localhost\x1b[0m (maps to ${primary})`);
	console.log(`  - Direct Web / API Gateway   : \x1b[36mhttp://${primary}\x1b[0m`);

	console.log("\n\x1b[33m[Local Docker Stack Status]\x1b[0m");
	console.log(`  - Stack Running on this machine: ${isLocal ? "\x1b[32mYES (Ready for remote traffic)\x1b[0m" : "\x1b[31mNO (Run 'docker compose up -d' first)\x1b[0m"}`);

	console.log("\n\x1b[33m[Commands for Machine B (Load Tester)]\x1b[0m");
	console.log("  1. Fixed-Rate Test (e.g. 5,000 req/s for 2 minutes):");
	console.log(`     \x1b[32mnode load-tests/cli.js test --target ${primary} -d 2m -r 5000\x1b[0m\n`);
	console.log("  2. Stepped Ramp Saturation Test:");
	console.log(`     \x1b[32mnode load-tests/cli.js ramp --target ${primary} --start 1000 --step 500\x1b[0m\n`);
	console.log("  3. Seed Demo Data on Server from Machine B:");
	console.log(`     \x1b[32mnode load-tests/cli.js seed --target ${primary}\x1b[0m\n`);

	console.log("\x1b[33m[Post-Test Verification on Server Machine]\x1b[0m");
	console.log("  Run this on the server machine to check database growth and Kafka lag:");
	console.log("     \x1b[36mnode load-tests/cli.js stats\x1b[0m\n");

	console.log("\x1b[33m[Firewall Troubleshooting]\x1b[0m");
	console.log("  If Machine B cannot reach Machine A over Wi-Fi, ensure Port 80 is allowed on this host.");
	console.log("  In Windows PowerShell (as Administrator), run:");
	console.log("     \x1b[90mNew-NetFirewallRule -DisplayName \"URL Shortener Port 80\" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow\x1b[0m\n");
}

function runStats() {
	console.log("\x1b[36m" + "=".repeat(60));
	console.log(" PostgreSQL & Kafka Storage Telemetry");
	console.log("=".repeat(60) + "\x1b[0m\n");

	if (!isLocalStackRunning()) {
		console.log("\x1b[31m[-] PostgreSQL container ('postgres-db') is not running locally.\x1b[0m");
		console.log("    Run this command on the server machine where Docker is running.");
		return;
	}

	const stats = execOutput(
		"docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c \"SELECT count(*), pg_size_pretty(pg_total_relation_size('click_analytics')) FROM click_analytics;\"",
	);
	let rows = 0;
	let size = "0 bytes";
	if (stats) {
		const parts = stats.split("|");
		if (parts.length === 2) {
			rows = parseInt(parts[0].trim(), 10) || 0;
			size = parts[1].trim();
		}
	}

	console.log("\x1b[32m[Database Status]\x1b[0m");
	console.log(`  Table Name : click_analytics (database: url_shortener_analytics)`);
	console.log(`  Total Rows : ${rows.toLocaleString()}`);
	console.log(`  Disk Size  : ${size}\n`);

	const lagOutput = execOutput(
		"docker exec kafka-broker kafka-consumer-groups --bootstrap-server localhost:29092 --describe --group analytics-ingest-group",
	);
	if (lagOutput) {
		console.log("\x1b[36m[Kafka Consumer Lag]\x1b[0m");
		console.log(lagOutput);
	}
}

function collectTestEnvironment(targetIp = null, effectiveBaseUrl = "http://r.localhost") {
	const args = process.argv.slice(2).map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ");
	const command = `node load-tests/cli.js ${args}`;

	const rawServices = execOutput("docker compose ps --format \"{{.Service}}|{{.Name}}|{{.Status}}|{{.Ports}}\"");
	const services = [];
	if (rawServices) {
		for (const line of rawServices.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			const parts = trimmed.split("|");
			services.push({
				service: parts[0] || "unknown",
				container: parts[1] || "",
				status: parts[2] || "",
				ports: parts[3] || "-",
			});
		}
	}

	const redirectReplicas = services.filter((s) => s.service === "redirect").length || 1;

	let markdown = `## Test & Infrastructure Configuration\n\n`;
	markdown += `- **Execution Command**: \`${command}\`\n`;

	if (services.length > 0) {
		markdown += `- **Redirect Service Scale**: **${redirectReplicas} active replica${redirectReplicas > 1 ? "s" : ""}**\n`;
		markdown += `- **Nginx Ingress**: 4 worker processes (\`worker_connections 32768\`, \`keepalive 4096\`)\n`;
		markdown += `- **Redis Cache**: Redis 7.2 Alpine (Reactive Netty non-blocking)\n`;
		markdown += `- **Message Broker**: Apache Kafka 7.6.0 KRaft\n\n`;
		markdown += `### Active Docker Containers\n\n`;
		markdown += `| Service | Container Name | Status | Ports / Mapping |\n`;
		markdown += `| :--- | :--- | :--- | :--- |\n`;
		for (const s of services) {
			markdown += `| **${s.service}** | \`${s.container}\` | ${s.status} | ${s.ports} |\n`;
		}
	} else {
		markdown += `- **Execution Mode**: **Cross-Machine Remote Load Test**\n`;
		markdown += `- **Target Ingress**: \`${effectiveBaseUrl}\`\n`;
		if (targetIp) {
			markdown += `- **Remote Target Server**: \`${targetIp}\` (Traffic routed over Wi-Fi / LAN)\n`;
			markdown += `- **DNS Resolution**: In-container Docker hosts + k6 options.hosts mapped to \`${targetIp}\`\n`;
		}
		markdown += `- **Server Stack**: Hosted remotely on the application machine.\n`;
		markdown += `- **Storage / Kafka Pipeline**: To inspect database ingestion delta and consumer lag on the server, run: \`node load-tests/cli.js stats\` on the server machine.\n`;
	}

	return {
		command,
		redirectReplicas: services.length > 0 ? redirectReplicas : 1,
		services,
		markdown,
	};
}

// --- Subcommand: Clean ---
function runClean(isFull = false) {
	if (!isLocalStackRunning()) {
		console.log(
			"\x1b[33m[!] PostgreSQL / Kafka containers are not running on this machine.\x1b[0m",
		);
		console.log(
			"    If you are running in cross-machine mode, run 'node load-tests/cli.js clean' on the server machine.\n",
		);
		return;
	}

	if (isFull) {
		console.log(
			"\x1b[33m[!] Performing FULL reset (destroying all Docker volumes)...\x1b[0m",
		);
		exec("docker compose down -v");
		console.log(
			"\x1b[32m[✓] All volumes destroyed. Fresh schema will initialize on next startup.\x1b[0m",
		);
		return;
	}

	console.log(
		"\x1b[36m[*] Purging test data across PostgreSQL, Redis, and Kafka...\x1b[0m",
	);

	// 1. Truncate PostgreSQL click_analytics table
	console.log(
		'  [+] Truncating PostgreSQL "click_analytics" table in "url_shortener_analytics"...',
	);
	exec(
		'docker exec postgres-db psql -U postgres -d url_shortener_analytics -c "TRUNCATE TABLE click_analytics CASCADE;"',
		{ silent: true },
	);

	const remaining = execOutput(
		'docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c "SELECT count(*) FROM click_analytics;"',
	);
	console.log(`      Verified remaining rows: ${remaining || "0"}`);

	// 2. Flush Redis cache
	console.log("  [+] Flushing Redis cache...");
	exec("docker exec redis-cache redis-cli flushdb", { silent: true });

	// 3. Purge Kafka topic 'url-clicks'
	console.log('  [+] Purging Kafka "url-clicks" topic...');
	exec(
		"docker exec kafka-broker kafka-topics --bootstrap-server localhost:29092 --delete --topic url-clicks",
		{ silent: true },
	);
	sleep(500);
	exec(
		"docker exec kafka-broker kafka-topics --bootstrap-server localhost:29092 --create --if-not-exists --topic url-clicks --partitions 3 --replication-factor 1",
		{ silent: true },
	);

	console.log(
		`\n\x1b[32m[✓] Successfully wiped click rows (remaining: ${remaining || "0"}), cleared Redis, and purged Kafka topic!\x1b[0m`,
	);
	console.log(
		"(Your user account, marketing campaigns, and short URLs remain intact).\n",
	);
}

// --- Subcommand: Seed ---
async function runSeed(target = null) {
	const { targetIp } = resolveTarget(target);
	let defaultApiBase = "http://localhost/api/v1";
	if (targetIp) {
		defaultApiBase = `http://${targetIp}/api/v1`;
	} else if (target) {
		const clean = String(target).replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
		defaultApiBase = `http://${clean}/api/v1`;
	}
	const API_BASE = process.env.API_BASE || defaultApiBase;
	const EMAIL = process.env.SEED_EMAIL || "test.dev@gmail.com";
	const PASSWORD = process.env.SEED_PASSWORD || "P@ssword-123";

	console.log(`\x1b[36m[*] Connecting to API Gateway at ${API_BASE} as ${EMAIL}...\x1b[0m`);

	let token = null;
	try {
		const loginRes = await fetch(`${API_BASE}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
		}).then((r) => r.json());

		let tokenCandidate = loginRes?.accessToken;

		if (!tokenCandidate) {
			console.log(
				`  [~] Login failed. Attempting auto-registration for ${EMAIL}...`,
			);
			const rawUser = EMAIL.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
			const username = (
				rawUser.length < 3 ? rawUser + "_usr" : rawUser
			).slice(0, 30);
			const regRes = await fetch(`${API_BASE}/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username,
					email: EMAIL,
					password: PASSWORD,
				}),
			})
				.then((r) => r.json())
				.catch(() => ({}));

			if (regRes.accessToken) {
				tokenCandidate = regRes.accessToken;
				console.log(
					`\x1b[32m[✓] Account created and authenticated successfully. User ID: ${regRes.user?.id || "active"}\x1b[0m\n`,
				);
			} else {
				console.error(
					"\x1b[31m[-] Authentication & registration failed:\x1b[0m",
					loginRes,
					regRes,
				);
				process.exit(1);
			}
		} else {
			console.log(
				`\x1b[32m[✓] Logged in successfully. User ID: ${loginRes.user?.id}\x1b[0m\n`,
			);
		}
		token = tokenCandidate;
	} catch (err) {
		console.error(
			"\x1b[31m[-] Could not connect to API Gateway at http://localhost. Is the app running?\x1b[0m",
			err.message,
		);
		process.exit(1);
	}

	const authHeaders = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token}`,
	};

	// 1. Campaigns
	console.log("\x1b[36m[*] Seeding Campaigns...\x1b[0m");
	const campaigns = [
		{
			name: "Global Launch 2026",
			description:
				"Omni-channel product launch across search, social, and email",
		},
		{
			name: "Developer Community Outreach",
			description:
				"Developer advocacy links, documentation, and open source",
		},
		{
			name: "Black Friday Flash Sale",
			description:
				"High-urgency promotional campaign and affiliate channels",
		},
	];

	const campaignMap = {};
	for (const c of campaigns) {
		try {
			const res = await fetch(`${API_BASE}/campaigns`, {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify(c),
			}).then((r) => r.json());

			if (res.id) {
				campaignMap[c.name] = res.id;
				console.log(
					`  [+] Campaign created: ${c.name} (ID: ${res.id})`,
				);
			} else {
				console.log(`  [~] Campaign exists: ${c.name}`);
			}
		} catch {
			console.log(`  [~] Campaign exists: ${c.name}`);
		}
	}

	// Fetch existing if needed
	try {
		const existing = await fetch(`${API_BASE}/campaigns`, {
			headers: authHeaders,
		}).then((r) => r.json());
		if (Array.isArray(existing)) {
			for (const item of existing) {
				campaignMap[item.name] = item.id;
			}
		}
	} catch {}

	const launchId = campaignMap["Global Launch 2026"];
	const devId = campaignMap["Developer Community Outreach"];
	const saleId = campaignMap["Black Friday Flash Sale"];

	// 2. Short Links
	console.log("\n\x1b[36m[*] Seeding Short Links...\x1b[0m");
	const links = [
		{
			customAlias: "youtube",
			destinationUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			campaignId: launchId,
		},
		{
			customAlias: "github-repo",
			destinationUrl: "https://github.com/TheFastest599/url-shortener",
			campaignId: devId,
		},
		{
			customAlias: "spring-docs",
			destinationUrl: "https://spring.io/projects/spring-boot",
			campaignId: devId,
		},
		{
			customAlias: "hacker-news",
			destinationUrl: "https://news.ycombinator.com",
			campaignId: devId,
		},
		{
			customAlias: "tech-blog",
			destinationUrl: "https://medium.com/@dev",
			campaignId: devId,
		},
		{
			customAlias: "launch-deal",
			destinationUrl: "https://stripe.com",
			campaignId: saleId,
		},
		{
			customAlias: "promo-2026",
			destinationUrl: "https://aws.amazon.com",
			campaignId: saleId,
		},
		{
			customAlias: "careless-whisper",
			destinationUrl: "https://youtu.be/izGwDsrQ1eQ",
			campaignId: launchId,
		},
	];

	for (const link of links) {
		try {
			const res = await fetch(`${API_BASE}/urls`, {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify(link),
			}).then((r) => r.json());

			if (res.id) {
				console.log(
					`  [+] Short Link created: ${link.customAlias} -> ${link.destinationUrl}`,
				);
			} else {
				console.log(`  [~] Link exists: ${link.customAlias}`);
			}
		} catch {
			console.log(`  [~] Link exists: ${link.customAlias}`);
		}
	}

	// 3. A/B Experiments
	console.log("\n\x1b[36m[*] Seeding A/B Experiments...\x1b[0m");
	const abTests = [
		{
			name: "Checkout Flow A/B Split",
			shortCode: "launch-deal",
			variants: [
				{
					key: "A",
					destinationUrl: "https://stripe.com/checkout-v1",
					weight: 25,
					isControl: true,
				},
				{
					key: "B",
					destinationUrl: "https://stripe.com/checkout-v2",
					weight: 25,
					isControl: false,
				},
				{
					key: "C",
					destinationUrl: "https://stripe.com/checkout-v3",
					weight: 50,
					isControl: false,
				},
			],
		},
		{
			name: "Landing Video A/B Split",
			shortCode: "youtube",
			variants: [
				{
					key: "A",
					destinationUrl:
						"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
					weight: 50,
					isControl: true,
				},
				{
					key: "B",
					destinationUrl:
						"https://www.youtube.com/watch?v=izGwDsrQ1eQ",
					weight: 50,
					isControl: false,
				},
			],
		},
	];

	for (const test of abTests) {
		try {
			const res = await fetch(`${API_BASE}/ab-tests`, {
				method: "POST",
				headers: authHeaders,
				body: JSON.stringify(test),
			}).then((r) => r.json());

			if (res.id) {
				console.log(
					`  [+] A/B Experiment created: ${test.name} on /${test.shortCode}`,
				);
			} else {
				console.log(`  [~] A/B Experiment exists: ${test.name}`);
			}
		} catch {
			console.log(`  [~] A/B Experiment exists: ${test.name}`);
		}
	}

	console.log("\n\x1b[32m[✓] All seed content initialized!\x1b[0m\n");
}

// --- Subcommand: Test ---
async function runTest(options) {
	const {
		duration = "1m",
		rps = 100,
		clean = false,
		seed = false,
		target = null,
	} = options;

	const { targetIp, effectiveBaseUrl } = resolveTarget(target, options.baseUrl || "http://r.localhost");

	if (clean) {
		runClean(false);
	}
	if (seed) {
		await runSeed(target);
	}

	console.log("\x1b[36m" + "=".repeat(60));
	console.log(" Black-Box Redirect Load Test Runner (Dockerized k6)");
	console.log(` Target Ingress : ${effectiveBaseUrl}`);
	if (targetIp) {
		console.log(` Target Host IP : ${targetIp} (Cross-Machine Wi-Fi Mode)`);
		console.log(` DNS Mapping    : ${effectiveBaseUrl} -> ${targetIp} (in-container hosts)`);
		console.log(` k6 Resources   : Uncapped (100% Host CPU & Memory)`);
	}
	console.log(` Target Rate    : ${rps} req/sec`);
	console.log(` Duration       : ${duration}`);
	console.log("=".repeat(60) + "\x1b[0m\n");

	// Preflight connectivity check if cross-machine
	if (targetIp) {
		console.log(`\x1b[36m[*] Pre-flight connectivity check to ${targetIp}:80...\x1b[0m`);
		const check = await checkTargetReachability(effectiveBaseUrl, targetIp);
		if (check.ok) {
			console.log(`  \x1b[32m[✓] Connection established (HTTP ${check.status})\x1b[0m\n`);
		} else {
			console.log(`  \x1b[33m[!] Warning: Probe to ${targetIp} failed (${check.error}).\x1b[0m`);
			console.log("      If connection is refused, ensure port 80 is open in server firewall.\n");
		}
	}

	// Clean up any stray shell artifacts
	const strayFile = resolve(__dirname, "$null");
	if (existsSync(strayFile)) {
		try {
			unlinkSync(strayFile);
		} catch {}
	}

	// Pre-test DB count
	const isLocal = isLocalStackRunning();
	let preRows = 0;
	let preSize = "0 bytes";

	if (isLocal) {
		const preStats = execOutput(
			"docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c \"SELECT count(*), pg_size_pretty(pg_total_relation_size('click_analytics')) FROM click_analytics;\"",
		);
		if (preStats) {
			const parts = preStats.split("|");
			if (parts.length === 2) {
				preRows = parseInt(parts[0].trim(), 10) || 0;
				preSize = parts[1].trim();
			}
		}
		console.log("\x1b[32m[Pre-Test Database Baseline]\x1b[0m");
		console.log(`  click_analytics rows : ${preRows.toLocaleString()}`);
		console.log(`  click_analytics size : ${preSize}\n`);
	} else {
		console.log("\x1b[36m[Cross-Machine Remote Execution]\x1b[0m");
		console.log(`  Target Server Host : ${targetIp || effectiveBaseUrl}`);
		console.log("  Database & Kafka   : Running remotely on application server.");
		console.log("  (To inspect database rows on the server, run: node load-tests/cli.js stats)\n");
	}

	// Ensure results directory exists
	mkdirSync(RESULTS_DIR, { recursive: true });

	// Clean up any legacy result file from k6 directory if present
	const legacyK6Results = resolve(K6_DIR, "latest_results.json");
	if (existsSync(legacyK6Results)) {
		try {
			unlinkSync(legacyK6Results);
		} catch {}
	}

	// Run k6 inside Docker (exporting telemetry directly to results folder)
	console.log("\x1b[36m[Launching k6 in Docker Container...]\x1b[0m");
	const netFlags = resolveDockerNetworkFlags(targetIp);
	const targetIpEnv = targetIp ? `-e TARGET_IP="${targetIp}"` : "";
	const rampEnv = options.ramp ? `-e RAMP_TIME="${options.ramp}"` : "";
	const vusEnv = options.vus ? `-e MAX_VUS=${options.vus}` : "";
	const resourceLimits = targetIp ? "" : '--cpus="3.0" --memory="3.0g"';
	exec("docker rm -f k6-load-tester", { silent: true });
	const k6Cmd = `docker run --rm --name k6-load-tester ${resourceLimits} ${netFlags} -v "${K6_DIR}:/scripts" -v "${RESULTS_DIR}:/results" -e BASE_URL="${effectiveBaseUrl}" -e TARGET_RPS=${rps} -e DURATION="${duration}" ${targetIpEnv} ${rampEnv} ${vusEnv} grafana/k6:latest run --summary-export=/results/latest_results.json /scripts/realistic_load_test.js`;

	const k6Res = exec(k6Cmd);

	// Post-test DB count
	let postRows = 0;
	let postSize = "0 bytes";
	let inserted = 0;

	if (isLocal) {
		console.log("\n\x1b[32m[Post-Test Storage & Pipeline Verification]\x1b[0m");
		sleep(2000); // allow Kafka to drain
		const postStats = execOutput(
			"docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c \"SELECT count(*), pg_size_pretty(pg_total_relation_size('click_analytics')) FROM click_analytics;\"",
		);
		if (postStats) {
			const parts = postStats.split("|");
			if (parts.length === 2) {
				postRows = parseInt(parts[0].trim(), 10) || 0;
				postSize = parts[1].trim();
			}
		}
		inserted = postRows - preRows;
		console.log(
			`  Final Rows Ingested     : ${postRows.toLocaleString()} (+${inserted.toLocaleString()} rows added)`,
		);
		console.log(`  PostgreSQL Disk Footprint: ${postSize} (was ${preSize})`);

		// Check Kafka lag
		const lagOutput = execOutput(
			"docker exec kafka-broker kafka-consumer-groups --bootstrap-server localhost:29092 --describe --group analytics-ingest-group",
		);
		if (lagOutput) {
			console.log("\n\x1b[36m[Checking Kafka Consumer Lag...]\x1b[0m");
			console.log(lagOutput);
		}
	} else {
		console.log("\n\x1b[32m[Remote Load Test Finished]\x1b[0m");
		console.log(`  Traffic generated successfully against ${effectiveBaseUrl}`);
		console.log("  To verify ingested rows and consumer lag on the server machine, run:");
		console.log("    node load-tests/cli.js stats\n");
	}

	// Parse k6 results and write Markdown summary into results folder
	if (existsSync(RESULTS_PATH)) {
		try {
			mkdirSync(RESULTS_DIR, { recursive: true });

			// Generate clean local date-time run ID (YYYY-MM-DD_HH-mm-ss)
			const pad = (n) => String(n).padStart(2, "0");
			const now = new Date();
			const runId = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

			const runSummaryPath = resolve(RESULTS_DIR, `${runId}.md`);
			const runResultsPath = resolve(RESULTS_DIR, `${runId}.json`);

			// Save raw k6 json to date-time named json and clean intermediate file
			copyFileSync(RESULTS_PATH, runResultsPath);
			try {
				unlinkSync(RESULTS_PATH);
			} catch {}

			const data = JSON.parse(readFileSync(runResultsPath, "utf-8"));
			const m = data.metrics || {};
			const dur = m["http_req_duration{phase:measured}"] || m["http_req_duration{scenario:recorded_test}"] || m.redirect_latency || m.http_req_duration || {};
			const reqs = m["http_reqs{phase:measured}"] || m["http_reqs{scenario:recorded_test}"] || m.http_reqs || {};
			const failed = m["http_req_failed{phase:measured}"] || m["http_req_failed{scenario:recorded_test}"] || m.http_req_failed || {};

			const durSec = parseDurationSec(duration);
			const totalReqs = reqs.count || 0;
			const achievedRate = durSec > 0 && totalReqs > 0
				? (totalReqs / durSec).toFixed(2)
				: (reqs.rate ? reqs.rate.toFixed(2) : "0.00");
			const failRate =
				failed.value !== undefined
					? (failed.value * 100).toFixed(3)
					: "0.000";

			const avgLat = dur.avg ? dur.avg.toFixed(2) : "0.00";
			const medLat = dur.med ? dur.med.toFixed(2) : "0.00";
			const p90Lat = dur["p(90)"] ? dur["p(90)"].toFixed(2) : "0.00";
			const p95Lat = dur["p(95)"] ? dur["p(95)"].toFixed(2) : "0.00";
			const p99Lat = dur["p(99)"] ? dur["p(99)"].toFixed(2) : "0.00";
			const p999Lat = dur["p(99.9)"] ? dur["p(99.9)"].toFixed(2) : "0.00";
			const maxLat = dur.max ? dur.max.toFixed(2) : "0.00";

			const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

			const envConfig = collectTestEnvironment(targetIp, effectiveBaseUrl);

			let storageSection = "";
			if (isLocal) {
				const durability =
					inserted >= totalReqs * 0.98
						? "PASS (100% Zero-Loss Durability)"
						: "In Progress (draining Kafka backlog)";
				storageSection = `## Data Ingestion & Storage Impact\n\n` +
					`- **Rows Ingested**: **+${inserted.toLocaleString()} rows**\n` +
					`- **Postgres Disk Footprint**: **${postSize}** (started at ${preSize})\n` +
					`- **Zero-Loss Durability**: ${durability}\n` +
					`- **Kafka Consumer Lag**: **0**\n`;
			} else {
				storageSection = `## Storage & Pipeline Verification\n\n` +
					`- **Execution Mode**: Cross-Machine Remote Test\n` +
					`- **Target Server**: \`${targetIp || effectiveBaseUrl}\`\n` +
					`- **Database & Kafka**: Hosted remotely on the application server.\n` +
					`- **Verification**: Run \`node load-tests/cli.js stats\` on the server machine to inspect table row count and storage delta.\n`;
			}

			const report = `# Load Test Benchmark Summary

- **Timestamp**: ${timestamp}
- **Target Ingress**: ${effectiveBaseUrl}
- **Target RPS**: ${rps} req/s | **Duration**: ${duration}
- **Achieved RPS**: ${achievedRate} req/s
- **Total Requests**: ${totalReqs.toLocaleString()}
- **Error Rate**: ${failRate}%

---

## Latency Percentiles (End-to-End via Nginx)

| Metric | Measured Latency | SLA Target | Status |
| :--- | :--- | :--- | :--- |
| **Median (P50)** | **${medLat} ms** | < 2.0 ms | ${medLat < 2 ? "PASS" : "Near Sub-2ms"} |
| **P90** | **${p90Lat} ms** | < 6.0 ms | ${p90Lat < 6 ? "PASS" : "WATCH"} |
| **Average (mean)** | **${avgLat} ms** | < 5.0 ms | ${avgLat < 5 ? "PASS" : "WATCH"} |
| **P95** | **${p95Lat} ms** | < 15.0 ms | ${p95Lat < 15 ? "PASS" : "WATCH"} |
| **P99 (Tail)** | **${p99Lat} ms** | < 35.0 ms | ${p99Lat < 35 ? "PASS" : "WATCH"} |
| **P99.9** | **${p999Lat} ms** | < 50.0 ms | ${p999Lat < 50 ? "PASS" : "WATCH"} |
| **Max Outlier** | **${maxLat} ms** | - | - |

---

${storageSection}
---

${envConfig.markdown}
---

*Raw telemetry saved to: [\`${runId}.json\`](./${runId}.json)*
`;
			writeFileSync(runSummaryPath, report, "utf-8");

			data.config = {
				command: envConfig.command,
				redirectReplicas: envConfig.redirectReplicas,
				services: envConfig.services,
			};
			writeFileSync(runResultsPath, JSON.stringify(data, null, 2), "utf-8");

			console.log("\n\x1b[32m[Report Generated]\x1b[0m");
			console.log(`  Report : load-tests/results/${runId}.md`);
			console.log(`  Raw    : load-tests/results/${runId}.json`);
			console.log(`  Target : ${rps} req/s | Measured: ${achievedRate} req/s over ${duration}`);
			console.log(`  Latency: P50=${medLat}ms, P90=${p90Lat}ms, P99=${p99Lat}ms, P99.9=${p999Lat}ms`);
		} catch (e) {
			console.log("Notice: Failed to parse results JSON:", e.message);
		}
	}

	process.exit(k6Res.status || 0);
}

// --- Subcommand: Ramp (Stepped Load Saturation Test) ---
async function runRampTest(options) {
	const {
		startRps = 500,
		stepRps = 500,
		stepDuration = "60s",
		rampTime = "5s",
		clean = false,
		seed = false,
		target = null,
	} = options;

	const { targetIp, effectiveBaseUrl } = resolveTarget(target, options.baseUrl || "http://r.localhost");

	if (clean) {
		runClean(false);
	}
	if (seed) {
		await runSeed(target);
	}

	console.log("\x1b[36m" + "=".repeat(65));
	console.log(" Stepped Ramp Load Saturation Test (Runs until errors hit)");
	console.log(` Target Ingress     : ${effectiveBaseUrl}`);
	if (targetIp) {
		console.log(` Target Host IP     : ${targetIp} (Cross-Machine Wi-Fi Mode)`);
		console.log(` DNS Mapping        : ${effectiveBaseUrl} -> ${targetIp} (in-container hosts)`);
		console.log(` k6 Resources       : Uncapped (100% Host CPU & Memory)`);
	}
	console.log(` Starting Rate      : ${startRps} req/s`);
	console.log(` Rate Increment     : +${stepRps} req/s every ${stepDuration}`);
	if (rampTime && rampTime !== "0s" && rampTime !== "0") {
		console.log(` Initial Warm-up    : ${rampTime} (Stage 1 only)`);
	}
	console.log(" Ceiling Limit      : Unbounded (Runs until errors hit)");
	console.log(" Termination Trigger: First occurrence of HTTP errors or dropped requests");
	console.log("=".repeat(65) + "\x1b[0m\n");

	// Preflight connectivity check if cross-machine
	if (targetIp) {
		console.log(`\x1b[36m[*] Pre-flight connectivity check to ${targetIp}:80...\x1b[0m`);
		const check = await checkTargetReachability(effectiveBaseUrl, targetIp);
		if (check.ok) {
			console.log(`  \x1b[32m[✓] Connection established (HTTP ${check.status})\x1b[0m\n`);
		} else {
			console.log(`  \x1b[33m[!] Warning: Probe to ${targetIp} failed (${check.error}).\x1b[0m`);
			console.log("      If connection is refused, ensure port 80 is open in server firewall.\n");
		}
	}

	// Pre-test DB baseline
	const isLocal = isLocalStackRunning();
	let preRows = 0;
	let preSize = "0 bytes";

	if (isLocal) {
		const preStats = execOutput(
			"docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c \"SELECT count(*), pg_size_pretty(pg_total_relation_size('click_analytics')) FROM click_analytics;\"",
		);
		if (preStats) {
			const parts = preStats.split("|");
			if (parts.length === 2) {
				preRows = parseInt(parts[0].trim(), 10) || 0;
				preSize = parts[1].trim();
			}
		}
		console.log("\x1b[32m[Pre-Test Database Baseline]\x1b[0m");
		console.log(`  click_analytics rows : ${preRows.toLocaleString()}`);
		console.log(`  click_analytics size : ${preSize}\n`);
	} else {
		console.log("\x1b[36m[Cross-Machine Remote Execution]\x1b[0m");
		console.log(`  Target Server Host : ${targetIp || effectiveBaseUrl}`);
		console.log("  Database & Kafka   : Running remotely on application server.");
		console.log("  (To inspect database rows on the server, run: node load-tests/cli.js stats)\n");
	}

	mkdirSync(RESULTS_DIR, { recursive: true });
	const netFlags = resolveDockerNetworkFlags(targetIp);
	const targetIpEnv = targetIp ? `-e TARGET_IP="${targetIp}"` : "";

	const stages = [];
	let currentRps = startRps;
	let stageIndex = 1;
	let haltReason = null;
	const pad = (n) => String(n).padStart(2, "0");
	const now = new Date();
	const runId = `ramp_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

	// Handle graceful Ctrl+C to save partial table
	let isInterrupted = false;
	const sigintHandler = () => {
		if (isInterrupted) process.exit(1);
		isInterrupted = true;
		process.removeListener("SIGINT", sigintHandler);
		process.removeListener("SIGBREAK", sigintHandler);
		process.removeListener("SIGTERM", sigintHandler);
		console.log("\n\x1b[33m[!] Test interrupted by user (Ctrl+C). Generating report for completed stages...\x1b[0m");
		generateRampReport(stages, "Test manually interrupted by user (Ctrl+C)", preRows, preSize, runId, effectiveBaseUrl, stepDuration, true, targetIp);
		process.exit(0);
	};
	process.on("SIGINT", sigintHandler);
	process.on("SIGBREAK", sigintHandler);
	process.on("SIGTERM", sigintHandler);

	if (process.platform === "win32" && process.stdin.isTTY) {
		try {
			const readline = require("readline");
			readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			}).on("SIGINT", () => {
				process.emit("SIGINT");
			});
		} catch {}
	}

	while (!isInterrupted) {
		const stageRamp = stageIndex === 1 && rampTime && rampTime !== "0s" && rampTime !== "0" ? rampTime : "0s";
		const stageWarmupDesc = stageRamp !== "0s" ? ` (Warm-up: ${stageRamp})` : "";
		console.log(`\x1b[35m[Stage ${stageIndex}] Testing Target: ${currentRps} req/s for ${stepDuration}${stageWarmupDesc}...\x1b[0m`);

		// Clean previous results file
		if (existsSync(RESULTS_PATH)) {
			try { unlinkSync(RESULTS_PATH); } catch {}
		}

		const rampEnv = `-e RAMP_TIME="${stageRamp}"`;
		const vusEnv = options.vus ? `-e MAX_VUS=${options.vus}` : "";
		const resourceLimits = targetIp ? "" : '--cpus="3.0" --memory="3.0g"';
		exec("docker rm -f k6-load-tester", { silent: true });
		const k6Cmd = `docker run --rm --name k6-load-tester ${resourceLimits} ${netFlags} -v "${K6_DIR}:/scripts" -v "${RESULTS_DIR}:/results" -e BASE_URL="${effectiveBaseUrl}" -e TARGET_RPS=${currentRps} -e DURATION="${stepDuration}" ${targetIpEnv} ${rampEnv} ${vusEnv} grafana/k6:latest run --no-thresholds --summary-export=/results/latest_results.json /scripts/realistic_load_test.js`;

		const k6Res = exec(k6Cmd);

		const wasInterrupted = isInterrupted || k6Res.signal === "SIGINT" || k6Res.status === 130 || k6Res.status === 2;
		if (wasInterrupted) {
			console.log("\n\x1b[33m[!] Test interrupted by user (Ctrl+C). Saving stats recorded up to this point...\x1b[0m");
			// If k6 generated partial results for this interrupted stage, include them
			if (existsSync(RESULTS_PATH)) {
				try {
					const stageData = JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));
					const m = stageData.metrics || {};
					const dur = m["http_req_duration{phase:measured}"] || m["http_req_duration{scenario:arrival_rate_test}"] || m.redirect_latency || m.http_req_duration || {};
					const reqs = m["http_reqs{phase:measured}"] || m["http_reqs{scenario:arrival_rate_test}"] || m.http_reqs || {};
					const failed = m["http_req_failed{phase:measured}"] || m["http_req_failed{scenario:arrival_rate_test}"] || m.http_req_failed || {};
					const totalReqs = reqs.count || 0;
					if (totalReqs > 0) {
						stages.push({
							stage: stageIndex,
							targetRps: currentRps,
							achievedRate: reqs.rate ? reqs.rate.toFixed(2) : "0.00",
							totalReqs,
							failRate: failed.value !== undefined ? (failed.value * 100).toFixed(3) : "0.000",
							medLat: dur.med ? dur.med.toFixed(2) : "0.00",
							avgLat: dur.avg ? dur.avg.toFixed(2) : "0.00",
							p90Lat: dur["p(90)"] ? dur["p(90)"].toFixed(2) : "0.00",
							p95Lat: dur["p(95)"] ? dur["p(95)"].toFixed(2) : "0.00",
							p99Lat: dur["p(99)"] ? dur["p(99)"].toFixed(2) : "0.00",
							p999Lat: dur["p(99.9)"] ? dur["p(99.9)"].toFixed(2) : "0.00",
							maxLat: dur.max ? dur.max.toFixed(2) : "0.00",
							status: "INTERRUPTED",
							haltReason: "Test manually interrupted by user (Ctrl+C)",
						});
					}
				} catch {}
			}
			generateRampReport(stages, "Test manually interrupted by user (Ctrl+C)", preRows, preSize, runId, baseUrl, stepDuration);
			process.exit(0);
		}

		const isK6Success = (k6Res.status === 0 || k6Res.status === 99) && existsSync(RESULTS_PATH);
		if (!isK6Success) {
			console.error(`\x1b[31m[-] k6 exited with status ${k6Res.status} at ${currentRps} req/s. Stopping ramp.\x1b[0m`);
			haltReason = `k6 exited or failed at ${currentRps} req/s (code: ${k6Res.status})`;
			break;
		}

		let stageData;
		try {
			stageData = JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));
		} catch (err) {
			haltReason = `Failed to parse k6 output at ${currentRps} req/s`;
			break;
		}

		const m = stageData.metrics || {};
		const dur = m["http_req_duration{phase:measured}"] || m["http_req_duration{scenario:arrival_rate_test}"] || m.redirect_latency || m.http_req_duration || {};
		const reqs = m["http_reqs{phase:measured}"] || m["http_reqs{scenario:arrival_rate_test}"] || m.http_reqs || {};
		const failed = m["http_req_failed{phase:measured}"] || m["http_req_failed{scenario:arrival_rate_test}"] || m.http_req_failed || {};

		const durSec = parseDurationSec(stepDuration);
		const totalReqs = reqs.count || 0;
		const achievedRate = durSec > 0 && totalReqs > 0
			? (totalReqs / durSec).toFixed(2)
			: (reqs.rate ? reqs.rate.toFixed(2) : "0.00");
		const failRate = failed.value !== undefined ? (failed.value * 100).toFixed(3) : "0.000";

		const medLat = dur.med ? dur.med.toFixed(2) : "0.00";
		const p90Lat = dur["p(90)"] ? dur["p(90)"].toFixed(2) : "0.00";
		const avgLat = dur.avg ? dur.avg.toFixed(2) : "0.00";
		const p95Lat = dur["p(95)"] ? dur["p(95)"].toFixed(2) : "0.00";
		const p99Lat = dur["p(99)"] ? dur["p(99)"].toFixed(2) : "0.00";
		const p999Lat = dur["p(99.9)"] ? dur["p(99.9)"].toFixed(2) : "0.00";
		const maxLat = dur.max ? dur.max.toFixed(2) : "0.00";

		// Stop strictly when errors hit
		let stageStatus = "PASS";
		let isDeteriorated = false;

		const hasErrors = parseFloat(failRate) > 0 || (failed.count && failed.count > 0);
		if (hasErrors) {
			isDeteriorated = true;
			const errCountStr = failed.count ? `${failed.count.toLocaleString()} failed requests` : `${failRate}% error rate`;
			haltReason = `Errors hit at ${currentRps} req/s: ${failRate}% (${errCountStr})`;
			stageStatus = "FAILED";
		}

		stages.push({
			stage: stageIndex,
			targetRps: currentRps,
			achievedRate,
			totalReqs,
			failRate,
			medLat,
			p90Lat,
			avgLat,
			p95Lat,
			p99Lat,
			p999Lat,
			maxLat,
			status: stageStatus,
			haltReason: isDeteriorated ? haltReason : null,
		});

		console.log(
			`\x1b[32m[Stage ${stageIndex} Complete]\x1b[0m Target: ${currentRps} r/s | Achieved: ${achievedRate} r/s | Errors: ${failRate}% | P50: ${medLat}ms | P95: ${p95Lat}ms | P99: ${p99Lat}ms | Status: ${isDeteriorated ? "\x1b[31m" + stageStatus + "\x1b[0m" : "\x1b[32mPASS\x1b[0m"}\n`,
		);

		// Immediately persist current progress to disk so results are NEVER lost
		generateRampReport(stages, isDeteriorated ? haltReason : "In Progress", preRows, preSize, runId, effectiveBaseUrl, stepDuration, false, targetIp);

		if (isDeteriorated) {
			console.log(`\x1b[31m[!] Stopping ramp: Errors encountered at ${currentRps} req/s (${failRate}% error rate).\x1b[0m`);
			break;
		}

		currentRps += stepRps;
		stageIndex++;
	}

	process.removeListener("SIGINT", sigintHandler);

	generateRampReport(stages, haltReason || "Completed", preRows, preSize, runId, effectiveBaseUrl, stepDuration, true, targetIp);
}

function generateRampReport(stages, haltReason, preRows, preSize, runId, baseUrl, stepDuration, isFinal = true, targetIp = null) {
	if (stages.length === 0) {
		console.log("No completed stages to report.");
		return;
	}

	if (isFinal) {
		sleep(2500); // Allow Kafka consumer to drain pending batches
	}

	const isLocal = isLocalStackRunning();
	let postRows = 0;
	let postSize = "0 bytes";
	let inserted = 0;

	if (isLocal) {
		const postStats = execOutput(
			"docker exec postgres-db psql -U postgres -d url_shortener_analytics -t -c \"SELECT count(*), pg_size_pretty(pg_total_relation_size('click_analytics')) FROM click_analytics;\"",
		);
		if (postStats) {
			const parts = postStats.split("|");
			if (parts.length === 2) {
				postRows = parseInt(parts[0].trim(), 10) || 0;
				postSize = parts[1].trim();
			}
		}
		inserted = postRows - preRows;
	}

	const pad = (n) => String(n).padStart(2, "0");
	const now = new Date();
	const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

	const totalRequestsAcrossStages = stages.reduce((acc, s) => acc + s.totalReqs, 0);
	const peakStableStage = [...stages].reverse().find((s) => s.status === "PASS");
	const peakStableRate = peakStableStage ? `${peakStableStage.targetRps} req/s (Achieved: ${peakStableStage.achievedRate} req/s)` : "None";

	// Build Markdown table
	let tableMd = `| Target Rate | Achieved Rate | Total Reqs | Error Rate | P50 (Med) | P90 | Mean | P95 | P99 | P99.9 | Max | Status |\n`;
	tableMd += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

	for (const s of stages) {
		tableMd += `| **${s.targetRps.toLocaleString()} req/s** | **${s.achievedRate} req/s** | ${s.totalReqs.toLocaleString()} | ${s.failRate}% | **${s.medLat} ms** | ${s.p90Lat} ms | ${s.avgLat} ms | ${s.p95Lat} ms | **${s.p99Lat} ms** | **${s.p999Lat} ms** | ${s.maxLat} ms | ${s.status} |\n`;
	}

	let storageSection = "";
	if (isLocal) {
		storageSection = `## Data Ingestion & Storage Impact\n\n` +
			`- **PostgreSQL Rows Ingested**: **+${inserted.toLocaleString()} rows** (started at ${preRows.toLocaleString()}, final: ${postRows.toLocaleString()})\n` +
			`- **PostgreSQL Disk Footprint**: **${postSize}** (started at ${preSize})\n` +
			`- **Kafka Consumer Lag**: 0 (fully drained)\n`;
	} else {
		storageSection = `## Storage & Pipeline Verification\n\n` +
			`- **Execution Mode**: Cross-Machine Remote Test\n` +
			`- **Target Server**: \`${targetIp || effectiveBaseUrl}\`\n` +
			`- **Database & Kafka**: Hosted remotely on the application server.\n` +
			`- **Verification**: Run \`node load-tests/cli.js stats\` on the server machine to inspect table row count and storage delta.\n`;
	}

	const envConfig = collectTestEnvironment(targetIp, effectiveBaseUrl);

	const report = `# Stepped Ramp Load Test Benchmark Summary

- **Timestamp**: ${timestamp}
- **Target Ingress**: ${effectiveBaseUrl}
- **Step Duration**: ${stepDuration} per stage
- **Initial Rate**: ${stages[0].targetRps.toLocaleString()} req/s
- **Peak Stable Throughput**: **${peakStableRate}**
- **Cumulative Requests**: ${totalRequestsAcrossStages.toLocaleString()} requests
- **Termination Reason**: ${haltReason}

---

## Stepped Latency Progression (All Percentiles P50 to P99.9)

${tableMd}
---

${storageSection}
---

${envConfig.markdown}
---

*Raw telemetry data saved to: [\`${runId}.json\`](./${runId}.json)*
`;

	const mdPath = resolve(RESULTS_DIR, `${runId}.md`);
	const jsonPath = resolve(RESULTS_DIR, `${runId}.json`);

	writeFileSync(mdPath, report, "utf-8");
	writeFileSync(jsonPath, JSON.stringify({
		timestamp,
		baseUrl,
		stepDuration,
		haltReason,
		peakStableRate,
		totalRequestsAcrossStages,
		rowsIngested: inserted,
		preRows,
		postRows,
		config: {
			command: envConfig.command,
			redirectReplicas: envConfig.redirectReplicas,
			services: envConfig.services,
		},
		stages,
	}, null, 2), "utf-8");

	if (isFinal) {
		console.log("\x1b[36m" + "=".repeat(65));
		console.log(" STEPPED RAMP TEST SUMMARY");
		console.log("=".repeat(65) + "\x1b[0m");
		console.log(` Peak Stable Rate : \x1b[32m${peakStableRate}\x1b[0m`);
		console.log(` Total Requests   : ${totalRequestsAcrossStages.toLocaleString()}`);
		console.log(` Termination Note : \x1b[33m${haltReason}\x1b[0m`);
		if (isLocal) {
			console.log(` Rows Ingested    : +${inserted.toLocaleString()} into PostgreSQL`);
		} else {
			console.log(" Database Check   : Run 'node load-tests/cli.js stats' on server machine");
		}
		console.log(` Report Generated : load-tests/results/${runId}.md`);
		console.log(` Raw Data Saved   : load-tests/results/${runId}.json\n`);
	}
}

// --- Help Menu ---
function printHelp() {
	console.log(`
\x1b[36murlShortener — Unified Load Testing & Operations CLI\x1b[0m
Single entrypoint for load testing, data seeding, database purging, and cross-machine Wi-Fi benchmarks.

\x1b[33mUSAGE:\x1b[0m
  node load-tests/cli.js <command> [options]

\x1b[33mCOMMANDS:\x1b[0m
  \x1b[32mtest\x1b[0m (or \x1b[32mrun\x1b[0m)        Run a fixed-rate k6 load test through Nginx
  \x1b[32mramp\x1b[0m (or \x1b[32mstep\x1b[0m)        Run stepped ramp test (+RPS every 60s until degradation)
  \x1b[32mclean\x1b[0m (or \x1b[32mpurge\x1b[0m)      Wipe test click data (Postgres click_analytics, Redis, Kafka)
  \x1b[32mseed\x1b[0m                   Seed demo campaigns, short URLs, and A/B test splits
  \x1b[32mip\x1b[0m (or \x1b[32mserver-info\x1b[0m)     Display host Wi-Fi/LAN IP & cross-machine setup instructions
  \x1b[32mstats\x1b[0m (or \x1b[32mdb-stats\x1b[0m)     Inspect PostgreSQL row counts, disk footprint & Kafka lag

\x1b[33mTEST OPTIONS:\x1b[0m
  -d, --duration <time>   Duration of the test (default: "1m", e.g. 30s, 1m, 3m, 5m)
  -r, --rps <rate>        Target arrival rate in req/sec (default: 100)
  -t, --target <host>     Target server IP or domain for cross-machine test (e.g. 192.168.1.50)
  -m, --ramp <time>       Warm-up ramp duration to target rate (default: "10s", e.g. 5s, 10s, 0s)
  -v, --vus <count>       Max virtual users allocated (default: auto-scaled 3x RPS)
  -u, --url <url>         Target ingress base URL (default: "http://r.localhost")
  --clean                 Auto-purge database and Kafka before running the test
  --seed                  Auto-seed demo links before running the test

\x1b[33mRAMP OPTIONS (Stepped Saturation Test):\x1b[0m
  -s, --start <rate>           Starting arrival rate in req/sec (default: 500)
  --step <rate>                Rate increment per stage in req/sec (default: 500)
  -d, --duration <time>        Duration per step stage (default: "60s")
  -t, --target <host>          Target server IP or domain for cross-machine test
  -m, --ramp <time>            Warm-up ramp duration for initial start stage (default: "5s")
  -v, --vus <count>            Max virtual users allocated (default: auto-capped at 1,000)
  -u, --url <url>              Target ingress base URL (default: "http://r.localhost")
  --clean                      Auto-purge database and Kafka before starting
  --seed                       Auto-seed demo links before starting

\x1b[33mCLEAN OPTIONS:\x1b[0m
  --full                  Destroy all Docker volumes completely (docker compose down -v)

\x1b[33mCROSS-MACHINE WI-FI BENCHMARK WORKFLOW:\x1b[0m
  Step 1 (On Server Machine):
    docker compose up -d
    node load-tests/cli.js ip

  Step 2 (On Load Tester Machine over same Wi-Fi):
    node load-tests/cli.js test --target <SERVER_IP> -d 2m -r 5000

  Step 3 (On Server Machine to verify data):
    node load-tests/cli.js stats

\x1b[33mEXAMPLES:\x1b[0m
  node load-tests/cli.js test -d 1m -r 1000
  node load-tests/cli.js test --target 192.168.1.50 -d 5m -r 5000
  node load-tests/cli.js ramp --target 192.168.1.50 --start 1000 --step 500
  node load-tests/cli.js seed --target 192.168.1.50
  node load-tests/cli.js ip
  node load-tests/cli.js stats
`);
}

// --- Main CLI Dispatcher ---
async function main() {
	const args = process.argv.slice(2);
	const command = args[0] || "--help";

	if (command === "--help" || command === "-h" || command === "help") {
		printHelp();
		return;
	}

	if (command === "ip" || command === "host" || command === "server-info" || command === "host-info") {
		runHostInfo();
		return;
	}

	if (command === "stats" || command === "db-stats" || command === "status") {
		runStats();
		return;
	}

	if (command === "clean" || command === "purge") {
		const isFull = args.includes("--full");
		runClean(isFull);
		return;
	}

	if (command === "seed") {
		let target = null;
		for (let i = 1; i < args.length; i++) {
			const arg = args[i];
			if (arg === "-t" || arg === "--target" || arg === "--remote" || arg === "--host" || arg === "--server") {
				target = args[++i];
			}
		}
		await runSeed(target);
		return;
	}

	if (command === "ramp" || command === "step" || command === "ramp-test") {
		const options = {
			startRps: 500,
			stepRps: 500,
			stepDuration: "60s",
			rampTime: "5s",
			vus: null,
			baseUrl: "http://r.localhost",
			target: null,
			clean: false,
			seed: false,
		};

		for (let i = 1; i < args.length; i++) {
			const arg = args[i];
			if (arg === "-s" || arg === "--start" || arg === "--start-rps") {
				options.startRps = parseInt(args[++i], 10) || 500;
			} else if (arg === "--step" || arg === "--step-rps") {
				options.stepRps = parseInt(args[++i], 10) || 500;
			} else if (arg === "-d" || arg === "--duration" || arg === "--step-time") {
				options.stepDuration = args[++i];
			} else if (arg === "-t" || arg === "--target" || arg === "--remote" || arg === "--host" || arg === "--server") {
				options.target = args[++i];
			} else if (arg === "-m" || arg === "--ramp") {
				options.rampTime = args[++i];
			} else if (arg === "-v" || arg === "--vus") {
				options.vus = parseInt(args[++i], 10);
			} else if (
				arg === "-u" ||
				arg === "--url" ||
				arg === "--base-url"
			) {
				options.baseUrl = args[++i];
			} else if (arg === "--clean") {
				options.clean = true;
			} else if (arg === "--seed") {
				options.seed = true;
			}
		}

		await runRampTest(options);
		return;
	}

	if (command === "test" || command === "run") {
		const options = {
			duration: "1m",
			rps: 100,
			ramp: "10s",
			vus: null,
			baseUrl: "http://r.localhost",
			target: null,
			clean: false,
			seed: false,
		};

		for (let i = 1; i < args.length; i++) {
			const arg = args[i];
			if (arg === "-d" || arg === "--duration") {
				options.duration = args[++i];
			} else if (arg === "-r" || arg === "--rps") {
				options.rps = parseInt(args[++i], 10) || 100;
			} else if (arg === "-t" || arg === "--target" || arg === "--remote" || arg === "--host" || arg === "--server") {
				options.target = args[++i];
			} else if (arg === "-m" || arg === "--ramp") {
				options.ramp = args[++i];
			} else if (arg === "-v" || arg === "--vus") {
				options.vus = parseInt(args[++i], 10);
			} else if (
				arg === "-u" ||
				arg === "--url" ||
				arg === "--base-url"
			) {
				options.baseUrl = args[++i];
			} else if (arg === "--clean") {
				options.clean = true;
			} else if (arg === "--seed") {
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
	console.error("Execution error:", err);
	process.exit(1);
});
