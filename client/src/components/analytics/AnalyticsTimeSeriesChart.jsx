import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AreaChart,
	Area,
	ResponsiveContainer,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
} from "recharts";
import { IconChartBar } from "@tabler/icons-react";

export function AnalyticsTimeSeriesChart({
	data = [],
	isLoading = false,
	title = "Traffic Velocity Over Time",
	description = "Hourly & daily redirect request distribution with bot detection.",
	timeRangeDays = 30,
	onTimeRangeChange,
	showRangeSelector = true,
}) {
	const chartData = (data || []).map((pt) => {
		const rawDate = pt.date || pt.timestamp || "";
		let label = pt.date;
		if (!label && rawDate) {
			try {
				const d = new Date(rawDate);
				if (timeRangeDays === 1) {
					label = d.toLocaleTimeString([], {
						hour: "numeric",
						hour12: true,
					});
				} else {
					label = d.toLocaleDateString([], {
						month: "short",
						day: "numeric",
					});
				}
			} catch {
				label = rawDate;
			}
		}
		const total =
			pt.clicks ??
			pt.count ??
			(pt.humanClicks || 0) + (pt.botClicks || 0);
		return {
			...pt,
			date: label || "—",
			fullDate: pt.fullDate || pt.timestamp || label,
			clicks: total,
			humanClicks: pt.humanClicks !== undefined ? pt.humanClicks : total,
			botClicks: pt.botClicks ?? 0,
		};
	});

	const hasClicks = chartData.some(
		(d) => d.clicks > 0 || d.humanClicks > 0 || d.botClicks > 0,
	);

	return (
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-4 sm:p-5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="space-y-0.5">
					<CardTitle className="text-base font-bold font-heading text-foreground flex items-center gap-2">
						<IconChartBar className="size-4 text-primary" />
						<span>{title}</span>
					</CardTitle>
					<CardDescription className="text-xs">
						{description}
					</CardDescription>
				</div>

				<div className="flex items-center gap-3 flex-wrap">
					{/* Tri-metric Legend */}
					<div className="hidden sm:flex items-center gap-3 text-xs bg-muted/30 px-2.5 py-1 rounded-lg border border-border/50">
						<div className="flex items-center gap-1.5 font-medium text-foreground">
							<span className="size-2 rounded-full bg-chart-2" />
							<span>Total Clicks</span>
						</div>
						<div className="flex items-center gap-1.5 font-medium text-chart-1">
							<span className="size-2 rounded-full bg-chart-1" />
							<span>Human</span>
						</div>
						<div className="flex items-center gap-1.5 font-medium text-chart-3">
							<span className="size-2 rounded-full bg-chart-3" />
							<span>Bots</span>
						</div>
					</div>

					{showRangeSelector && onTimeRangeChange && (
						<div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs">
							{[7, 30, 90].map((d) => (
								<button
									key={d}
									type="button"
									onClick={() => onTimeRangeChange(d)}
									className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
										timeRangeDays === d
											? "bg-card text-foreground font-semibold shadow-2xs border border-border/70"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{d}d
								</button>
							))}
						</div>
					)}
				</div>
			</CardHeader>

			<CardContent className="p-4 sm:p-5 pt-2">
				{isLoading ? (
					<Skeleton className="h-64 w-full rounded-xl" />
				) : chartData.length === 0 || !hasClicks ? (
					<div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs space-y-1">
						<IconChartBar className="size-8 opacity-30" />
						<p>No traffic recorded in this selected timeframe.</p>
					</div>
				) : (
					<div className="h-64 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={chartData}
								margin={{
									top: 10,
									right: 10,
									left: -20,
									bottom: 0,
								}}
							>
								<defs>
									<linearGradient
										id="colorTotal"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--chart-2)"
											stopOpacity={0.25}
										/>
										<stop
											offset="95%"
											stopColor="var(--chart-2)"
											stopOpacity={0.0}
										/>
									</linearGradient>
									<linearGradient
										id="colorHuman"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--chart-1)"
											stopOpacity={0.4}
										/>
										<stop
											offset="95%"
											stopColor="var(--chart-1)"
											stopOpacity={0.0}
										/>
									</linearGradient>
									<linearGradient
										id="colorBot"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--chart-3)"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="var(--chart-3)"
											stopOpacity={0.0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									opacity={0.15}
								/>
								<XAxis
									dataKey="date"
									tickLine={false}
									axisLine={false}
									tick={{
										fontSize: 11,
										fill: "var(--muted-foreground)",
									}}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									allowDecimals={false}
									tick={{
										fontSize: 11,
										fill: "var(--muted-foreground)",
									}}
								/>
								<Tooltip
									content={({ active, payload, label }) => {
										if (!active || !payload?.length)
											return null;
										const pt = payload[0].payload;
										return (
											<div className="p-2.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-md text-xs space-y-1.5 min-w-[150px]">
												<div className="font-semibold text-[11px] text-muted-foreground font-mono">
													{pt.fullDate || label}
												</div>
												<div className="space-y-1">
													<div className="flex items-center justify-between gap-4 font-semibold text-chart-2">
														<span className="flex items-center gap-1.5">
															<span className="size-2 rounded-full bg-chart-2" />
															Total Clicks:
														</span>
														<span>{pt.clicks}</span>
													</div>
													<div className="flex items-center justify-between gap-4 font-medium text-chart-1">
														<span className="flex items-center gap-1.5">
															<span className="size-2 rounded-full bg-chart-1" />
															Human Traffic:
														</span>
														<span>
															{pt.humanClicks ??
																pt.clicks}
														</span>
													</div>
													{pt.botClicks > 0 && (
														<div className="flex items-center justify-between gap-4 font-medium text-chart-3">
															<span className="flex items-center gap-1.5">
																<span className="size-2 rounded-full bg-chart-3" />
																Automated /
																Bots:
															</span>
															<span>
																{pt.botClicks}
															</span>
														</div>
													)}
												</div>
											</div>
										);
									}}
								/>
								<Area
									type="monotone"
									dataKey="clicks"
									name="Total Clicks"
									stroke="var(--chart-2)"
									strokeWidth={2}
									fill="url(#colorTotal)"
								/>
								<Area
									type="monotone"
									dataKey="humanClicks"
									name="Human Traffic"
									stroke="var(--chart-1)"
									strokeWidth={2}
									fill="url(#colorHuman)"
								/>
								<Area
									type="monotone"
									dataKey="botClicks"
									name="Bot Traffic"
									stroke="var(--chart-3)"
									strokeWidth={1.5}
									fill="url(#colorBot)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default AnalyticsTimeSeriesChart;
