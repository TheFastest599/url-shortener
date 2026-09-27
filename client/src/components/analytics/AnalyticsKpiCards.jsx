import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconChartBar, IconUser, IconRobot, IconUsers } from "@tabler/icons-react";

export function AnalyticsKpiCards({
	totalClicks = 0,
	humanClicks = 0,
	botClicks = 0,
	uniqueVisitors = 0,
	isLoading = false,
}) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{[1, 2, 3, 4].map((n) => (
					<Card key={n} className="p-4 border-border/70 bg-card">
						<Skeleton className="h-4 w-24 mb-2" />
						<Skeleton className="h-8 w-16 mb-1" />
						<Skeleton className="h-3 w-20" />
					</Card>
				))}
			</div>
		);
	}

	const humanPercentage = totalClicks > 0 ? Math.round((humanClicks / totalClicks) * 100) : 100;
	const botPercentage = totalClicks > 0 ? Math.round((botClicks / totalClicks) * 100) : 0;

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			{/* Total Clicks */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							Total Clicks
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
							{totalClicks.toLocaleString()}
						</div>
						<div className="text-[11px] text-muted-foreground truncate">
							Combined redirect volume
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
						<IconChartBar className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>

			{/* Human Clicks */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							Human Traffic
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-chart-1">
							{humanClicks.toLocaleString()}
						</div>
						<div className="text-[11px] text-muted-foreground font-medium truncate">
							{humanPercentage}% verified organic
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1 border border-chart-1/20">
						<IconUser className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>

			{/* Bot Traffic */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							Automated / Bots
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
							{botClicks.toLocaleString()}
						</div>
						<div className="text-[11px] text-chart-3 font-medium truncate">
							{botPercentage}% crawlers & scrapers
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3 border border-chart-3/20">
						<IconRobot className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>

			{/* Unique Visitors */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
					<div className="space-y-1 min-w-0">
						<span className="text-xs font-medium text-muted-foreground">
							Unique Visitors
						</span>
						<div className="text-2xl sm:text-3xl font-bold font-heading text-chart-2">
							{(uniqueVisitors || humanClicks).toLocaleString()}
						</div>
						<div className="text-[11px] text-muted-foreground truncate">
							Distinct network clients
						</div>
					</div>
					<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2 border border-chart-2/20">
						<IconUsers className="size-4.5 sm:size-5" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default AnalyticsKpiCards;
