import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
	getAbTest,
	configureAbTest,
	updateAbTestStatus,
	deleteAbTest,
} from "@/api/abTesting";
import { toast } from "sonner";

/**
 * Fetch A/B test configuration for a shortCode
 */
export const useAbTestQuery = (shortCode, options = {}) => {
	return useQuery({
		queryKey: queryKeys.abTesting.byCode(shortCode),
		queryFn: () => getAbTest(shortCode),
		enabled: !!shortCode,
		retry: false, // Don't spam if 404/not configured
		...options,
	});
};

/**
 * Configure / Create A/B test for a shortCode
 */
export const useConfigureAbTestMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ shortCode, payload }) => configureAbTest(shortCode, payload),
		onSuccess: (data, variables, context) => {
			toast.success("A/B test configured successfully!");
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.byCode(variables.shortCode) });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to configure A/B test");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};

/**
 * Update A/B test status (ACTIVE / PAUSED / CONCLUDED)
 */
export const useUpdateAbTestStatusMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ shortCode, payload }) => updateAbTestStatus(shortCode, payload),
		onSuccess: (data, variables, context) => {
			const statusMsg = variables.payload.status === "CONCLUDED"
				? `Test concluded! Winner promoted: Variant ${variables.payload.winningVariant}`
				: `A/B test status updated to ${variables.payload.status}`;
			toast.success(statusMsg);
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.byCode(variables.shortCode) });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to update A/B test status");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};

/**
 * Delete / Remove A/B test from a shortCode
 */
export const useDeleteAbTestMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (shortCode) => deleteAbTest(shortCode),
		onSuccess: (data, variables, context) => {
			toast.success("A/B test removed from link");
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.byCode(variables) });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to remove A/B test");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};
