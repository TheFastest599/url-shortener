import { apiHelpers } from "@/config/axios";

/**
 * A/B Testing API client
 */
export const getAbTest = async (shortCode) => {
	return apiHelpers.get(`/api/v1/urls/${shortCode}/ab-test`);
};

export const configureAbTest = async (shortCode, payload) => {
	return apiHelpers.post(`/api/v1/urls/${shortCode}/ab-test`, payload);
};

export const updateAbTestStatus = async (shortCode, payload) => {
	return apiHelpers.put(`/api/v1/urls/${shortCode}/ab-test/status`, payload);
};

export const deleteAbTest = async (shortCode) => {
	return apiHelpers.delete(`/api/v1/urls/${shortCode}/ab-test`);
};

export default {
	getAbTest,
	configureAbTest,
	updateAbTestStatus,
	deleteAbTest,
};
