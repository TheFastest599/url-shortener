import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { applyTheme } from "@/lib/theme";

export const useThemeStore = create(
	persist(
		(set, get) => ({
			theme: "system", // "light" | "dark" | "system"
			setTheme: (theme) => {
				set({ theme });
				applyTheme(theme);
			},
		}),
		{
			name: "url-shortener-themeStore",
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => (state) => {
				if (state?.theme) {
					applyTheme(state.theme);
				}
			},
		}
	)
);
