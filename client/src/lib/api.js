import { useAppStore } from "@/store/useAppStore";

/**
 * Standard API request wrapper that automatically attaches the JWT token
 * from the Zustand store and handles 401 logout seamlessly.
 */
export async function apiRequest(endpoint, options = {}) {
	const token = useAppStore.getState().token;

	const headers = {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...options.headers,
	};

	const response = await fetch(endpoint, {
		...options,
		headers,
	});

	if (response.status === 401) {
		useAppStore.getState().logout();
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		const error = new Error(errorData.message || `Request failed with status ${response.status}`);
		error.status = response.status;
		error.data = errorData;
		throw error;
	}

	return response.json().catch(() => null);
}
