import * as React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconChartBar } from "@tabler/icons-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

export function LinkTelemetrySnapshot({ shortCode, analytics }) {
	const chartData = (analytics?.timeSeries || []).map((pt, idx) => ({
		idx,
		clicks: pt.clicks,
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
				<div className="text-2xl font-bold font-heading text-foreground">
					{analytics?.totalClicks ?? 0}
					<span className="text-xs font-normal text-muted-foreground ml-1.5">recent clicks</span>
				</div>

				<div className="h-24 w-full">
					{chartData.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
								<defs>
									<linearGradient id="linkDetailGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
										<stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
									</linearGradient>
								</defs>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length) {
											return (
												<div className="rounded-md border border-border bg-popover px-2 py-1 text-[10px] shadow-sm font-mono">
													<span>{payload[0].value} clicks</span>
												</div>
											);
										}
										return null;
									}}
								/>
								<Area
									type="monotone"
									dataKey="clicks"
									stroke="var(--primary)"
									strokeWidth={1.5}
									fill="url(#linkDetailGrad)"
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
