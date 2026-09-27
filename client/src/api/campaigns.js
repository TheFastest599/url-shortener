import { apiHelpers } from "@/config/axios";

/**
 * Campaigns API client
 */
export const createCampaign = async (payload) => {
	return apiHelpers.post("/api/v1/campaigns", payload);
};

export const getUserCampaigns = async (params = {}) => {
	return apiHelpers.get("/api/v1/campaigns", { params });
};

export const getCampaign = async (id) => {
	return apiHelpers.get(`/api/v1/campaigns/${id}`);
};

export const updateCampaign = async (id, payload) => {
	return apiHelpers.put(`/api/v1/campaigns/${id}`, payload);
};

export const getCampaignUrls = async (id) => {
	return apiHelpers.get(`/api/v1/campaigns/${id}/urls`);
};

export const deleteCampaign = async (id) => {
	return apiHelpers.delete(`/api/v1/campaigns/${id}`);
};

export default {
	createCampaign,
	getUserCampaigns,
	getCampaign,
	updateCampaign,
	getCampaignUrls,
	deleteCampaign,
};
