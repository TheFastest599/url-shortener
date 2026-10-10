import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom Telemetry Metrics
const redirectSuccessRate = new Rate('redirect_success');
const redirectLatency = new Trend('redirect_latency', true);
const stickyCookieHits = new Counter('sticky_cookie_hits');
const botHits = new Counter('bot_hits');
const mobileHits = new Counter('mobile_hits');
const tabletHits = new Counter('tablet_hits');
const desktopHits = new Counter('desktop_hits');

// ============================================================================
// 1. DIVERSE USER AGENT POOL (Desktop, Mobile, Tablet, SmartTV, Bots)
// ============================================================================
const USER_AGENTS = [
  // --- Mobile: iOS (iPhones) ---
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0.6613.92 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.7.8 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/128.0.2739.42 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/125.0 Mobile/15E148 Safari/604.1',

  // --- Mobile: Android (Samsung, Pixel, OnePlus, Xiaomi) ---
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.6167.101 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.103 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; CPH2581) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; 23117PN0CG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36',
  'Mozilla/5.0 (Android 14; Mobile; rv:129.0) Gecko/129.0 Firefox/129.0',
  'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Opera/82.0.4295.80800 Mobile Safari/537.36',

  // --- Tablets: iPad & Android Tablets ---
  'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/127.0.6533.77 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-X906B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Safari/537.36',

  // --- Desktop: Windows 11 (23H2 / 24H2) (Chrome, Edge, Firefox, Opera One) ---
  // Note: Per Microsoft/W3C spec, all browsers on Windows 11 keep 'Windows NT 10.0' in the User-Agent
  // string for legacy web compatibility, while Sec-CH-UA-Platform-Version indicates Windows 11 (>= 13.0.0).
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.71 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.2849.46',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',

  // --- Desktop: macOS Sonoma & Sequoia (Safari, Chrome, Firefox, Arc) ---
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:129.0) Gecko/20100101 Firefox/129.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.2739.42',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',

  // --- Desktop: Linux (Ubuntu, Fedora, Arch) ---
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',

  // --- Crawlers, Preview Bots & Tools ---
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Twitterbot/1.0',
  'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'WhatsApp/2.24.16.76 A',
  'TelegramBot (like TwitterBot)',
  'curl/8.4.0',
  'python-requests/2.31.0'
];

// ============================================================================
// 2. DYNAMIC GLOBAL IP GENERATOR (Worldwide GeoIP Subnets)
// ============================================================================
// Real-world public subnets across 12 countries for authentic GeoIP resolution
const GLOBAL_SUBNETS = [
  // United States (US) - 30% weight
  { country: 'US', subnets: ['8.8.8.', '104.244.42.', '199.16.156.', '140.82.112.', '64.233.160.', '172.217.16.', '151.101.1.', '198.41.214.'], weight: 30 },
  // India (IN) - 25% weight
  { country: 'IN', subnets: ['103.21.244.', '49.36.0.', '106.51.0.', '157.34.0.', '122.160.0.', '117.200.10.', '182.72.15.'], weight: 25 },
  // United Kingdom (GB) - 10% weight
  { country: 'GB', subnets: ['212.58.244.', '81.2.69.', '151.236.0.', '86.1.0.', '148.252.128.'], weight: 10 },
  // Germany (DE) - 8% weight
  { country: 'DE', subnets: ['82.165.197.', '149.154.167.', '188.40.0.', '91.64.0.', '178.63.0.'], weight: 8 },
  // Japan (JP) - 6% weight
  { country: 'JP', subnets: ['133.242.0.', '202.214.0.', '150.95.0.', '210.140.0.'], weight: 6 },
  // France (FR) - 5% weight
  { country: 'FR', subnets: ['195.154.0.', '51.15.0.', '176.31.0.', '92.222.0.'], weight: 5 },
  // Brazil (BR) - 4% weight
  { country: 'BR', subnets: ['177.136.252.', '200.147.0.', '189.1.0.', '177.18.0.'], weight: 4 },
  // Canada (CA) - 3% weight
  { country: 'CA', subnets: ['198.51.100.', '142.250.0.', '24.222.0.', '192.206.151.'], weight: 3 },
  // Australia (AU) - 3% weight
  { country: 'AU', subnets: ['139.130.4.', '1.1.1.', '101.160.0.', '203.2.2.'], weight: 3 },
  // Singapore (SG) - 3% weight
  { country: 'SG', subnets: ['128.199.0.', '175.41.0.', '103.252.0.', '118.189.0.'], weight: 3 },
  // Netherlands (NL) - 2% weight
  { country: 'NL', subnets: ['185.220.101.', '145.220.0.', '84.116.0.'], weight: 2 },
  // South Korea (KR) - 1% weight
  { country: 'KR', subnets: ['211.234.0.', '110.45.0.', '121.134.0.'], weight: 1 }
];

