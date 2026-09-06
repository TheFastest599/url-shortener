import { apiHelpers } from "@/config/axios";

export const getOverview = async (
	shortCode,
	days = 30,
	includeBots = false,
	interval = null,
	timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
) => {
	return apiHelpers.get(`/api/v1/analytics/${shortCode}`, {
		params: {
			days,
			includeBots,
			timezone,
			...(interval ? { interval } : {}),
		},
	});
};

export const getTimeSeries = async (
	shortCode,
	interval = "DAY",
	days = 30,
	timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
) => {
	return apiHelpers.get(`/api/v1/analytics/${shortCode}/timeseries`, {
		params: { interval, days, timezone },
	});
};

export const getCountries = async (shortCode, includeBots = false, limit = 10) => {
	return apiHelpers.get(`/api/v1/analytics/${shortCode}/countries`, {
		params: { includeBots, limit },
	});
};

export const getBrowsers = async (shortCode, includeBots = false, limit = 10) => {
	return apiHelpers.get(`/api/v1/analytics/${shortCode}/browsers`, {
		params: { includeBots, limit },
	});
};

export const getReferrers = async (shortCode, includeBots = false, limit = 10) => {
	return apiHelpers.get(`/api/v1/analytics/${shortCode}/referrers`, {
		params: { includeBots, limit },
	});
};

export default {
	getOverview,
	getTimeSeries,
	getCountries,
	getBrowsers,
	getReferrers,
};
