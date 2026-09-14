import { Card, CardContent } from "@/components/ui/card";
import { IconLink, IconFolder, IconFlask, IconBolt } from "@tabler/icons-react";

export function DashboardKpiCards({
	totalLinks = 0,
	activeLinks = 0,
	totalCampaigns = 0,
	totalAbTests = 0,
	activeAbTests = 0,
}) {
	const activePercentage = totalLinks > 0 ? Math.round((activeLinks / totalLinks) * 100) : 100;

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

			{/* KPI 2: Campaigns */}
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
							Attribution channels
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
						<IconFolder className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>

			{/* KPI 3: A/B Experiments */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							A/B Experiments
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
							{totalAbTests}
						</div>
						<div className="text-[11px] text-amber-500 font-medium truncate">
							{activeAbTests} traffic splits running
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
						<IconFlask className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>

			{/* KPI 4: Edge Routing Engine */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							Routing Engine
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-500">
							100%
						</div>
						<div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
							High-availability gRPC
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
						<IconBolt className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}


export default DashboardKpiCards;
