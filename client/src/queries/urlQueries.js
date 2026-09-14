import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createShortUrl,
	deleteUrl,
	deleteUrlByCode,
	getMyUrls,
	getUrlById,
	getUrlByShortCode,
	updateUrl,
	updateUrlByCode,
} from "@/api/url";
import { queryKeys } from "./queryKeys";

// ==========================================
// 1. QUERY OPTIONS (URLS)
// ==========================================
export const urlQueryOptions = {
	list: (params = {}, { enabled = true } = {}) => {
		const queryParams = {
			page: 0,
			size: 10,
			...params,
		};
		return {
			queryKey: queryKeys.urls.list(queryParams),
			queryFn: async () => {
				const response = await getMyUrls(queryParams);
				return response || [];
			},
			enabled,
			staleTime: 1000 * 60 * 2, // 2 minutes
		};
	},

	detail: (id, { enabled = true } = {}) => ({
		queryKey: queryKeys.urls.detail(id),
		queryFn: async () => getUrlById(id),
		enabled: enabled && !!id,
		staleTime: 1000 * 60 * 5,
	}),

	byCode: (shortCode, { enabled = true } = {}) => ({
		queryKey: queryKeys.urls.byCode(shortCode),
		queryFn: async () => getUrlByShortCode(shortCode),
		enabled: enabled && !!shortCode,
		staleTime: 1000 * 60 * 5,
	}),
};

// ==========================================
// 2. MUTATION OPTIONS (URLS)
// ==========================================
export const urlMutationOptions = {
	create: (queryClient, { onSuccess, onError } = {}) => ({
		mutationFn: (payload) => createShortUrl(payload),
		onSuccess: async (data, variables, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.all,
			});
			onSuccess?.(data, variables, context);
		},
		onError,
	}),

	update: (queryClient, id, { onSuccess, onError } = {}) => ({
		mutationFn: (payload) => updateUrl(id, payload),
		onSuccess: async (data, variables, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.all,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.detail(id),
			});
			onSuccess?.(data, variables, context);
		},
		onError,
	}),

	updateByCode: (queryClient, shortCode, { onSuccess, onError } = {}) => ({
		mutationFn: (payload) => updateUrlByCode(shortCode, payload),
		onSuccess: async (data, variables, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.all,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.byCode(shortCode),
			});
			onSuccess?.(data, variables, context);
		},
		onError,
	}),

	delete: (queryClient, { onSuccess, onError } = {}) => ({
		mutationFn: (id) => deleteUrl(id),
		onSuccess: async (data, id, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.lists(),
			});
			queryClient.removeQueries({
				queryKey: queryKeys.urls.detail(id),
			});
			onSuccess?.(data, id, context);
		},
		onError,
	}),

	deleteByCode: (queryClient, { onSuccess, onError } = {}) => ({
		mutationFn: (shortCode) => deleteUrlByCode(shortCode),
		onSuccess: async (data, shortCode, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.lists(),
			});
			queryClient.removeQueries({
				queryKey: queryKeys.urls.byCode(shortCode),
			});
			onSuccess?.(data, shortCode, context);
		},
		onError,
	}),
};

// ==========================================
// 3. CONVENIENCE REACT QUERY HOOKS
// ==========================================
export function useUrlsQuery(params = {}, options = {}) {
	return useQuery(urlQueryOptions.list(params, options));
}

export function useUrlByCodeQuery(shortCode, options = {}) {
	return useQuery(urlQueryOptions.byCode(shortCode, options));
}

export function useUrlByIdQuery(id, options = {}) {
	return useQuery(urlQueryOptions.detail(id, options));
}

export function useCreateUrlMutation(options = {}) {
	const queryClient = useQueryClient();
	return useMutation(urlMutationOptions.create(queryClient, options));
}

export function useDeleteUrlMutation(options = {}) {
	const queryClient = useQueryClient();
	return useMutation(urlMutationOptions.delete(queryClient, options));
}

export function useDeleteUrlByCodeMutation(options = {}) {
	const queryClient = useQueryClient();
	return useMutation(urlMutationOptions.deleteByCode(queryClient, options));
}

export function useUpdateUrlByCodeMutation(shortCode, options = {}) {
	const queryClient = useQueryClient();
	return useMutation(
		urlMutationOptions.updateByCode(queryClient, shortCode, options),
	);
}

export function useUpdateUrlMutation(options = {}) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload) => updateUrl(payload.id, payload),
		onSuccess: async (data, variables, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.all,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.campaigns.all,
			});
			options.onSuccess?.(data, variables, context);
		},
		onError: options.onError,
	});
}

