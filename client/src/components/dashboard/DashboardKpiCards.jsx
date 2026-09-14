import { Card, CardContent } from "@/components/ui/card";
import { IconLink, IconChartBar, IconFolder, IconUser } from "@tabler/icons-react";

export function DashboardKpiCards({
	totalLinks = 0,
	activeLinks = 0,
	totalClicks = 0,
	totalCampaigns = 0,
	totalCampaignClicks = 0,
	humanClicks = 0,
}) {
	const activePercentage = totalLinks > 0 ? Math.round((activeLinks / totalLinks) * 100) : 100;
	const humanPercentage = totalClicks > 0 ? Math.round((humanClicks / totalClicks) * 100) : 100;

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
			{/* KPI 1: Shortlinks */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							Shortlink Fleet
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
							{totalLinks}
						</div>
						<div className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
							<span>{activeLinks} active</span>
							<span className="text-muted-foreground">·</span>
							<span>{activePercentage}% live</span>
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
						<IconLink className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>

			{/* KPI 2: Traffic Volume */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							30D Traffic Volume
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
							{totalClicks.toLocaleString()}
						</div>
						<div className="text-[11px] text-blue-500 font-medium truncate">
							Redirect velocity verified
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
						<IconChartBar className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>

			{/* KPI 3: Campaigns */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							Active Campaigns
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
							{totalCampaigns}
						</div>
						<div className="text-[11px] text-purple-500 font-medium truncate">
							{totalCampaignClicks.toLocaleString()} attributed clicks
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
						<IconFolder className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>

			{/* KPI 4: Traffic Integrity */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							Traffic Integrity
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-500">
							{humanClicks.toLocaleString()}
						</div>
						<div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
							{humanPercentage}% verified humans
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
						<IconUser className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default DashboardKpiCards;
