import { apiHelpers } from "@/config/axios";

export const signup = async (userData) => {
	// Spring Cloud Gateway: POST /api/v1/auth/register
	return apiHelpers.post("/api/v1/auth/register", userData);
};

export const login = async (credentials) => {
	// Spring Cloud Gateway: POST /api/v1/auth/login
	return apiHelpers.post("/api/v1/auth/login", credentials);
};

export const refresh = async (refreshToken) => {
	// Spring Cloud Gateway: POST /api/v1/auth/refresh (reads HttpOnly cookie or body)
	return apiHelpers.post("/api/v1/auth/refresh", refreshToken ? { refreshToken } : {});
};

export const logout = async () => {
	// Spring Cloud Gateway: POST /api/v1/auth/logout (clears HttpOnly cookie)
	return apiHelpers.post("/api/v1/auth/logout");
};

export const getOAuth2LoginUrl = async (provider) => {
	// Spring Cloud Gateway: GET /api/v1/auth/oauth2/{provider}/login
	return apiHelpers.get(`/api/v1/auth/oauth2/${provider}/login`);
};

export default {
	signup,
	login,
	refresh,
	logout,
	getOAuth2LoginUrl,
};
