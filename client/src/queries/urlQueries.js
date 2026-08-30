import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createShortUrl,
	deleteUrl,
	getMyUrls,
	getUrlByShortCode,
	updateUrl,
	createUtmProfile,
	getUtmProfiles,
} from "@/api/url";
import { queryKeys } from "./queryKeys";

// ==========================================
// 1. QUERY OPTIONS (URLS)
// ==========================================
export const urlQueryOptions = {
	list: ({ enabled = true } = {}) => ({
		queryKey: queryKeys.urls.all,
		queryFn: async () => {
			const response = await getMyUrls();
			return response || [];
		},
		enabled,
		staleTime: 1000 * 60 * 2, // 2 minutes
	}),

	detail: (id, { enabled = true } = {}) => ({
		queryKey: queryKeys.urls.detail(id),
		queryFn: async () => updateUrl(id),
		enabled: enabled && !!id,
		staleTime: 1000 * 60 * 5,
	}),

	byCode: (shortCode, { enabled = true } = {}) => ({
		queryKey: queryKeys.urls.byCode(shortCode),
		queryFn: async () => getUrlByShortCode(shortCode),
		enabled: enabled && !!shortCode,
		staleTime: 1000 * 60 * 5,
	}),

	utmList: (urlId, { enabled = true } = {}) => ({
		queryKey: queryKeys.urls.utm(urlId),
		queryFn: async () => getUtmProfiles(urlId),
		enabled: enabled && !!urlId,
		staleTime: 1000 * 60 * 5,
	}),
};

// ==========================================
// 2. MUTATION OPTIONS (URL & UTM)
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

	delete: (queryClient, { onSuccess, onError } = {}) => ({
		mutationFn: (id) => deleteUrl(id),
		onSuccess: async (data, id, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.all,
			});
			queryClient.removeQueries({
				queryKey: queryKeys.urls.detail(id),
			});
			onSuccess?.(data, id, context);
		},
		onError,
	}),

	createUtm: (queryClient, urlId, { onSuccess, onError } = {}) => ({
		mutationFn: (utmPayload) => createUtmProfile(urlId, utmPayload),
		onSuccess: async (data, variables, context) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.urls.utm(urlId),
			});
			onSuccess?.(data, variables, context);
		},
		onError,
	}),
};

// ==========================================
// 3. CONVENIENCE REACT QUERY HOOKS
// ==========================================
export function useUrlsQuery(options = {}) {
	return useQuery(urlQueryOptions.list(options));
}

export function useUrlByCodeQuery(shortCode, options = {}) {
	return useQuery(urlQueryOptions.byCode(shortCode, options));
}

export function useCreateUrlMutation(options = {}) {
	const queryClient = useQueryClient();
	return useMutation(urlMutationOptions.create(queryClient, options));
}

export function useDeleteUrlMutation(options = {}) {
	const queryClient = useQueryClient();
	return useMutation(urlMutationOptions.delete(queryClient, options));
}
