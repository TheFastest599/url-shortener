import { useQuery } from "@tanstack/react-query";
import {
	getOverview,
	getTimeSeries,
	getCountries,
	getBrowsers,
	getReferrers,
} from "@/api/analytics";
import { queryKeys } from "./queryKeys";

// ==========================================
// 1. QUERY OPTIONS (ANALYTICS)
// ==========================================
export const analyticsQueryOptions = {
	overview: (shortCode, { days = 30, includeBots = false, enabled = true } = {}) => ({
		queryKey: queryKeys.analytics.overview(shortCode, days, includeBots),
		queryFn: async () => getOverview(shortCode, days, includeBots),
		enabled: enabled && !!shortCode,
		staleTime: 1000 * 30, // 30 seconds for analytics
		refetchInterval: 1000 * 60, // Auto-poll every 60 seconds when dashboard is open
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
