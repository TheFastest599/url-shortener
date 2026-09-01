import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

export const apiClient = axios.create({
	baseURL: "", // Empty baseURL allows relative paths (e.g. '/api/v1/...') to route via Vite proxy / Nginx
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true, // Automatically sends & receives HttpOnly refresh cookies
});

// ==========================================
// 1. REQUEST INTERCEPTOR
// ==========================================
apiClient.interceptors.request.use(
	(config) => {
		const token = useAuthStore.getState().token;
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		config.metadata = { startTime: new Date() };
		return config;
	},
	(error) => Promise.reject(error)
);

// ==========================================
// 2. RESPONSE INTERCEPTOR
// ==========================================
apiClient.interceptors.response.use(
	(response) => {
		const duration = new Date() - response.config.metadata?.startTime;
		if (import.meta.env.DEV) {
			console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} in ${duration}ms`);
		}
		return response;
	},
	async (error) => {
		const { unAuthorisedLogout, refreshToken } = useAuthStore.getState();
		const originalRequest = error.config;

		// Handle 401 Unauthorized with Token Refresh Queue
		if (
			error.response?.status === 401 &&
			!originalRequest?._retry &&
			!originalRequest?.url?.includes("/api/v1/auth/refresh") &&
			!originalRequest?.url?.includes("/api/v1/auth/signin")
		) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return apiClient(originalRequest);
					})
					.catch((err) => Promise.reject(err));
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const newToken = await refreshToken();
				processQueue(null, newToken);
				if (newToken) {
					originalRequest.headers.Authorization = `Bearer ${newToken}`;
					return apiClient(originalRequest);
				}
			} catch (refreshError) {
				processQueue(refreshError, null);
				unAuthorisedLogout("Session expired. Please log in again.");
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		// Handle other standard HTTP error codes (unless skipToast: true is set)
		if (!originalRequest?.skipToast) {
			if (error.response) {
				const { status, data } = error.response;
				switch (status) {
					case 403:
						toast.error(data?.message || "Access forbidden");
						break;
					case 429:
						toast.error("Too many requests — please slow down");
						break;
					case 500:
						toast.error("Internal server error — please try again later");
						break;
					default:
						if (status !== 401) {
							toast.error(data?.message || data?.detail || "An error occurred");
						}
				}
			} else if (error.request) {
				toast.error("Network error — cannot reach server");
			}
		}

		return Promise.reject(error);
	}
);

// Helper methods returning response.data directly
export const apiHelpers = {
	get: async (url, config = {}) => {
		const response = await apiClient.get(url, config);
		return response.data;
	},
	post: async (url, data, config = {}) => {
		const response = await apiClient.post(url, data, config);
		return response.data;
	},
	put: async (url, data, config = {}) => {
		const response = await apiClient.put(url, data, config);
		return response.data;
	},
	patch: async (url, data, config = {}) => {
		const response = await apiClient.patch(url, data, config);
		return response.data;
	},
	delete: async (url, config = {}) => {
		const response = await apiClient.delete(url, config);
		return response.data;
	},
};

export default apiClient;
