import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useThemeStore } from "@/store/themeStore";
import { applyTheme, initThemeListener } from "@/lib/theme";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export function RootLayout() {
	const theme = useThemeStore((state) => state.theme);

	useEffect(() => {
		// Initialize and apply theme on mount
		applyTheme(theme || "system");

		// Listen for OS dark/light mode switches in real-time
		const cleanup = initThemeListener(() => {
			if (useThemeStore.getState().theme === "system") {
				applyTheme("system");
			}
		});

		return cleanup;
	}, [theme]);

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
			<Navbar />
			<main className="flex-1">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}

export default RootLayout;
