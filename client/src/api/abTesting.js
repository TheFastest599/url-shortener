import { apiHelpers } from "@/config/axios";

/**
 * A/B Testing API client
 */

// Top-level CRUD endpoints
export const getAbTests = async (params = {}) => {
	return apiHelpers.get("/api/v1/ab-tests", { params });
};

export const getAbTestById = async (id) => {
	return apiHelpers.get(`/api/v1/ab-tests/${id}`);
};

export const createAbTest = async (payload) => {
	return apiHelpers.post("/api/v1/ab-tests", payload);
};

export const updateAbTest = async (id, payload) => {
	return apiHelpers.put(`/api/v1/ab-tests/${id}`, payload);
};

export const updateAbTestStatus = async (id, payload) => {
	return apiHelpers.put(`/api/v1/ab-tests/${id}/status`, payload);
};

export const deleteAbTestById = async (id) => {
	return apiHelpers.delete(`/api/v1/ab-tests/${id}`);
};

// Legacy / URL-scoped endpoints for backward compatibility
export const getAbTest = async (shortCode) => {
	return apiHelpers.get(`/api/v1/urls/${shortCode}/ab-test`);
};

export const configureAbTest = async (shortCode, payload) => {
	return apiHelpers.post(`/api/v1/urls/${shortCode}/ab-test`, payload);
};

export const updateAbTestStatusLegacy = async (shortCode, payload) => {
	return apiHelpers.put(`/api/v1/urls/${shortCode}/ab-test/status`, payload);
};

export const deleteAbTest = async (shortCode) => {
	return apiHelpers.delete(`/api/v1/urls/${shortCode}/ab-test`);
};

export default {
	getAbTests,
	getAbTestById,
	createAbTest,
	updateAbTest,
	updateAbTestStatus,
	deleteAbTestById,
	getAbTest,
	configureAbTest,
	updateAbTestStatusLegacy,
	deleteAbTest,
};
