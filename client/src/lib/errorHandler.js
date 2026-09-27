import { toast } from "sonner";

/**
 * Extracts structured error information from TanStack Query / Axios errors.
 */
export function parseApiError(err, fallbackTitle = "Request Failed") {
	if (!err) {
		return {
			title: fallbackTitle,
			description: "An unexpected error occurred.",
			fieldErrors: {},
			status: null,
		};
	}

	const data = err?.response?.data;
	const status = err?.response?.status;

	const title =
		data?.error ||
		(status ? `HTTP ${status}` : err.name || fallbackTitle);

	const description =
		data?.message ||
		err?.message ||
		"The server was unable to process your request.";

	const fieldErrors =
		data && typeof data.errors === "object" && !Array.isArray(data.errors)
			? data.errors
			: {};

	return {
		title,
		description,
		fieldErrors,
		status,
	};
}

/**
 * Displays a Sonner error toast formatted with both title and description.
 */
export function showErrorToast(err, fallbackTitle = "Request Failed") {
	const { title, description } = parseApiError(err, fallbackTitle);
	toast.error(title, {
		description,
	});
}

/**
 * Validates a web destination URL.
 */
export function validateUrl(url) {
	const trimmed = (url || "").trim();
	if (!trimmed) {
		return {
			isValid: false,
			error: "Destination URL is required.",
			formattedUrl: "",
		};
	}

	let formatted = trimmed;
	if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
		formatted = "https://" + formatted;
	}

	try {
		const parsed = new URL(formatted);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return {
				isValid: false,
				error: "URL protocol must be HTTP or HTTPS.",
				formattedUrl: formatted,
			};
		}
		if (
			!parsed.hostname ||
			(!parsed.hostname.includes(".") && parsed.hostname !== "localhost")
		) {
			return {
				isValid: false,
				error: "Please enter a valid domain name (e.g. example.com).",
				formattedUrl: formatted,
			};
		}
		return { isValid: true, error: null, formattedUrl: formatted };
	} catch {
		return {
			isValid: false,
			error: "Invalid URL format. Please check the URL syntax.",
			formattedUrl: formatted,
		};
	}
}

/**
 * Validates custom alias slug.
 */
export function validateCustomAlias(alias) {
	const trimmed = (alias || "").trim();
	if (!trimmed) {
		return { isValid: true, error: null }; // Optional
	}

	if (trimmed.length < 3) {
		return {
			isValid: false,
			error: "Custom alias must be at least 3 characters long.",
		};
	}

	if (trimmed.length > 10) {
		return {
			isValid: false,
			error: "Custom alias must not exceed 10 characters.",
		};
	}

	const validSlugRegex = /^[a-zA-Z0-9_-]+$/;
	if (!validSlugRegex.test(trimmed)) {
		return {
			isValid: false,
			error: "Alias can only contain letters, numbers, hyphens (-), and underscores (_).",
		};
	}

	return { isValid: true, error: null };
}

/**
 * Validates an email address.
 */
export function validateEmail(email) {
	const trimmed = (email || "").trim();
	if (!trimmed) {
		return { isValid: false, error: "Email address is required." };
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(trimmed)) {
		return {
			isValid: false,
			error: "Please enter a valid email address (e.g. user@example.com).",
		};
	}

	return { isValid: true, error: null };
}

/**
 * Validates a password.
 */
export function validatePassword(password, minLength = 6) {
	if (!password || password.length === 0) {
		return { isValid: false, error: "Password is required." };
	}

	if (password.length < minLength) {
		return {
			isValid: false,
			error: `Password must be at least ${minLength} characters long.`,
		};
	}

	return { isValid: true, error: null };
}
