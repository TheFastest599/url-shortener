import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import {
	IconLayoutDashboard,
	IconLink,
	IconAdjustments,
	IconFlask,
	IconChartBar,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

export function SidebarNavContent({
	totalLinksCount = 0,
	onItemClick,
}) {
	const location = useLocation();

	const navigationItems = [
		{
			title: "Dashboard",
			url: ROUTES.DASHBOARD,
			icon: IconLayoutDashboard,
			isActive: location.pathname === ROUTES.DASHBOARD,
		},
		{
			title: "Redirect Links",
			url: ROUTES.REDIRECT_LINKS,
			icon: IconLink,
			isActive:
				location.pathname === ROUTES.REDIRECT_LINKS ||
				location.pathname.startsWith("/redirect-links"),
			badge: totalLinksCount > 0 ? totalLinksCount : null,
		},
		{
			title: "A/B Experiments",
			url: ROUTES.AB_TESTING,
			icon: IconFlask,
			isActive: location.pathname === ROUTES.AB_TESTING,
		},
		{
			title: "Campaigns & UTM",
			url: ROUTES.CAMPAIGNS,
			icon: IconAdjustments,
			isActive: location.pathname === ROUTES.CAMPAIGNS,
		},
		{
			title: "Analytics Hub",
			url: ROUTES.ANALYTICS,
			icon: IconChartBar,
			isActive:
				location.pathname === ROUTES.ANALYTICS ||
				(location.pathname.startsWith("/analytics") && !location.pathname.includes("/r/")),
		},
	];

	return (
		<div className="flex flex-col h-full">
			<div className="space-y-4">
				{/* Workspace Nav Items */}
				<div className="space-y-1">
					<div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
						Workspace
					</div>
					<nav className="space-y-1">
						{navigationItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.title}
									to={item.url}
									onClick={() => onItemClick?.()}
									className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
										item.isActive
											? "bg-primary/10 text-primary font-semibold"
											: "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
									}`}
								>
									<div className="flex items-center gap-2.5 min-w-0">
										<Icon className="size-4 shrink-0" />
										<span className="truncate">{item.title}</span>
									</div>
									{item.badge && (
										<Badge
											variant="secondary"
											className="font-mono text-[10px] px-1.5 py-0 shrink-0 font-semibold"
										>
											{item.badge}
										</Badge>
									)}
								</Link>
							);
						})}
					</nav>
				</div>
			</div>
		</div>
	);
}

export function AppSidebar({ totalLinksCount = 0 }) {
	return (
		<aside className="hidden md:flex w-60 shrink-0 border-r border-border/60 bg-card/40 backdrop-blur-xs flex-col py-4 px-3 sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
			<SidebarNavContent totalLinksCount={totalLinksCount} />
		</aside>
	);
}

export default AppSidebar;
