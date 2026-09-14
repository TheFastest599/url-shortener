// ==========================================
// CENTRALIZED QUERY KEYS FACTORY
// ==========================================
export const queryKeys = {
	auth: {
		all: ["auth"],
		currentUser: ["auth", "user"],
		oauthUrl: (provider) => ["auth", "oauth-url", provider],
	},
	urls: {
		all: ["urls"],
		lists: () => ["urls", "list"],
		list: (params = {}) => ["urls", "list", params],
		detail: (id) => ["urls", id],
		byCode: (shortCode) => ["urls", "code", shortCode],
		analyticsById: (urlId, days = 30, includeBots = false) => [
			"urls",
			urlId,
			"analytics",
			{ days, includeBots },
		],
	},
	analytics: {
		all: (shortCode) => ["analytics", shortCode],
		overview: (shortCode, days = 30, includeBots = false, interval = null) => [
			"analytics",
			shortCode,
			"overview",
			{ days, includeBots, interval },
		],
		timeSeries: (shortCode, interval = "DAY", days = 30) => [
			"analytics",
			shortCode,
			"timeseries",
			{ interval, days },
		],
		countries: (shortCode, includeBots = false, limit = 10) => [
			"analytics",
			shortCode,
			"countries",
			{ includeBots, limit },
		],
		browsers: (shortCode, includeBots = false, limit = 10) => [
			"analytics",
			shortCode,
			"browsers",
			{ includeBots, limit },
		],
		referrers: (shortCode, includeBots = false, limit = 10) => [
			"analytics",
			shortCode,
			"referrers",
			{ includeBots, limit },
		],
	},
	campaigns: {
		all: ["campaigns"],
		list: (params = {}) => ["campaigns", "list", params],
		detail: (id) => ["campaigns", id],
		urls: (id) => ["campaigns", id, "urls"],
		analytics: (id, days = 30, includeBots = false) => [
			"campaigns",
			id,
			"analytics",
			{ days, includeBots },
		],
	},
	abTesting: {
		all: ["abTesting"],
		list: (params = {}) => ["abTesting", "list", params],
		detail: (id) => ["abTesting", "detail", id],
		byCode: (shortCode) => ["abTesting", "byCode", shortCode],
		analytics: (identifier, days = 30, includeBots = false) => [
			"abTesting",
			identifier,
			"analytics",
			{ days, includeBots },
		],
	},
};
