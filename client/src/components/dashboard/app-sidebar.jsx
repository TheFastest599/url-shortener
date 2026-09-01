import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/routes/paths";
import {
	IconLink,
	IconLayoutDashboard,
	IconChartBar,
	IconAdjustments,
	IconShieldCheck,
	IconLogout,
	IconFileText,
	IconPlus,
	IconServer,
	IconCopy,
	IconCheck,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AppSidebar({
	activeTab,
	onTabChange,
	totalLinksCount = 0,
	onOpenCreateModal,
}) {
	const { user, logout } = useAuthStore();
	const navigate = useNavigate();
	const [copiedId, setCopiedId] = React.useState(false);

	const handleLogout = async () => {
		try {
			await logout();
			toast.success("Logged out successfully");
			navigate(ROUTES.LOGIN);
		} catch {
			toast.error("Logout failed");
		}
	};

	const handleCopyUserId = () => {
		if (user?.id) {
			navigator.clipboard.writeText(user.id);
			setCopiedId(true);
			toast.success("User ID copied to clipboard");
			setTimeout(() => setCopiedId(false), 2000);
		}
	};

	const navigationItems = [
		{
			id: "overview",
			label: "Dashboard Overview",
			icon: IconLayoutDashboard,
			badge: null,
		},
		{
			id: "links",
			label: "Short URLs",
			icon: IconLink,
			badge: totalLinksCount > 0 ? totalLinksCount : null,
		},
		{
			id: "utm",
			label: "Campaigns & UTM",
			icon: IconAdjustments,
			badge: null,
		},
		{
			id: "analytics",
			label: "Telemetry Hub",
			icon: IconChartBar,
			badge: "Live",
		},
	];

	const resourceItems = [
		{
			label: "Profile & Security",
			icon: IconShieldCheck,
			action: () => navigate(ROUTES.PROFILE),
		},
		{
			label: "API Reference",
			icon: IconFileText,
			action: () => {
				window.open(
					"https://github.com/spring-projects/spring-boot",
					"_blank",
				);
			},
		},
	];

	return (
		<Sidebar collapsible="icon" variant="inset">
			{/* 1. Header: Brand Logo & Workspace */}
			<SidebarHeader>
				<div className="flex items-center justify-between px-1 py-1.5">
					<Link
						to={ROUTES.HOME}
						className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-lg"
					>
						<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
							<IconLink className="size-4" />
						</div>
						<div className="flex flex-col group-data-[collapsible=icon]:hidden">
							<span className="font-heading text-sm font-bold tracking-tight text-sidebar-foreground">
								url
								<span className="text-primary font-extrabold">
									Shortener
								</span>
							</span>
							<span className="text-[10px] text-muted-foreground font-mono">
								v1.0 · Enterprise
							</span>
						</div>
					</Link>
				</div>

				{/* Quick Create Link Action in Sidebar */}
				<div className="mt-2 group-data-[collapsible=icon]:hidden">
					<Button
						onClick={onOpenCreateModal}
						size="sm"
						className="w-full gap-2 text-xs font-medium cursor-pointer shadow-xs"
					>
						<IconPlus className="size-3.5" />
						<span>Create Short URL</span>
					</Button>
				</div>
			</SidebarHeader>

			{/* 2. Main Navigation Content */}
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Workspace</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navigationItems.map((item) => {
								const Icon = item.icon;
								const isActive = activeTab === item.id;
								return (
									<SidebarMenuItem key={item.id}>
										<SidebarMenuButton
											isActive={isActive}
											onClick={() => onTabChange(item.id)}
											tooltip={item.label}
										>
											<Icon className="size-4" />
											<span>{item.label}</span>
											{item.badge && (
												<SidebarMenuBadge>
													{item.badge}
												</SidebarMenuBadge>
											)}
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* System Resources Group */}
				<SidebarGroup>
					<SidebarGroupLabel>Resources</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{resourceItems.map((item) => {
								const Icon = item.icon;
								return (
									<SidebarMenuItem key={item.label}>
										<SidebarMenuButton
											onClick={item.action}
											tooltip={item.label}
										>
											<Icon className="size-4" />
											<span>{item.label}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Cluster Health Badge */}
				<div className="mt-auto p-2 group-data-[collapsible=icon]:hidden">
					<div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 space-y-2">
						<div className="flex items-center justify-between text-xs">
							<span className="font-medium text-sidebar-foreground flex items-center gap-1.5">
								<IconServer className="size-3.5 text-emerald-500" />
								<span>Gateway Cluster</span>
							</span>
							<span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
						</div>
						<div className="text-[11px] text-muted-foreground">
							API Gateway, Redis & Kafka mesh online.
						</div>
					</div>
				</div>
			</SidebarContent>

			{/* 3. Footer: User Session Card */}
			<SidebarFooter>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
						<div className="flex items-center gap-2.5 overflow-hidden">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-heading font-semibold text-xs border border-primary/20">
								{user?.username?.charAt(0)?.toUpperCase() ||
									"U"}
							</div>
							<div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
								<span className="text-xs font-medium text-sidebar-foreground truncate">
									{user?.username || "Developer"}
								</span>
								<span className="text-[10px] text-muted-foreground truncate">
									{user?.email || "developer@example.com"}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
							<ThemeToggle size="icon-sm" />
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={handleLogout}
								className="size-7 text-muted-foreground hover:text-destructive cursor-pointer rounded-lg"
								title="Logout"
							>
								<IconLogout className="size-3.5" />
							</Button>
						</div>
					</div>

					{/* Role & Copy ID pill */}
					<div className="flex items-center justify-between text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden pt-1 border-t border-sidebar-border/40">
						<Badge
							variant="secondary"
							className="text-[9px] px-1.5 py-0 uppercase font-mono font-semibold"
						>
							{user?.role || "USER"}
						</Badge>

						<button
							onClick={handleCopyUserId}
							className="inline-flex items-center gap-1 text-[10px] hover:text-foreground transition-colors cursor-pointer"
							title="Copy User ID"
						>
							{copiedId ? (
								<IconCheck className="size-3 text-emerald-500" />
							) : (
								<IconCopy className="size-3" />
							)}
							<span>ID</span>
						</button>
					</div>
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
