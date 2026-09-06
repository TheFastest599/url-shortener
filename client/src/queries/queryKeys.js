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
		utm: (urlId) => ["urls", urlId, "utm"],
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
};
