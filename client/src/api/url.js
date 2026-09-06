import { apiHelpers } from "@/config/axios";

export const createShortUrl = async (payload) => {
	return apiHelpers.post("/api/v1/urls", payload);
};

export const getMyUrls = async (params = {}) => {
	return apiHelpers.get("/api/v1/urls", { params });
};

export const getUrlByShortCode = async (shortCode) => {
	return apiHelpers.get(`/api/v1/urls/code/${shortCode}`);
};

export const getUrlByCode = async (shortCode) => {
	return apiHelpers.get(`/api/v1/urls/code/${shortCode}`);
};

export const updateUrlByCode = async (shortCode, payload) => {
	try {
		return await apiHelpers.put(`/api/v1/urls/code/${shortCode}`, payload);
	} catch (err) {
		if (payload?.id) {
			return await apiHelpers.put(`/api/v1/urls/${payload.id}`, payload);
		}
		throw err;
	}
};

export const updateUrl = async (id, payload) => {
	return apiHelpers.put(`/api/v1/urls/${id}`, payload);
};

export const deleteUrl = async (id) => {
	return apiHelpers.delete(`/api/v1/urls/${id}`);
};

export default {
	createShortUrl,
	getMyUrls,
	getUrlByShortCode,
	updateUrl,
	deleteUrl,
};
