/**
 * Theme helper that computes system preference and toggles the .dark class on <html>
 */
export function applyTheme(theme) {
	const root = document.documentElement;
	root.classList.remove("light", "dark");

	let effective = theme;
	if (theme === "system") {
		effective = window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}

	root.classList.add(effective);
	return effective;
}

export function initThemeListener(onSystemChange) {
	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	const handler = (e) => {
		onSystemChange(e.matches ? "dark" : "light");
	};
	mediaQuery.addEventListener("change", handler);
	return () => mediaQuery.removeEventListener("change", handler);
}
