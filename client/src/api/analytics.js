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

/**
 * Enriched analytics endpoints
 */
export const getCampaignAnalytics = async (
	campaignId,
	days = 30,
	includeBots = false,
	timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
) => {
	return apiHelpers.get(`/api/v1/analytics/campaigns/${campaignId}`, {
		params: { days, includeBots, timezone },
	});
};

export const getAbTestAnalytics = async (
	identifier,
	days = 30,
	includeBots = false,
	timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
) => {
	return apiHelpers.get(`/api/v1/analytics/ab-tests/${identifier}`, {
		params: { days, includeBots, timezone },
	});
};

export const getUrlAnalyticsById = async (
	urlId,
	days = 30,
	includeBots = false,
	timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
) => {
	return apiHelpers.get(`/api/v1/analytics/urls/${urlId}`, {
		params: { days, includeBots, timezone },
	});
};

export default {
	getOverview,
	getTimeSeries,
	getCountries,
	getBrowsers,
	getReferrers,
	getCampaignAnalytics,
	getAbTestAnalytics,
	getUrlAnalyticsById,
};
