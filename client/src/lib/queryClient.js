import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 2, // 2 minutes: data is fresh, avoids excessive network calls
			gcTime: 1000 * 60 * 10, // 10 minutes: cache retention in memory
			refetchOnWindowFocus: false, // Prevents background re-fetching on tab switch
			retry: (failureCount, error) => {
				// Never retry on 401 Unauthorized, 403 Forbidden, or 404 Not Found
				const status = error?.response?.status || error?.status;
				if (status === 401 || status === 403 || status === 404) {
					return false;
				}
				return failureCount < 2;
			},
		},
		mutations: {
			retry: 0,
		},
	},
});
