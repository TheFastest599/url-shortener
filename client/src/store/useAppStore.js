import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { applyTheme } from "@/lib/theme";

export const useAppStore = create(
	persist(
		(set, get) => ({
			// ==========================================
			// 1. THEME STATE & ACTIONS (Persisted)
			// ==========================================
			theme: "system", // "light" | "dark" | "system"
			setTheme: (theme) => {
				set({ theme });
				applyTheme(theme);
			},

			// ==========================================
			// 2. AUTH STATE & USER PROFILE (In-Memory Access Token)
			// ==========================================
			accessToken: null, // Stored strictly in memory for security
			user: null, // e.g. { id, username, email, role }
			isAuthenticated: false,

			setAccessToken: (accessToken) =>
				set({
					accessToken,
					isAuthenticated: !!accessToken,
				}),

			login: (accessToken, user) =>
				set({
					accessToken,
					user,
					isAuthenticated: true,
				}),

			logout: () =>
				set({
					accessToken: null,
					user: null,
					isAuthenticated: false,
				}),

			updateUser: (updatedFields) =>
				set((state) => ({
					user: state.user ? { ...state.user, ...updatedFields } : null,
				})),
		}),
		{
			name: "url-shortener-storage",
			storage: createJSONStorage(() => localStorage),
			// Only persist theme to localStorage; tokens & session stay in memory
			partialize: (state) => ({ theme: state.theme }),
			onRehydrateStorage: () => (state) => {
				if (state?.theme) {
					applyTheme(state.theme);
				}
			},
		}
	)
);
