import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
	IconLink,
	IconChartBar,
	IconBolt,
	IconShieldCheck,
	IconArrowUpRight,
	IconRobot,
} from "@tabler/icons-react";

export function QuickStatCards({
	urls = [],
	totalClicks = 0,
	humanClicks = 0,
	botClicks = 0,
}) {
	const activeCount = urls.filter((u) => u.isActive !== false).length;
	const activePercentage =
		urls.length > 0 ? Math.round((activeCount / urls.length) * 100) : 100;
	const humanRatio =
		totalClicks > 0 ? Math.round((humanClicks / totalClicks) * 100) : 100;

	const stats = [
		{
			title: "Total Short URLs",
			value: urls.length,
			subtitle: `${activeCount} active mappings (${activePercentage}%)`,
			icon: IconLink,
			color: "text-primary",
			bg: "bg-primary/10",
			border: "border-primary/20",
		},
		{
			title: "Total Click Events",
			value: totalClicks.toLocaleString(),
			subtitle: `${humanClicks} human (${humanRatio}%) · ${botClicks} bots`,
			icon: IconChartBar,
			color: "text-emerald-500",
			bg: "bg-emerald-500/10",
			border: "border-emerald-500/20",
		},
		{
			title: "Redirection Latency",
			value: "< 15 ms",
			subtitle: "Redis Cache-Aside + WebFlux",
			icon: IconBolt,
			color: "text-amber-500",
			bg: "bg-amber-500/10",
			border: "border-amber-500/20",
		},
		{
			title: "Security & Guard",
			value: "100%",
			subtitle: "JWT Bearer + HttpOnly RTR",
			icon: IconShieldCheck,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
			border: "border-blue-500/20",
		},
	];

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{stats.map((stat, i) => {
				const Icon = stat.icon;
				return (
					<Card
						key={i}
						className="relative overflow-hidden border-border/70 bg-card hover:border-primary/40 transition-all shadow-xs"
					>
						<CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full gap-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium text-muted-foreground">
									{stat.title}
								</span>
								<div
									className={`flex size-8 items-center justify-center rounded-lg ${stat.bg} ${stat.color} border ${stat.border}`}
								>
									<Icon className="size-4" />
								</div>
							</div>

							<div className="space-y-1">
								<div className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-foreground">
									{stat.value}
								</div>
								<div className="text-xs text-muted-foreground flex items-center gap-1">
									<span>{stat.subtitle}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
