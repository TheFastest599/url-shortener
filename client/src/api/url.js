import { apiHelpers } from "@/config/axios";

export const createShortUrl = async (payload) => {
	return apiHelpers.post("/api/v1/urls", payload);
};

export const getMyUrls = async () => {
	return apiHelpers.get("/api/v1/urls/my-urls");
};

export const getUrlByShortCode = async (shortCode) => {
	return apiHelpers.get(`/api/v1/urls/short/${shortCode}`);
};

export const updateUrl = async (id, payload) => {
	return apiHelpers.put(`/api/v1/urls/${id}`, payload);
};

export const deleteUrl = async (id) => {
	return apiHelpers.delete(`/api/v1/urls/${id}`);
};

export const createUtmProfile = async (urlId, utmPayload) => {
	return apiHelpers.post(`/api/v1/urls/${urlId}/utm`, utmPayload);
};

export const getUtmProfiles = async (urlId) => {
	return apiHelpers.get(`/api/v1/urls/${urlId}/utm`);
};

export default {
	createShortUrl,
	getMyUrls,
	getUrlByShortCode,
	updateUrl,
	deleteUrl,
	createUtmProfile,
	getUtmProfiles,
};
