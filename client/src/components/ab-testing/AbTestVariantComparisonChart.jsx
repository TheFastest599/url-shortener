import * as React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	Legend,
	Cell,
} from "recharts";
import { IconScale, IconTrophy, IconCheck } from "@tabler/icons-react";
import { getVariantColor } from "@/lib/utils";

export function AbTestVariantComparisonChart({
	variants = [],
	variantStats = {},
	totalClicks = 0,
	isLoading = false,
	winningVariant = null,
}) {
	if (isLoading) {
		return (
			<Card className="border-border/70 bg-card shadow-xs">
				<CardHeader className="p-4 sm:p-5 pb-2">
					<Skeleton className="h-5 w-48 mb-1" />
					<Skeleton className="h-3 w-64" />
				</CardHeader>
				<CardContent className="p-4 sm:p-5 pt-2">
					<Skeleton className="h-64 w-full rounded-xl" />
				</CardContent>
			</Card>
		);
	}

	// Prepare data for comparative bar chart
	const chartData = variants.map((v, i) => {
		const stat = variantStats[v.key] || variantStats[v.name] || variantStats[v.id];
		const clicks = stat?.totalClicks ?? 0;
		const observedShare =
			stat?.percentage !== undefined
				? Math.round(stat.percentage * 10) / 10
				: totalClicks > 0
				? Math.round((clicks / totalClicks) * 1000) / 10
				: 0;
		const configuredWeight = v.weight ?? 0;
		const delta = Math.round((observedShare - configuredWeight) * 10) / 10;

		return {
			name: `Variant ${v.key}`,
			key: v.key,
			configuredWeight,
			observedShare,
			clicks,
			delta,
			destinationUrl: v.destinationUrl,
			isControl: v.isControl,
			isWinner: winningVariant === v.key,
			color: getVariantColor(i),
		};
	});

	return (
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-4 sm:p-5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="space-y-0.5">
					<CardTitle className="text-base font-bold font-heading text-foreground flex items-center gap-2">
						<IconScale className="size-4 text-primary" />
						<span>Variant Allocation vs. Observed Performance</span>
					</CardTitle>
					<CardDescription className="text-xs">
						Direct comparison between configured traffic weights and actual observed click shares.
					</CardDescription>
				</div>

				<div className="flex items-center gap-2 flex-wrap text-xs">
					{chartData.map((d) => (
						<Badge
							key={d.key}
							variant="outline"
							className="font-mono text-xs gap-1.5 py-1 px-2.5 bg-muted/20 border-border/60"
						>
							<span
								className="size-2 rounded-full"
								style={{ backgroundColor: d.color }}
							/>
							<span className="font-semibold text-foreground">
								Variant {d.key}:
							</span>
							<span className="text-muted-foreground">
								{d.clicks.toLocaleString()} clicks ({d.observedShare}%)
							</span>
							{d.isWinner && (
								<IconTrophy className="size-3 text-chart-3" title="Winning Variant" />
							)}
						</Badge>
					))}
				</div>
			</CardHeader>

			<CardContent className="p-4 sm:p-5 pt-3">
				<div className="h-64 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={chartData}
							margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
						>
							<CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
							<XAxis
								dataKey="name"
								tickLine={false}
								axisLine={false}
								tick={{ fontSize: 12, fill: "var(--foreground)", fontWeight: 500 }}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								unit="%"
								domain={[0, 100]}
								tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
							/>
							<Tooltip
								cursor={{ fill: "var(--muted)", opacity: 0.15, rx: 6 }}
								content={({ active, payload }) => {
									if (!active || !payload?.length) return null;
									const data = payload[0].payload;
									return (
										<div className="p-3 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg text-xs space-y-2 min-w-[200px]">
											<div className="flex items-center justify-between border-b border-border/50 pb-1.5">
												<span className="font-bold text-foreground flex items-center gap-1.5">
													<span
														className="size-2.5 rounded-full"
														style={{ backgroundColor: data.color }}
													/>
													{data.name}
												</span>
												{data.isControl && (
													<Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
														Control
													</Badge>
												)}
												{data.isWinner && (
													<Badge className="text-[10px] py-0 px-1 bg-chart-3/20 text-chart-3 border-chart-3/30 font-mono">
														Winner
													</Badge>
												)}
											</div>

											<div className="space-y-1 font-mono text-[11px]">
												<div className="flex justify-between">
													<span className="text-muted-foreground">Observed Share:</span>
													<span className="font-bold text-foreground">
														{data.observedShare}% ({data.clicks} clicks)
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-muted-foreground">Configured Target:</span>
													<span className="text-muted-foreground">
														{data.configuredWeight}%
													</span>
												</div>
												<div className="flex justify-between border-t border-border/40 pt-1">
													<span className="text-muted-foreground">Variance Delta:</span>
													<span
														className={`font-semibold ${
															data.delta > 0
																? "text-chart-2"
																: data.delta < 0
																? "text-chart-3"
																: "text-foreground"
														}`}
													>
														{data.delta > 0 ? `+${data.delta}%` : `${data.delta}%`}
													</span>
												</div>
											</div>
										</div>
									);
								}}
							/>
							<Legend
								verticalAlign="top"
								align="right"
								iconType="circle"
								wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
							/>
							<Bar
								dataKey="configuredWeight"
								name="Configured Target (%)"
								fill="var(--muted-foreground)"
								opacity={0.35}
								radius={[4, 4, 0, 0]}
								barSize={28}
							/>
							<Bar
								dataKey="observedShare"
								name="Observed Click Share (%)"
								radius={[4, 4, 0, 0]}
								barSize={28}
							>
								{chartData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

export default AbTestVariantComparisonChart;
