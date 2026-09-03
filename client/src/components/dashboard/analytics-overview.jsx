import * as React from "react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsOverview } from "@/queries";
import {
	IconChartBar,
	IconRefresh,
	IconRobot,
	IconUser,
	IconWorld,
	IconBrowser,
	IconDevices,
	IconArrowUpRight,
	IconBolt,
	IconSparkles,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function AnalyticsOverview({ urls = [], selectedShortCode: initialShortCode }) {
	const [selectedCode, setSelectedCode] = React.useState(
		initialShortCode || (urls.length > 0 ? urls[0].shortCode : "")
	);
	const [days, setDays] = React.useState(7);
	const [isSimulating, setIsSimulating] = React.useState(false);

	React.useEffect(() => {
		if (initialShortCode) {
			setSelectedCode(initialShortCode);
		} else if (!selectedCode && urls.length > 0) {
			setSelectedCode(urls[0].shortCode);
		}
	}, [initialShortCode, urls]);

	const interval = days <= 2 ? "HOUR" : "DAY";

	const {
		data: analytics,
		isLoading,
		isRefetching,
		refetch,
	} = useAnalyticsOverview(selectedCode, { days, interval, includeBots: true });

	const formatChartDate = (dateStr) => {
		try {
			const date = new Date(dateStr);
			if (days <= 2) {
				return date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
			}
			return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
		} catch {
			return dateStr;
		}
	};

	const formatTooltipDate = (dateStr) => {
		try {
			const date = new Date(dateStr);
			if (days <= 2) {
				return date.toLocaleString("en-US", {
					month: "short",
					day: "numeric",
					hour: "numeric",
					minute: "2-digit",
					hour12: true,
				});
			}
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return dateStr;
		}
	};

	const timeSeriesData = (analytics?.timeSeries || []).map((pt) => ({
		date: formatChartDate(pt.timestamp),
		fullDate: formatTooltipDate(pt.timestamp),
		clicks: pt.clicks,
	}));

	const handleSimulateClick = async () => {
		if (!selectedCode) return;
		setIsSimulating(true);
		try {
			// Trigger a redirect hit in background
			await fetch(`http://localhost:8080/r/${selectedCode}`, { mode: "no-cors" });
			toast.success(`Click event published to Kafka for /r/${selectedCode}`);
			// Refetch after 1.5 seconds for Kafka ingestion
			setTimeout(() => {
				refetch();
				setIsSimulating(false);
			}, 1500);
		} catch {
			setIsSimulating(false);
			window.open(`http://localhost:8080/r/${selectedCode}`, "_blank");
		}
	};

	// Custom Glassmorphic Tooltip
	const CustomTooltip = ({ active, payload }) => {
		if (active && payload && payload.length) {
			const pt = payload[0].payload;
			return (
				<div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
					<div className="font-semibold text-foreground font-mono">{pt.fullDate || pt.date}</div>
					<div className="flex items-center gap-2 text-primary">
						<span className="size-2 rounded-full bg-primary" />
						<span className="font-bold">{payload[0].value} {payload[0].value === 1 ? "click" : "clicks"}</span>
					</div>
				</div>
			);
		}
		return null;
	};

	if (!selectedCode && urls.length === 0) {
		return (
			<Card className="border-border/70 bg-card p-12 text-center shadow-xs">
				<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
					<IconChartBar className="size-6" />
				</div>
				<h3 className="font-heading text-lg font-semibold text-foreground">
					No URL Selected for Telemetry
				</h3>
				<p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1">
					Create your first short URL to start streaming real-time click telemetry and geographic analytics.
				</p>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Top Bar: Selector & Range Filters */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-medium text-muted-foreground">Shortcode:</span>
					<select
						value={selectedCode}
						onChange={(e) => setSelectedCode(e.target.value)}
						className="h-8.5 rounded-lg border border-border bg-card px-3 text-xs font-mono font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer shadow-2xs"
					>
						{urls.map((u) => (
							<option key={u.id || u.shortCode} value={u.shortCode}>
								/r/{u.shortCode} {u.title ? `(${u.title})` : ""}
							</option>
						))}
					</select>

					<Button
						variant="outline"
						size="sm"
						onClick={handleSimulateClick}
						disabled={isSimulating}
						className="h-8 gap-1.5 text-xs cursor-pointer shadow-2xs"
						title="Simulate redirect hit to test Kafka pipeline"
					>
						<IconBolt className={`size-3.5 text-amber-500 ${isSimulating ? "animate-pulse" : ""}`} />
						<span>{isSimulating ? "Streaming..." : "Simulate Click"}</span>
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
						{[
							{ label: "24H", value: 1 },
							{ label: "7D", value: 7 },
							{ label: "14D", value: 14 },
							{ label: "30D", value: 30 },
						].map((item) => (
							<button
								key={item.value}
								onClick={() => setDays(item.value)}
								className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
									days === item.value
										? "bg-background text-foreground shadow-2xs font-semibold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{item.label}
							</button>
						))}
					</div>

					<Button
						variant="outline"
						size="icon-sm"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
						title="Refresh Telemetry"
					>
						<IconRefresh className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
					</Button>
				</div>
			</div>

			{/* High-Level Telemetry Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="border-border/70 bg-card shadow-xs hover:border-primary/40 transition-colors">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Total Ingested Clicks</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground mt-1">
								{isLoading ? <Skeleton className="h-8 w-20" /> : analytics?.totalClicks ?? 0}
							</div>
							<div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
								Kafka topic: url-clicks
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
							<IconChartBar className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs hover:border-emerald-500/40 transition-colors">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Human Verified Traffic</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-500 mt-1">
								{isLoading ? <Skeleton className="h-8 w-20" /> : analytics?.humanClicks ?? 0}
							</div>
							<div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
								{analytics?.totalClicks
									? `${Math.round(((analytics.humanClicks || 0) / analytics.totalClicks) * 100)}% of all traffic`
									: "Ready to stream"}
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
							<IconUser className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs hover:border-amber-500/40 transition-colors">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Automated Bots Filtered</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-amber-500 mt-1">
								{isLoading ? (
									<Skeleton className="h-8 w-20" />
								) : (
									`${analytics?.botClicks ?? 0}`
								)}
							</div>
							<div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
								{analytics?.botPercentage ? `${analytics.botPercentage}% bot ratio` : "0% bots"}
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
							<IconRobot className="size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Time-Series Clicks Velocity Chart */}
			<Card className="border-border/70 bg-card shadow-xs overflow-hidden">
				<CardHeader className="pb-2">
					<CardTitle className="text-base font-heading font-semibold flex items-center justify-between">
						<span>Click Velocity & Trends</span>
						<Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
							Live Stream
						</Badge>
					</CardTitle>
					<CardDescription className="text-xs">
						Historical traffic distribution over the {days === 1 ? "past 24 hours" : `past ${days} days`} for{" "}
						<span className="font-mono font-medium text-foreground">/r/{selectedCode}</span>
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4">
					{isLoading ? (
						<Skeleton className="h-64 w-full" />
					) : timeSeriesData.length > 0 ? (
						<div className="h-64 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
									<defs>
										<linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
											<stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
										</linearGradient>
									</defs>
									<XAxis
										dataKey="date"
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
										allowDecimals={false}
									/>
									<Tooltip content={<CustomTooltip />} />
									<Area
										type="monotone"
										dataKey="clicks"
										stroke="var(--primary)"
										strokeWidth={2.5}
										fillOpacity={1}
										fill="url(#clickGradient)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="h-48 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
							<span>No click activity recorded in this period yet.</span>
							<Button size="sm" variant="outline" onClick={handleSimulateClick} className="gap-1.5 text-xs cursor-pointer">
								<IconBolt className="size-3.5 text-amber-500" />
								<span>Send Test Click Event</span>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Breakdown Grid: Countries, Browsers, Devices, Referrers */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Top Countries */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-heading font-semibold flex items-center gap-2">
							<IconWorld className="size-4 text-primary" />
							<span>Geographic Distribution</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{isLoading ? (
							<Skeleton className="h-32 w-full" />
						) : (analytics?.topCountries || []).length > 0 ? (
							analytics.topCountries.map((c, i) => (
								<div key={i} className="space-y-1">
									<div className="flex items-center justify-between text-xs">
										<span className="font-medium text-foreground">{c.name}</span>
										<span className="text-muted-foreground font-mono">
											{c.count} ({c.percentage}%)
										</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-primary"
											style={{ width: `${Math.min(c.percentage, 100)}%` }}
										/>
									</div>
								</div>
							))
						) : (
							<div className="text-xs text-muted-foreground py-4 text-center">
								No geographic telemetry available.
							</div>
						)}
					</CardContent>
				</Card>

				{/* Top Browsers */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-heading font-semibold flex items-center gap-2">
							<IconBrowser className="size-4 text-emerald-500" />
							<span>Browser Breakdown</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{isLoading ? (
							<Skeleton className="h-32 w-full" />
						) : (analytics?.topBrowsers || []).length > 0 ? (
							analytics.topBrowsers.map((b, i) => (
								<div key={i} className="space-y-1">
									<div className="flex items-center justify-between text-xs">
										<span className="font-medium text-foreground">{b.name}</span>
										<span className="text-muted-foreground font-mono">
											{b.count} ({b.percentage}%)
										</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-emerald-500"
											style={{ width: `${Math.min(b.percentage, 100)}%` }}
										/>
									</div>
								</div>
							))
						) : (
							<div className="text-xs text-muted-foreground py-4 text-center">
								No browser telemetry available.
							</div>
						)}
					</CardContent>
				</Card>

				{/* Operating Systems & Devices */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-heading font-semibold flex items-center gap-2">
							<IconDevices className="size-4 text-amber-500" />
							<span>Operating Systems & Devices</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{isLoading ? (
							<Skeleton className="h-32 w-full" />
						) : (analytics?.topOperatingSystems || []).length > 0 ? (
							analytics.topOperatingSystems.map((os, i) => (
								<div key={i} className="space-y-1">
									<div className="flex items-center justify-between text-xs">
										<span className="font-medium text-foreground">{os.name}</span>
										<span className="text-muted-foreground font-mono">
											{os.count} ({os.percentage}%)
										</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-amber-500"
											style={{ width: `${Math.min(os.percentage, 100)}%` }}
										/>
									</div>
								</div>
							))
						) : (
							<div className="text-xs text-muted-foreground py-4 text-center">
								No OS telemetry available.
							</div>
						)}
					</CardContent>
				</Card>

				{/* Traffic Referrers */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-heading font-semibold flex items-center gap-2">
							<IconArrowUpRight className="size-4 text-blue-500" />
							<span>Referrer Channels</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{isLoading ? (
							<Skeleton className="h-32 w-full" />
						) : (analytics?.topReferrers || []).length > 0 ? (
							analytics.topReferrers.map((ref, i) => (
								<div key={i} className="space-y-1">
									<div className="flex items-center justify-between text-xs">
										<span className="font-medium text-foreground truncate max-w-[200px]">
											{ref.name}
										</span>
										<span className="text-muted-foreground font-mono">
											{ref.count} ({ref.percentage}%)
										</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-blue-500"
											style={{ width: `${Math.min(ref.percentage, 100)}%` }}
										/>
									</div>
								</div>
							))
						) : (
							<div className="text-xs text-muted-foreground py-4 text-center">
								No referrer telemetry available.
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
