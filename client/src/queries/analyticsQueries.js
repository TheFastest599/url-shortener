import { useQuery } from "@tanstack/react-query";
import {
	getOverview,
	getTimeSeries,
	getCountries,
	getBrowsers,
	getReferrers,
	getCampaignAnalytics,
	getAbTestAnalytics,
	getUrlAnalyticsById,
} from "@/api/analytics";
import { queryKeys } from "./queryKeys";

// ==========================================
// 1. QUERY OPTIONS (ANALYTICS)
// ==========================================
export const analyticsQueryOptions = {
	overview: (shortCode, { days = 30, interval = null, includeBots = false, enabled = true, refetchInterval = false } = {}) => ({
		queryKey: queryKeys.analytics.overview(shortCode, days, includeBots, interval),
		queryFn: async () => getOverview(shortCode, days, includeBots, interval),
		enabled: enabled && !!shortCode,
		staleTime: 1000 * 60 * 2,
		refetchInterval,
	}),

	timeSeries: (shortCode, { interval = "DAY", days = 30, enabled = true } = {}) => ({
		queryKey: queryKeys.analytics.timeSeries(shortCode, interval, days),
		queryFn: async () => getTimeSeries(shortCode, interval, days),
		enabled: enabled && !!shortCode,
		staleTime: 1000 * 30,
	}),

	countries: (shortCode, { includeBots = false, limit = 10, enabled = true } = {}) => ({
		queryKey: queryKeys.analytics.countries(shortCode, includeBots, limit),
		queryFn: async () => getCountries(shortCode, includeBots, limit),
		enabled: enabled && !!shortCode,
		staleTime: 1000 * 60,
	}),

	browsers: (shortCode, { includeBots = false, limit = 10, enabled = true } = {}) => ({
		queryKey: queryKeys.analytics.browsers(shortCode, includeBots, limit),
		queryFn: async () => getBrowsers(shortCode, includeBots, limit),
		enabled: enabled && !!shortCode,
		staleTime: 1000 * 60,
	}),

	referrers: (shortCode, { includeBots = false, limit = 10, enabled = true } = {}) => ({
		queryKey: queryKeys.analytics.referrers(shortCode, includeBots, limit),
		queryFn: async () => getReferrers(shortCode, includeBots, limit),
		enabled: enabled && !!shortCode,
		staleTime: 1000 * 60,
	}),

	campaign: (campaignId, { days = 30, includeBots = false, enabled = true } = {}) => ({
		queryKey: queryKeys.campaigns.analytics(campaignId, days, includeBots),
		queryFn: async () => getCampaignAnalytics(campaignId, days, includeBots),
		enabled: enabled && !!campaignId,
		staleTime: 1000 * 30,
	}),

	abTest: (identifier, { days = 30, includeBots = false, enabled = true } = {}) => ({
		queryKey: queryKeys.abTesting.analytics(identifier, days, includeBots),
		queryFn: async () => getAbTestAnalytics(identifier, days, includeBots),
		enabled: enabled && !!identifier,
		staleTime: 1000 * 30,
	}),

	urlById: (urlId, { days = 30, includeBots = false, enabled = true } = {}) => ({
		queryKey: queryKeys.urls.analyticsById(urlId, days, includeBots),
		queryFn: async () => getUrlAnalyticsById(urlId, days, includeBots),
		enabled: enabled && !!urlId,
		staleTime: 1000 * 30,
	}),
};

// ==========================================
// 2. CONVENIENCE REACT QUERY HOOKS
// ==========================================
export function useAnalyticsOverview(shortCode, options = {}) {
	return useQuery(analyticsQueryOptions.overview(shortCode, options));
}

export function useAnalyticsTimeSeries(shortCode, options = {}) {
	return useQuery(analyticsQueryOptions.timeSeries(shortCode, options));
}

export function useAnalyticsCountries(shortCode, options = {}) {
	return useQuery(analyticsQueryOptions.countries(shortCode, options));
}

export function useAnalyticsBrowsers(shortCode, options = {}) {
	return useQuery(analyticsQueryOptions.browsers(shortCode, options));
}

export function useAnalyticsReferrers(shortCode, options = {}) {
	return useQuery(analyticsQueryOptions.referrers(shortCode, options));
}

export function useCampaignAnalytics(campaignId, options = {}) {
	return useQuery(analyticsQueryOptions.campaign(campaignId, options));
}

export function useAbTestAnalytics(identifier, options = {}) {
	return useQuery(analyticsQueryOptions.abTest(identifier, options));
}

export function useUrlAnalyticsById(urlId, options = {}) {
	return useQuery(analyticsQueryOptions.urlById(urlId, options));
}
