import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useAnalyticsOverview } from "@/queries";

export function MiniSparkline({ shortCode }) {
	const { data: analytics, isLoading } = useAnalyticsOverview(shortCode, {
		days: 7,
		includeBots: false,
	});

	const rawSeries = analytics?.timeSeries || [];
	const chartData = rawSeries.map((pt, idx) => ({
		idx,
		clicks: pt.clicks,
	}));

	if (isLoading) {
		return <Skeleton className="h-6 w-20 rounded" />;
	}

	if (!chartData.length || chartData.every((d) => d.clicks === 0)) {
		return <span className="text-[10px] text-muted-foreground/60 font-mono">0 / 7d</span>;
	}

	return (
		<div className="h-6 w-20">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={chartData} margin={{ top: 2, right: 1, left: 1, bottom: 1 }}>
					<defs>
						<linearGradient id={`grad-dash-${shortCode}`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
							<stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
						</linearGradient>
					</defs>
					<Area
						type="monotone"
						dataKey="clicks"
						stroke="var(--primary)"
						strokeWidth={1.5}
						fill={`url(#grad-dash-${shortCode})`}
						dot={false}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}

export default MiniSparkline;
