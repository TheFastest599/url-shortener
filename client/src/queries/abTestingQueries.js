import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
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
} from "@/api/abTesting";
import { getAbTestAnalytics } from "@/api/analytics";
import { toast } from "sonner";

/**
 * Fetch all A/B tests with pagination/search/status filtering
 */
export const useAbTestsQuery = (params = {}, options = {}) => {
	return useQuery({
		queryKey: queryKeys.abTesting.list(params),
		queryFn: () => getAbTests(params),
		staleTime: 1000 * 30, // 30 seconds
		...options,
	});
};

/**
 * Fetch a single A/B test by its UUID
 */
export const useAbTestByIdQuery = (id, options = {}) => {
	return useQuery({
		queryKey: queryKeys.abTesting.detail(id),
		queryFn: () => getAbTestById(id),
		enabled: !!id,
		...options,
	});
};

/**
 * Fetch aggregate A/B test analytics by UUID or shortCode
 */
export const useAbTestAnalyticsQuery = (
	identifier,
	{ days = 30, includeBots = false } = {},
	options = {}
) => {
	return useQuery({
		queryKey: queryKeys.abTesting.analytics(identifier, days, includeBots),
		queryFn: () => getAbTestAnalytics(identifier, days, includeBots),
		enabled: !!identifier,
		staleTime: 1000 * 30,
		...options,
	});
};

/**
 * Create a new standalone A/B test
 */
export const useCreateAbTestMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload) => createAbTest(payload),
		onSuccess: (data, variables, context) => {
			toast.success("A/B test created successfully!");
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to create A/B test");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};

/**
 * Update an existing A/B test
 */
export const useUpdateAbTestMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }) => updateAbTest(id, payload),
		onSuccess: (data, variables, context) => {
			toast.success("A/B test updated successfully!");
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to update A/B test");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};

/**
 * Update A/B test status by ID (ACTIVE / PAUSED / CONCLUDED)
 */
export const useUpdateAbTestStatusByIdMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }) => updateAbTestStatus(id, payload),
		onSuccess: (data, variables, context) => {
			const statusMsg = variables.payload.status === "CONCLUDED"
				? `Test concluded! Winner promoted: Variant ${variables.payload.winningVariant}`
				: `A/B test status updated to ${variables.payload.status}`;
			toast.success(statusMsg);
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to update test status");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};

/**
 * Delete A/B test by ID
 */
export const useDeleteAbTestByIdMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id) => deleteAbTestById(id),
		onSuccess: (data, variables, context) => {
			toast.success("A/B test deleted");
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			options.onSuccess?.(data, variables, context);
		},
		onError: (error, variables, context) => {
			toast.error(error?.response?.data?.message || "Failed to delete A/B test");
			options.onError?.(error, variables, context);
		},
		...options,
	});
};

// ============================================================
// Legacy / URL-scoped hooks for backwards compatibility
// ============================================================

export const useAbTestQuery = (shortCode, options = {}) => {
	return useQuery({
		queryKey: queryKeys.abTesting.byCode(shortCode),
		queryFn: () => getAbTest(shortCode),
		enabled: !!shortCode,
		retry: false,
		...options,
	});
};

export const useConfigureAbTestMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ shortCode, payload }) => configureAbTest(shortCode, payload),
		onSuccess: (data, variables, context) => {
			toast.success("A/B test configured successfully!");
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
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

export const useUpdateAbTestStatusMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ shortCode, payload }) => updateAbTestStatusLegacy(shortCode, payload),
		onSuccess: (data, variables, context) => {
			const statusMsg = variables.payload.status === "CONCLUDED"
				? `Test concluded! Winner promoted: Variant ${variables.payload.winningVariant}`
				: `A/B test status updated to ${variables.payload.status}`;
			toast.success(statusMsg);
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
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

export const useDeleteAbTestMutation = (options = {}) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (shortCode) => deleteAbTest(shortCode),
		onSuccess: (data, variables, context) => {
			toast.success("A/B test removed from link");
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
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
