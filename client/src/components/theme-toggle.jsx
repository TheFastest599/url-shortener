import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";
import { applyTheme, initThemeListener } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	IconSun,
	IconMoon,
	IconDeviceDesktop,
	IconCheck,
} from "@tabler/icons-react";

export function ThemeToggle({ variant = "outline", size = "icon-sm", className = "" }) {
	const { theme, setTheme } = useThemeStore();
	const [mounted, setMounted] = useState(false);
	const [systemDark, setSystemDark] = useState(() =>
		typeof window !== "undefined"
			? window.matchMedia("(prefers-color-scheme: dark)").matches
			: false
	);

	useEffect(() => {
		setMounted(true);
		// Apply currently stored theme on mount
		applyTheme(theme || "system");

		// Listen for system theme changes
		const cleanup = initThemeListener((effectiveDark) => {
			setSystemDark(effectiveDark === "dark");
			if (theme === "system") {
				applyTheme("system");
			}
		});

		return cleanup;
	}, [theme]);

	if (!mounted) {
		return (
			<Button
				variant={variant}
				size={size}
				aria-label="Toggle theme"
				className={className}
			>
				<IconSun className="size-4 opacity-70" />
			</Button>
		);
	}

	const isDarkActive =
		theme === "dark" || (theme === "system" && systemDark);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant={variant}
						size={size}
						className={`relative cursor-pointer transition-colors ${className}`}
						aria-label={`Current theme: ${theme}. Click to change theme`}
						title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
					>
						{theme === "system" ? (
							<div className="relative flex items-center justify-center">
								<IconDeviceDesktop className="size-4" />
								<span
									className={`absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full ring-1 ring-background ${
										isDarkActive ? "bg-primary" : "bg-amber-400"
									}`}
								/>
							</div>
						) : isDarkActive ? (
							<IconMoon className="size-4 text-primary" />
						) : (
							<IconSun className="size-4 text-amber-500" />
						)}
					</Button>
				}
			/>

			<DropdownMenuContent align="end" className="min-w-[140px] p-1 shadow-lg backdrop-blur-md">
				<DropdownMenuItem
					onClick={() => setTheme("light")}
					className="flex items-center justify-between cursor-pointer text-xs"
				>
					<span className="flex items-center gap-2">
						<IconSun className="size-3.5 text-amber-500" />
						<span>Light</span>
					</span>
					{theme === "light" && <IconCheck className="size-3.5 text-primary" />}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={() => setTheme("dark")}
					className="flex items-center justify-between cursor-pointer text-xs"
				>
					<span className="flex items-center gap-2">
						<IconMoon className="size-3.5 text-primary" />
						<span>Dark</span>
					</span>
					{theme === "dark" && <IconCheck className="size-3.5 text-primary" />}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={() => setTheme("system")}
					className="flex items-center justify-between cursor-pointer text-xs"
				>
					<span className="flex items-center gap-2">
						<IconDeviceDesktop className="size-3.5 opacity-70" />
						<span>System</span>
					</span>
					{theme === "system" && <IconCheck className="size-3.5 text-primary" />}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
