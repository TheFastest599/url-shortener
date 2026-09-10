import { apiHelpers } from "@/config/axios";

/**
 * Campaigns API client
 */
export const createCampaign = async (payload) => {
	return apiHelpers.post("/api/v1/campaigns", payload);
};

export const getUserCampaigns = async () => {
	return apiHelpers.get("/api/v1/campaigns");
};

export const getCampaign = async (id) => {
	return apiHelpers.get(`/api/v1/campaigns/${id}`);
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
	getCampaignUrls,
	deleteCampaign,
};
