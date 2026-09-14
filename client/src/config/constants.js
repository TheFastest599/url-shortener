/**
 * Centralized Application Constants & Configuration
 */

export const GATEWAY_BASE_URL =
	import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

/**
 * Returns the fully qualified short URL for a given short code.
 * Routes directly through the API gateway / redirect service.
 */
export const getShortUrl = (shortCode) => {
	if (!shortCode) return "";
	return `${GATEWAY_BASE_URL}/r/${shortCode}`;
};

export default {
	GATEWAY_BASE_URL,
	getShortUrl,
};
