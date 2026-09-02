import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/routes/paths";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatarMenu } from "@/components/auth/user-avatar-menu";
import { Button } from "@/components/ui/button";
import {
	IconLink,
	IconLayoutDashboard,
	IconArrowRight,
} from "@tabler/icons-react";

export function Navbar() {
	const { logged, isLogged, user } = useAuthStore();
	const isAuthenticated = !!(logged || isLogged || user);

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors">
			<div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Brand Logo & Wordmark */}
				<Link
					to={ROUTES.HOME}
					className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
				>
					<div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform duration-200 group-hover:scale-105">
						<IconLink className="size-4.5 sm:size-5" />
					</div>
					<span className="font-heading text-base sm:text-lg font-bold tracking-tight text-foreground">
						url<span className="text-primary font-extrabold">Shortener</span>
					</span>
				</Link>

				{/* Right Cluster: Theme, Dashboard, and Avatar */}
				<div className="flex items-center gap-2 sm:gap-3">
					<ThemeToggle size="icon-sm" />

					{isAuthenticated ? (
						<>
							<Link to={ROUTES.DASHBOARD}>
								<Button
									variant="ghost"
									size="sm"
									className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2.5 sm:px-3"
								>
									<IconLayoutDashboard className="size-4 text-primary" />
									<span className="hidden xs:inline sm:inline">Dashboard</span>
								</Button>
							</Link>

							<UserAvatarMenu />
						</>
					) : (
						<div className="flex items-center gap-1.5 sm:gap-2">
							<Link to={ROUTES.LOGIN}>
								<Button
									variant="ghost"
									size="sm"
									className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2.5 sm:px-3"
								>
									Sign In
								</Button>
							</Link>
							<Link to={ROUTES.SIGNUP}>
								<Button
									variant="default"
									size="sm"
									className="gap-1 text-xs shadow-xs cursor-pointer px-2.5 sm:px-3"
								>
									<span>Get Started</span>
									<IconArrowRight className="size-3 hidden sm:inline" />
								</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

export default Navbar;
