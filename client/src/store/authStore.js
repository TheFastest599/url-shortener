import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import auth from "@/api/auth";
import { toast } from "sonner";

export const useAuthStore = create(
	persist(
		(set, get) => ({
			// In-memory sensitive state
			user: null, // { id, username, email, role }
			token: null, // Access token kept strictly in memory
			refreshToken: null,
			loading: false,
			error: null,

			// Persisted flag indicator (hydrated via persist middleware)
			isLogged: false,
			logged: false,
			isInitializing: false,

			setToken: (token) => {
				const isAuth = !!token;
				set({ token, logged: isAuth, isLogged: isAuth });
			},

			setUser: (user) => {
				set({ user, logged: !!(user || get().token) });
			},

			setLoading: (loading) => set({ loading }),
			setError: (error) => set({ error }),

			hasRole: (roles) => {
				const user = get().user;
				if (!user) return false;
				if (Array.isArray(roles)) {
					return roles.includes(user.role);
				}
				return user.role === roles;
			},

			// Background initialization / refresh on app mount or browser refresh
			initAuth: async () => {
				const isLogged = get().isLogged;
				if (!isLogged) {
					set({ isInitializing: false, logged: false, isLogged: false });
					return null;
				}

				set({ isInitializing: true });

				try {
					// POST /api/v1/auth/refresh sends the HttpOnly cookie automatically
					const response = await auth.refresh();
					const { accessToken, refreshToken, user } = response || {};

					if (accessToken) {
						set({
							token: accessToken,
							refreshToken: refreshToken || null,
							user: user || null,
							logged: true,
							isLogged: true,
							isInitializing: false,
							error: null,
						});
						return response;
					} else {
						throw new Error("No access token returned");
					}
				} catch {
					// Refresh cookie invalid/expired -> clear state
					set({
						token: null,
						refreshToken: null,
						user: null,
						logged: false,
						isLogged: false,
						isInitializing: false,
					});
					return null;
				}
			},

			// Signup (calls /api/v1/auth/register)
			signup: async (userData) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.signup(userData);
					const { accessToken, refreshToken, user } = response || {};
					set({
						token: accessToken,
						refreshToken: refreshToken || null,
						user: user || null,
						loading: false,
						logged: !!accessToken,
						isLogged: !!accessToken,
						isInitializing: false,
						error: null,
					});
					toast.success("Account created successfully! Welcome to urlShortener.");
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.message ||
						error.response?.data?.error ||
						error.message ||
						"Signup failed";
					set({ loading: false, error: errorMessage });
					throw error;
				}
			},

			// Login (calls /api/v1/auth/login)
			login: async (credentials) => {
				set({ loading: true, error: null });
				try {
					const response = await auth.login(credentials);
					const { accessToken, refreshToken, user } = response || {};
					set({
						token: accessToken,
						refreshToken: refreshToken || null,
						user: user || null,
						loading: false,
						logged: !!accessToken,
						isLogged: !!accessToken,
						isInitializing: false,
						error: null,
					});
					toast.success("Welcome back!");
					return response;
				} catch (error) {
					const errorMessage =
						error.response?.data?.message ||
						error.response?.data?.error ||
						error.message ||
						"Login failed";
					set({ loading: false, error: errorMessage });
					throw error;
				}
			},

			// Refresh Access Token
			refreshAccessToken: async () => {
				try {
					const response = await auth.refresh(get().refreshToken);
					const { accessToken, refreshToken, user } = response || {};
					if (accessToken) {
						set({
							token: accessToken,
							refreshToken: refreshToken || get().refreshToken,
							user: user || get().user,
							logged: true,
							isLogged: true,
						});
						return accessToken;
					}
				} catch (error) {
					set({
						token: null,
						refreshToken: null,
						user: null,
						logged: false,
						isLogged: false,
					});
					throw error;
				}
			},

			refresh: () => get().refreshAccessToken(),

			// Logout
			logout: async () => {
				try {
					await auth.logout();
				} catch {}

				set({
					token: null,
					refreshToken: null,
					user: null,
					logged: false,
					isLogged: false,
					error: null,
				});
				toast.success("Logged out successfully");
			},

			unAuthorisedLogout: (message) => {
				set({
					token: null,
					refreshToken: null,
					user: null,
					logged: false,
					isLogged: false,
					error: null,
				});
				toast.error(message || "Session expired. Please log in again.", {
					id: "session-expired",
				});
			},
		}),
		{
			name: "url-shortener-authStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ isLogged: state.isLogged }),
			onRehydrateStorage: () => (state) => {
				if (state?.isLogged && !state?.token) {
					state.isInitializing = true;
				}
			},
		}
	)
);
