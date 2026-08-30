import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/routes/paths";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatarMenu } from "@/components/auth/user-avatar-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	IconLink,
	IconMenu2,
	IconArrowRight,
	IconLayoutDashboard,
	IconBolt,
	IconChartBar,
	IconServer,
	IconCode,
	IconShieldCheck,
	IconUser,
	IconLogout,
} from "@tabler/icons-react";

export function Navbar() {
	const { logged, isLogged, user, logout } = useAuthStore();
	const [mobileOpen, setMobileOpen] = useState(false);
	const navigate = useNavigate();

	const isAuthenticated = !!(logged || isLogged || user);

	const navLinks = [
		{ label: "Features", href: `${ROUTES.HOME}#features`, icon: IconBolt },
		{ label: "Analytics", href: `${ROUTES.HOME}#analytics`, icon: IconChartBar },
		{ label: "Architecture", href: `${ROUTES.HOME}#architecture`, icon: IconServer },
		{ label: "Performance", href: `${ROUTES.HOME}#performance`, icon: IconShieldCheck },
		{ label: "API Docs", href: `${ROUTES.HOME}#api-docs`, icon: IconCode },
	];

	return (
		<header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Brand Logo & Wordmark */}
				<div className="flex items-center gap-6">
					<Link
						to={ROUTES.HOME}
						className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1"
					>
						<div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
							<IconLink className="size-5" />
						</div>
						<div className="flex flex-col">
							<div className="flex items-center gap-1.5">
								<span className="font-heading text-lg font-bold tracking-tight text-foreground">
									url<span className="text-primary font-extrabold">Shortener</span>
								</span>
								<Badge variant="secondary" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 font-mono">
									v1.0
								</Badge>
							</div>
						</div>
					</Link>

					{/* Desktop Navigation Links */}
					<nav className="hidden md:flex items-center gap-1 lg:gap-2">
						{navLinks.map((link) => (
							<a
								key={link.label}
								href={link.href}
								className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							>
								{link.label}
							</a>
						))}
					</nav>
				</div>

				{/* Desktop Right Cluster: Theme & Auth Avatar/Buttons */}
				<div className="hidden sm:flex items-center gap-3">
					<ThemeToggle />

					{isAuthenticated ? (
						<div className="flex items-center gap-2">
							<Link to={ROUTES.DASHBOARD}>
								<Button
									variant="ghost"
									size="sm"
									className="gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
								>
									<IconLayoutDashboard className="size-4 text-primary" />
									<span>Dashboard</span>
								</Button>
							</Link>

							{/* User Avatar with Profile Dropdown */}
							<UserAvatarMenu />
						</div>
					) : (
						<div className="flex items-center gap-2">
							<Link to={ROUTES.LOGIN}>
								<Button
									variant="ghost"
									size="sm"
									className="cursor-pointer text-muted-foreground hover:text-foreground"
								>
									Sign In
								</Button>
							</Link>
							<Link to={ROUTES.SIGNUP}>
								<Button
									variant="default"
									size="sm"
									className="gap-1.5 shadow-xs cursor-pointer group"
								>
									<span>Get Started</span>
									<IconArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
								</Button>
							</Link>
						</div>
					)}
				</div>

				{/* Mobile Controls: Theme + Avatar/Menu Trigger */}
				<div className="flex items-center gap-2 sm:hidden">
					<ThemeToggle size="icon-sm" />

					{isAuthenticated && <UserAvatarMenu />}

					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger
							render={
								<Button
									variant="outline"
									size="icon-sm"
									aria-label="Open mobile menu"
									className="cursor-pointer"
								>
									<IconMenu2 className="size-5" />
								</Button>
							}
						/>

						<SheetContent side="right" className="w-[300px] sm:w-[360px] p-0 flex flex-col justify-between">
							<div>
								<SheetHeader className="border-b border-border/60 p-5 text-left">
									<div className="flex items-center gap-2.5">
										<div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
											<IconLink className="size-4" />
										</div>
										<SheetTitle className="text-base font-bold font-heading">
											url<span className="text-primary">Shortener</span>
										</SheetTitle>
									</div>
								</SheetHeader>

								{/* Mobile Navigation List */}
								<div className="flex flex-col gap-1 p-4">
									<p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										Navigation
									</p>
									{navLinks.map((link) => {
										const Icon = link.icon;
										return (
											<a
												key={link.label}
												href={link.href}
												onClick={() => setMobileOpen(false)}
												className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
											>
												<Icon className="size-4 text-muted-foreground" />
												<span>{link.label}</span>
											</a>
										);
									})}
								</div>
							</div>

							{/* Mobile Auth & Footer Actions */}
							<div className="border-t border-border/60 p-5 bg-muted/20 flex flex-col gap-2.5">
								{isAuthenticated ? (
									<div className="space-y-2">
										<div className="flex items-center gap-2.5 p-2 rounded-2xl bg-card border border-border/60">
											<div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
												{user?.username ? user.username.slice(0, 2).toUpperCase() : "U"}
											</div>
											<div className="min-w-0">
												<p className="font-semibold text-xs text-foreground truncate">
													{user?.username || "Account"}
												</p>
												<p className="text-[11px] text-muted-foreground truncate">
													{user?.email}
												</p>
											</div>
										</div>

										<Link
											to={ROUTES.DASHBOARD}
											onClick={() => setMobileOpen(false)}
											className="w-full block"
										>
											<Button variant="default" className="w-full gap-2 cursor-pointer">
												<IconLayoutDashboard className="size-4" />
												<span>Open Dashboard</span>
											</Button>
										</Link>

										<Button
											variant="destructive"
											className="w-full gap-2 cursor-pointer"
											onClick={() => {
												setMobileOpen(false);
												logout();
												navigate(ROUTES.HOME);
											}}
										>
											<IconLogout className="size-4" />
											<span>Log Out</span>
										</Button>
									</div>
								) : (
									<>
										<Link
											to={ROUTES.SIGNUP}
											onClick={() => setMobileOpen(false)}
											className="w-full block"
										>
											<Button
												variant="default"
												className="w-full gap-2 justify-center cursor-pointer"
											>
												<span>Get Started Free</span>
												<IconArrowRight className="size-4" />
											</Button>
										</Link>
										<Link
											to={ROUTES.LOGIN}
											onClick={() => setMobileOpen(false)}
											className="w-full block"
										>
											<Button
												variant="outline"
												className="w-full justify-center cursor-pointer"
											>
												Sign In to Account
											</Button>
										</Link>
									</>
								)}

								<div className="pt-2 text-center text-xs text-muted-foreground">
									High-throughput Reactive Redirection Platform
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