// Pre-computed cumulative weights for fast O(1) sampling during load test
const TOTAL_WEIGHT = GLOBAL_SUBNETS.reduce((acc, g) => acc + g.weight, 0);

// Pre-seeded pool of 100 fixed "repeat visitor" IPs (20% of traffic)
const REPEAT_VISITOR_IPS = Array.from({ length: 100 }, (_, i) => {
  const group = GLOBAL_SUBNETS[i % GLOBAL_SUBNETS.length];
  const subnet = group.subnets[i % group.subnets.length];
  return `${subnet}${(i * 2 + 10) % 250 + 1}`;
});

function getRealisticClientIp() {
  // 20% of hits come from repeat visitors / office routers
  if (Math.random() < 0.20) {
    return REPEAT_VISITOR_IPS[Math.floor(Math.random() * REPEAT_VISITOR_IPS.length)];
  }

  // 80% dynamic global IP generation
  let r = Math.random() * TOTAL_WEIGHT;
  let selected = GLOBAL_SUBNETS[0];
  for (const group of GLOBAL_SUBNETS) {
    if (r < group.weight) {
      selected = group;
      break;
    }
    r -= group.weight;
  }

  const subnet = selected.subnets[Math.floor(Math.random() * selected.subnets.length)];
  const host = Math.floor(Math.random() * 253) + 1; // 1 to 254
  return `${subnet}${host}`;
}

// ============================================================================
// 3. REFERRERS & MARKETING SOURCES
// ============================================================================
const REFERRERS = [
  // Social Media
  'https://t.co/',
  'https://www.linkedin.com/',
  'https://news.ycombinator.com/',
  'https://www.reddit.com/r/programming/',
  'https://www.reddit.com/r/technology/',
  'https://www.youtube.com/',
  'https://l.instagram.com/',
  'https://l.facebook.com/',
  'https://threads.net/',
  'https://bsky.app/',
  // Search Engines
  'https://www.google.com/',
  'https://www.bing.com/',
  'https://duckduckgo.com/',
  // Developer & Content Sites
  'https://github.com/',
  'https://stackoverflow.com/',
  'https://medium.com/',
  'https://dev.to/',
  // Direct / Email / None
  '',
  'https://mail.google.com/',
  'https://outlook.live.com/'
];

// ============================================================================
// 4. SEEDED TARGET SHORT LINKS & MARKETING CAMPAIGNS CATALOG
// ============================================================================
// Full catalog of all 8 seeded links created via `load-tests/cli.js seed`:
// - Black Friday Flash Sale: launch-deal (A/B Test), promo-2026
// - Global Launch 2026: youtube (A/B Test), careless-whisper
// - Developer Community Outreach: github-repo, spring-docs, hacker-news, tech-blog
const TARGET_LINKS = [
  // Campaign 1: Black Friday Flash Sale
  {
    code: 'launch-deal',
    campaign: 'black-friday-flash-sale',
    isAbTest: true,
    weight: 22, // 22% traffic (tests 3 A/B variants: A=25%, B=25%, C=50%)
  },
  {
    code: 'promo-2026',
    campaign: 'black-friday-flash-sale',
    isAbTest: false,
    weight: 12,
  },

  // Campaign 2: Global Launch 2026
  {
    code: 'youtube',
    campaign: 'global-launch-2026',
    isAbTest: true,
    weight: 20, // 20% traffic (tests 2 A/B variants: A=50%, B=50%)
  },
  {
    code: 'careless-whisper',
    campaign: 'global-launch-2026',
    isAbTest: false,
    weight: 10,
  },

  // Campaign 3: Developer Community Outreach
  {
    code: 'github-repo',
    campaign: 'developer-community-outreach',
    isAbTest: false,
    weight: 11,
  },
  {
    code: 'spring-docs',
    campaign: 'developer-community-outreach',
    isAbTest: false,
    weight: 9,
  },
  {
    code: 'hacker-news',
    campaign: 'developer-community-outreach',
    isAbTest: false,
    weight: 8,
  },
  {
    code: 'tech-blog',
    campaign: 'developer-community-outreach',
    isAbTest: false,
    weight: 8,
  },
];

const TOTAL_LINK_WEIGHT = TARGET_LINKS.reduce((acc, l) => acc + l.weight, 0);

function pickTargetLink() {
  let r = Math.random() * TOTAL_LINK_WEIGHT;
  for (const item of TARGET_LINKS) {
    if (r < item.weight) {
      return item;
    }
    r -= item.weight;
  }
  return TARGET_LINKS[0];
}

