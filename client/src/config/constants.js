/**
 * Centralized Application Constants & Configuration
 */

export const GATEWAY_BASE_URL =
	import.meta.env.VITE_API_GATEWAY_URL ??
	(import.meta.env.DEV ? "http://localhost:8080" : "");

export const REDIRECT_BASE_URL =
	import.meta.env.VITE_REDIRECT_BASE_URL || "http://r.localhost";

/**
 * Returns the fully qualified short URL for a given short code.
 * Reads directly from VITE_REDIRECT_BASE_URL (e.g., http://r.localhost/{shortCode}).
 */
export const getShortUrl = (shortCode) => {
	if (!shortCode) return "";
	return `${REDIRECT_BASE_URL}/${shortCode}`;
};

/**
 * Returns the short domain display prefix without protocol (e.g. "r.localhost/").
 */
export const getShortDomainPrefix = () => {
	return `${REDIRECT_BASE_URL.replace(/^https?:\/\//, "")}/`;
};

export default {
	GATEWAY_BASE_URL,
	REDIRECT_BASE_URL,
	getShortUrl,
	getShortDomainPrefix,
};
