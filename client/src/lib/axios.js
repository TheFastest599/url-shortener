import axios from "axios";
import { useAppStore } from "@/store/useAppStore";

/**
 * Pre-configured Axios instance for all microservice API calls via Spring Cloud Gateway.
 */
export const apiClient = axios.create({
	baseURL: "", // Empty baseURL allows relative paths (e.g. '/api/v1/...') to route via Vite proxy / Nginx
	timeout: 15000,
	withCredentials: true, // Crucial: Automatically sends/receives refresh token HttpOnly cookies
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// ==========================================
// 1. REQUEST INTERCEPTOR
// ==========================================
apiClient.interceptors.request.use(
	(config) => {
		const { accessToken } = useAppStore.getState();

		// Attach in-memory Access Token if present
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// ==========================================
// 2. RESPONSE INTERCEPTOR
// ==========================================
apiClient.interceptors.response.use(
	(response) => {
		// Return response data directly for cleaner consumption
		return response.data;
	},
	(error) => {
		const status = error.response?.status;
		const errorData = error.response?.data;

		// Extract standard error message from Spring Boot error payload
		const errorMessage =
			errorData?.message ||
			errorData?.error ||
			error.message ||
			"An unexpected network error occurred.";

		if (status === 401) {
			// Token expired or invalid -> trigger clean logout in store
			useAppStore.getState().logout();
		}

		// Enrich error object with structured details
		const formattedError = new Error(errorMessage);
		formattedError.status = status;
		formattedError.data = errorData;
		formattedError.originalError = error;

		return Promise.reject(formattedError);
	}
);

export default apiClient;