// Marketing UTM sources and mediums
const UTM_SOURCES = [
  'google', 'twitter', 'linkedin', 'newsletter', 'reddit',
  'youtube', 'facebook', 'hacker-news', 'github', 'product-hunt', 'threads'
];
const UTM_MEDIUMS = ['cpc', 'social', 'referral', 'email', 'organic', 'display', 'affiliate'];
const SUPPLEMENTAL_CAMPAIGNS = [
  'summer-launch', 'developer-advocacy', 'q3-growth',
  'promo-2026', 'black-friday', 'tech-conf', 'open-source-push'
];

// ============================================================================
// 5. DYNAMIC STAGE PROFILE (Configured via __ENV)
// ============================================================================
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '100');
const DURATION = __ENV.DURATION || '60s';
const PRE_VUS = __ENV.PRE_VUS ? parseInt(__ENV.PRE_VUS, 10) : Math.max(20, Math.min(TARGET_RPS, 2000));
const MAX_VUS = __ENV.MAX_VUS ? parseInt(__ENV.MAX_VUS, 10) : Math.max(100, Math.floor(TARGET_RPS * 3));

export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'max'],
  scenarios: {
    constant_rate_test: {
      executor: 'constant-arrival-rate',
      rate: TARGET_RPS,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: Math.floor(PRE_VUS),
      maxVUs: Math.floor(MAX_VUS),
      gracefulStop: '3s', // Terminate promptly when duration ends instead of waiting 30s!
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.001'],
    http_req_duration: ['p(95)<15', 'p(99)<35'],
    redirect_success: ['rate>0.999'],
  },
};

export default function () {
  // Balanced weighted selection across all 8 seeded links & campaigns
  const targetLink = pickTargetLink();
  const code = targetLink.code;
  const ip = getRealisticClientIp();
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const ref = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];

  const params = {
    redirects: 0,
    timeout: '5s', // Don't let stalled connections hang for 60 seconds
    headers: {
      'User-Agent': ua,
      'X-Forwarded-For': ip,
      'Connection': 'keep-alive',
    },
  };

  if (ref) {
    params.headers['Referer'] = ref;
  }

  if (ua.includes('Windows')) {
    params.headers['Sec-CH-UA-Platform'] = '"Windows"';
    params.headers['Sec-CH-UA-Platform-Version'] = '"15.0.0"'; // Windows 11 (23H2 / 24H2)
  }

  // --- Native Browser CookieJar Management ---
  // k6 maintains an isolated, automatic CookieJar per Virtual User (VU).
  // Real cookies returned in 'Set-Cookie' by Nginx ('vid') and redirect-service ('ab_*')
  // are automatically captured and sent back on subsequent visits like a real browser.
  const baseUrl = __ENV.BASE_URL || 'http://r.localhost';
  const jar = http.cookieJar();

  // Track if this VU holds an active A/B cookie previously set by the server
  const storedCookies = jar.cookiesForURL(baseUrl);
  if (storedCookies[`ab_${code}`] && storedCookies[`ab_${code}`].length > 0) {
    stickyCookieHits.add(1);
  }

  // Device telemetry counters
  const uaLower = ua.toLowerCase();
  if (uaLower.includes('bot') || uaLower.includes('crawl') || uaLower.includes('curl') || uaLower.includes('spider')) {
    botHits.add(1);
  } else if (uaLower.includes('ipad') || uaLower.includes('tablet')) {
    tabletHits.add(1);
  } else if (uaLower.includes('mobi') || uaLower.includes('iphone') || uaLower.includes('android')) {
    mobileHits.add(1);
  } else {
    desktopHits.add(1);
  }

  // Construct dynamic URL with realistic UTM parameters
  let url = `${baseUrl}/${code}`;

  // 65% of clicks carry marketing UTM tags
  if (Math.random() < 0.65) {
    const src = UTM_SOURCES[Math.floor(Math.random() * UTM_SOURCES.length)];
    const med = UTM_MEDIUMS[Math.floor(Math.random() * UTM_MEDIUMS.length)];
    // 75% use the link's specific campaign slug, 25% use supplemental campaign angles
    const cmp = (Math.random() < 0.75)
      ? targetLink.campaign
      : SUPPLEMENTAL_CAMPAIGNS[Math.floor(Math.random() * SUPPLEMENTAL_CAMPAIGNS.length)];
    url += `?utm_source=${src}&utm_medium=${med}&utm_campaign=${cmp}`;
  }

  const startTime = Date.now();
  const res = http.get(url, params);
  const elapsed = Date.now() - startTime;

  const isSuccess = res.status === 302 && res.headers['Location'] !== undefined;
  redirectSuccessRate.add(isSuccess);
  redirectLatency.add(elapsed);

  check(res, {
    'status is 302': (r) => r.status === 302,
    'has location header': (r) => r.headers['Location'] !== undefined,
  });
}

