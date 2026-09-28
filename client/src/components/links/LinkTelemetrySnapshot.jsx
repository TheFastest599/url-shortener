import * as React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconChartBar } from "@tabler/icons-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

export function LinkTelemetrySnapshot({ shortCode, analytics }) {
	const chartData = (analytics?.timeSeries || []).map((pt, idx) => ({
		idx,
		clicks: pt.clicks,
		humanClicks: pt.humanClicks ?? pt.clicks,
		botClicks: pt.botClicks ?? 0,
		date: pt.timestamp ? pt.timestamp.split("T")[0] : "",
	}));

	return (
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
					<span>7-Day Traffic Trend</span>
					<IconChartBar className="size-4 text-primary" />
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-1 space-y-3">
				<div className="flex items-baseline justify-between">
					<div className="text-2xl font-bold font-heading text-foreground">
						{analytics?.humanClicks ?? analytics?.totalClicks ?? 0}
						<span className="text-xs font-normal text-muted-foreground ml-1.5">human clicks</span>
					</div>
					{(analytics?.botClicks ?? 0) > 0 && (
						<span className="text-xs text-muted-foreground font-mono">
							({analytics.botClicks} bots)
						</span>
					)}
				</div>

				<div className="h-24 w-full">
					{chartData.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
								<defs>
									<linearGradient id="linkDetailHumanGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
										<stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.0} />
									</linearGradient>
									<linearGradient id="linkDetailBotGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.25} />
										<stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.0} />
									</linearGradient>
								</defs>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length) {
											const data = payload[0].payload;
											return (
												<div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-[10px] shadow-sm font-mono space-y-0.5">
													<div className="text-chart-1 font-semibold">{data.humanClicks} human</div>
													{data.botClicks > 0 && (
														<div className="text-chart-3">{data.botClicks} bots</div>
													)}
												</div>
											);
										}
										return null;
									}}
								/>
								<Area
									type="monotone"
									dataKey="humanClicks"
									stroke="var(--chart-1)"
									strokeWidth={1.5}
									fill="url(#linkDetailHumanGrad)"
								/>
								<Area
									type="monotone"
									dataKey="botClicks"
									stroke="var(--chart-3)"
									strokeWidth={1}
									fill="url(#linkDetailBotGrad)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					) : (
						<div className="h-full flex items-center justify-center text-xs text-muted-foreground">
							No traffic yet
						</div>
					)}
				</div>

				<Link
					to={`/analytics/${shortCode}`}
					className="block text-center text-xs text-primary font-medium hover:underline pt-2 border-t border-border/50"
				>
					Open Full Telemetry Hub →
				</Link>
			</CardContent>
		</Card>
	);
}

export default LinkTelemetrySnapshot;
