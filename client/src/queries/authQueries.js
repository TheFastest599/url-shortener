import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import auth from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/routes/paths";
import { toast } from "sonner";
import { queryKeys } from "./queryKeys";

// ==========================================
// 1. AUTH MUTATION OPTIONS
// ==========================================
export const authMutationOptions = {
	login: ({ onSuccess, onError } = {}) => ({
		mutationKey: ["auth", "login"],
		mutationFn: (credentials) => auth.login(credentials),
		onSuccess,
		onError,
	}),

	signup: ({ onSuccess, onError } = {}) => ({
		mutationKey: ["auth", "signup"],
		mutationFn: (userData) => auth.signup(userData),
		onSuccess,
		onError,
	}),

	oauthLoginUrl: ({ onSuccess, onError } = {}) => ({
		mutationKey: ["auth", "oauth-login-url"],
		mutationFn: (provider) => auth.getOAuth2LoginUrl(provider),
		onSuccess,
		onError,
	}),
};

// ==========================================
// 2. CONVENIENCE REACT QUERY HOOKS
// ==========================================

/**
 * Hook for executing login with automated in-memory store update, toast, and routing
 */
export function useLoginMutation(options = {}) {
	const { redirectTo = ROUTES.DASHBOARD, onSuccess, onError, ...restOptions } = options;
	const { setToken, setUser } = useAuthStore();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return useMutation({
		...authMutationOptions.login({
			onSuccess: (data, variables, context) => {
				const { accessToken, user } = data || {};
				if (accessToken) setToken(accessToken);
				if (user) setUser(user);

				queryClient.setQueryData(queryKeys.auth.currentUser, user);
				toast.success("Welcome back!");

				if (redirectTo) {
					navigate(redirectTo, { replace: true });
				}

				onSuccess?.(data, variables, context);
			},
			onError: (err, variables, context) => {
				const message =
					err?.response?.data?.message ||
					err?.response?.data?.error ||
					err?.message ||
					"Login failed";
				toast.error(message);
				onError?.(err, variables, context);
			},
		}),
		...restOptions,
	});
}

/**
 * Hook for executing registration with automated in-memory store update, toast, and routing
 */
export function useSignupMutation(options = {}) {
	const { redirectTo = ROUTES.DASHBOARD, onSuccess, onError, ...restOptions } = options;
	const { setToken, setUser } = useAuthStore();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return useMutation({
		...authMutationOptions.signup({
			onSuccess: (data, variables, context) => {
				const { accessToken, user } = data || {};
				if (accessToken) setToken(accessToken);
				if (user) setUser(user);

				queryClient.setQueryData(queryKeys.auth.currentUser, user);
				toast.success("Account created successfully! Welcome to urlShortener.");

				if (redirectTo) {
					navigate(redirectTo, { replace: true });
				}

				onSuccess?.(data, variables, context);
			},
			onError: (err, variables, context) => {
				const message =
					err?.response?.data?.message ||
					err?.response?.data?.error ||
					err?.message ||
					"Registration failed";
				toast.error(message);
				onError?.(err, variables, context);
			},
		}),
		...restOptions,
	});
}

/**
 * Hook for initiating OAuth2 login (Google / GitHub)
 */
export function useOAuthMutation(options = {}) {
	const { onSuccess, onError, ...restOptions } = options;

	return useMutation({
		...authMutationOptions.oauthLoginUrl({
			onSuccess: (data, variables, context) => {
				if (data?.authorizationUrl) {
					window.location.href = data.authorizationUrl;
				} else {
					toast.error("Could not retrieve OAuth authorization URL");
				}
				onSuccess?.(data, variables, context);
			},
			onError: (err, variables, context) => {
				const message =
					err?.response?.data?.message ||
					err?.message ||
					"Failed to initiate OAuth login";
				toast.error(message);
				onError?.(err, variables, context);
			},
		}),
		...restOptions,
	});
}
