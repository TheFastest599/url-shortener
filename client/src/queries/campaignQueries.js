import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
	getUserCampaigns,
	getCampaign,
	getCampaignUrls,
	createCampaign,
	updateCampaign,
	deleteCampaign,
} from "@/api/campaigns";
import { getCampaignAnalytics } from "@/api/analytics";
import { toast } from "sonner";

/**
 * Fetch all campaigns for the current authenticated user with search/pagination
 */
export const useCampaignsQuery = (params = {}, options = {}) => {
	return useQuery({
		queryKey: queryKeys.campaigns.list(params),
		queryFn: () => getUserCampaigns(params),
		staleTime: 1000 * 60 * 2, // 2 minutes
		...options,
	});
};

/**
 * Fetch a single campaign by ID
 */
export const useCampaignQuery = (id, options = {}) => {
	return useQuery({
		queryKey: queryKeys.campaigns.detail(id),
		queryFn: () => getCampaign(id),
		enabled: !!id,
		...options,
	});
};

/**
 * Fetch all URLs belonging to a campaign
 */
export const useCampaignUrlsQuery = (id, options = {}) => {
	return useQuery({
		queryKey: queryKeys.campaigns.urls(id),
		queryFn: () => getCampaignUrls(id),
		enabled: !!id,
		...options,
	});
};

/**
 * Fetch aggregate campaign analytics
 */
export const useCampaignAnalyticsQuery = (
	campaignId,
	{ days = 30, includeBots = false } = {},
	options = {}
) => {
	return useQuery({
		queryKey: queryKeys.campaigns.analytics(campaignId, days, includeBots),
		queryFn: () => getCampaignAnalytics(campaignId, days, includeBots),
		enabled: !!campaignId,
		staleTime: 1000 * 30,
		...options,
	});
};

/**
 * Create a new campaign mutation
 */
export const useCreateCampaignMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCampaign,
		onSuccess: (data, variables, context) => {
			toast.success("Campaign created successfully!");
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to create campaign");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};

/**
 * Update an existing campaign mutation
 */
export const useUpdateCampaignMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }) => updateCampaign(id, payload),
		onSuccess: (data, variables, context) => {
			toast.success("Campaign updated successfully!");
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to update campaign");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};

/**
 * Delete a campaign mutation
 */
export const useDeleteCampaignMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteCampaign,
		onSuccess: (data, variables, context) => {
			toast.success("Campaign deleted");
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to delete campaign");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};
