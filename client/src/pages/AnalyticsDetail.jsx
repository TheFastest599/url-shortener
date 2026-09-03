import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAnalyticsOverview } from "@/queries";
import { ROUTES } from "@/routes/paths";
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	IconArrowLeft,
	IconChartBar,
	IconUser,
	IconRobot,
	IconBolt,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconWorld,
	IconBrowser,
	IconDeviceDesktop,
	IconShare,
	IconCalendar,
} from "@tabler/icons-react";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export function AnalyticsDetailPage() {
	const { shortCode } = useParams();
	const navigate = useNavigate();

	const [days, setDays] = React.useState(7);
	const [isSimulating, setIsSimulating] = React.useState(false);
	const [copied, setCopied] = React.useState(false);

	const interval = days === 1 ? "HOUR" : "DAY";

	const {
		data: analytics,
		isLoading,
		refetch,
	} = useAnalyticsOverview(shortCode, {
		days,
		interval,
		includeBots: true,
	});

	const fullShortUrl = `http://localhost:8080/r/${shortCode}`;

	const handleCopy = () => {
		navigator.clipboard.writeText(fullShortUrl);
		setCopied(true);
		toast.success("Short URL copied to clipboard");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleSimulateClick = async () => {
		setIsSimulating(true);
		try {
			await fetch(fullShortUrl, { method: "GET", mode: "no-cors" });
			toast.success("Simulated redirect hit: Kafka event produced");
			setTimeout(() => {
				refetch();
				setIsSimulating(false);
			}, 900);
		} catch {
			setIsSimulating(false);
		}
	};

	// Format time-series points
	const timeSeriesData = React.useMemo(() => {
		if (!analytics?.timeSeries) return [];
		return analytics.timeSeries.map((point) => {
			const rawDate = point.timestamp || "";
			let label = rawDate;
			try {
				const d = new Date(rawDate);
				if (days === 1) {
					label = d.toLocaleTimeString([], { hour: "numeric", hour12: true });
				} else {
					label = d.toLocaleDateString([], { month: "short", day: "numeric" });
				}
			} catch {}

			return {
				date: label,
				fullDate: rawDate,
				clicks: point.clicks || 0,
			};
		});
	}, [analytics?.timeSeries, days]);

	const totalClicks = analytics?.totalClicks ?? 0;
	const humanClicks = analytics?.humanClicks ?? 0;
	const botClicks = analytics?.botClicks ?? 0;
	const botPercentage = analytics?.botPercentage ?? 0;

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* Back Link */}
			<div className="flex items-center justify-between">
				<Link
					to={ROUTES.REDIRECT_LINKS}
					className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<IconArrowLeft className="size-3.5" />
					<span>Back to Redirect Links</span>
				</Link>
			</div>

			{/* 2. Page Header & Range Controls */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 border border-border/70 rounded-2xl p-4 sm:p-6 shadow-2xs">
				<div className="space-y-1.5 min-w-0">
					<div className="flex flex-wrap items-center gap-2.5">
						<span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
							/r/{shortCode}
						</span>
						<button
							onClick={handleCopy}
							className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-2xs"
							title="Copy short link"
						>
							{copied ? (
								<IconCheck className="size-4 text-emerald-500" />
							) : (
								<IconCopy className="size-4" />
							)}
						</button>
						<a
							href={fullShortUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-primary cursor-pointer transition-colors shadow-2xs"
							title="Test 302 Redirection"
						>
							<IconExternalLink className="size-4" />
						</a>
						<Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
							Live Stream
						</Badge>
					</div>

					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<IconCalendar className="size-3.5 shrink-0" />
						<span>Target: <span className="font-mono text-foreground">{fullShortUrl}</span></span>
					</div>
				</div>

				{/* Range Selector & Simulate Click Action */}
				<div className="flex flex-wrap items-center gap-2.5">
					<Button
						variant="outline"
						size="sm"
						onClick={handleSimulateClick}
						disabled={isSimulating}
						className="h-8.5 gap-1.5 text-xs cursor-pointer shadow-2xs"
						title="Simulate click event to test real-time stream"
					>
						<IconBolt className={`size-3.5 text-amber-500 ${isSimulating ? "animate-pulse" : ""}`} />
						<span>{isSimulating ? "Sending Click..." : "Simulate Click"}</span>
					</Button>

					<div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
						{[
							{ label: "24H", value: 1 },
							{ label: "7D", value: 7 },
							{ label: "14D", value: 14 },
							{ label: "30D", value: 30 },
						].map((item) => (
							<button
								key={item.value}
								onClick={() => setDays(item.value)}
								className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
									days === item.value
										? "bg-background text-foreground shadow-2xs font-semibold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{item.label}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* 3. Primary KPI Telemetry Summary Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Total Clicks Recorded</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground mt-1">
								{isLoading ? <Skeleton className="h-8 w-20" /> : totalClicks}
							</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Across selected {days === 1 ? "24-hour" : `${days}-day`} window
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
							<IconChartBar className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Human Verified Clicks</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-500 mt-1">
								{isLoading ? <Skeleton className="h-8 w-20" /> : humanClicks}
							</div>
							<div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
								{totalClicks > 0
									? `${Math.round((humanClicks / totalClicks) * 100)}% human ratio`
									: "100% human traffic"}
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
							<IconUser className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Automated Bots Filtered</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-amber-500 mt-1">
								{isLoading ? <Skeleton className="h-8 w-20" /> : botClicks}
							</div>
							<div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
								{botPercentage ? `${botPercentage}% bot ratio` : "0% bots"}
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
							<IconRobot className="size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 4. Click Velocity & Trends AreaChart */}
			<Card className="border-border/70 bg-card shadow-xs overflow-hidden">
				<CardHeader className="pb-2">
					<CardTitle className="text-base font-heading font-semibold flex items-center justify-between">
						<span>Click Velocity Timeline</span>
						<span className="text-xs font-mono font-normal text-muted-foreground">
							{days === 1 ? "Hourly Granularity" : "Daily Buckets"}
						</span>
					</CardTitle>
					<CardDescription className="text-xs">
						Historical traffic distribution over the {days === 1 ? "past 24 hours" : `past ${days} days`} for{" "}
						<span className="font-mono font-medium text-foreground">/r/{shortCode}</span>
					</CardDescription>
				</CardHeader>
				<CardContent className="pt-4">
					{isLoading ? (
						<Skeleton className="h-64 w-full rounded-lg" />
					) : timeSeriesData.length > 0 ? (
						<div className="h-64 sm:h-72 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
									<defs>
										<linearGradient id="detailVelocityGrad" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
											<stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
									<XAxis
										dataKey="date"
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									/>
									<YAxis
										allowDecimals={false}
										tickLine={false}
										axisLine={false}
										tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
									/>
									<Tooltip
										content={({ active, payload }) => {
											if (!active || !payload?.length) return null;
											const pt = payload[0].payload;
											return (
												<div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs space-y-1">
													<div className="font-semibold text-foreground font-mono">
														{pt.fullDate || pt.date}
													</div>
													<div className="flex items-center gap-2 text-primary">
														<span className="size-2 rounded-full bg-primary" />
														<span className="font-bold">
															{payload[0].value} {payload[0].value === 1 ? "click" : "clicks"}
														</span>
													</div>
												</div>
											);
										}}
									/>
									<Area
										type="monotone"
										dataKey="clicks"
										stroke="var(--primary)"
										strokeWidth={2}
										fill="url(#detailVelocityGrad)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
							No telemetry data available for this range.
						</div>
					)}
				</CardContent>
			</Card>

			{/* 5. Geographic & Technology Demographic Breakdowns */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
				{/* Top Countries */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="p-4 pb-3">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
							<IconWorld className="size-4 text-primary" />
							<span>Top Geographic Locations</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0 space-y-3">
						{analytics?.topCountries && analytics.topCountries.length > 0 ? (
							analytics.topCountries.slice(0, 5).map((c) => (
								<div key={c.name} className="space-y-1">
									<div className="flex justify-between text-xs">
										<span className="font-medium text-foreground truncate">{c.name}</span>
										<span className="font-mono text-muted-foreground">{c.count} ({c.percentage}%)</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-primary"
											style={{ width: `${Math.min(c.percentage || 0, 100)}%` }}
										/>
									</div>
								</div>
							))
						) : (
							<div className="text-xs text-muted-foreground py-4 text-center">No country data</div>
						)}
					</CardContent>
				</Card>

				{/* Top Browsers */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="p-4 pb-3">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
							<IconBrowser className="size-4 text-emerald-500" />
							<span>Browsers</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0 space-y-3">
						{analytics?.topBrowsers && analytics.topBrowsers.length > 0 ? (
							analytics.topBrowsers.slice(0, 5).map((b) => (
								<div key={b.name} className="space-y-1">
									<div className="flex justify-between text-xs">
										<span className="font-medium text-foreground truncate">{b.name}</span>
										<span className="font-mono text-muted-foreground">{b.count} ({b.percentage}%)</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-emerald-500"
											style={{ width: `${Math.min(b.percentage || 0, 100)}%` }}
										/>
									</div>
								</div>
							))
						) : (
							<div className="text-xs text-muted-foreground py-4 text-center">No browser data</div>
						)}
					</CardContent>
				</Card>

				{/* Top Devices & Platforms */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="p-4 pb-3">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
							<IconDeviceDesktop className="size-4 text-blue-500" />
							<span>Device Types & Platforms</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0 space-y-3">
						{analytics?.topDevices && analytics.topDevices.length > 0 ? (
							analytics.topDevices.slice(0, 5).map((d) => (
								<div key={d.name} className="space-y-1">
									<div className="flex justify-between text-xs">
										<span className="font-medium text-foreground truncate">{d.name}</span>
										<span className="font-mono text-muted-foreground">{d.count} ({d.percentage}%)</span>
									</div>
									<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-blue-500"
											style={{ width: `${Math.min(d.percentage || 0, 100)}%` }}
										/>
									</div>
								</div>
							))
						) : (
							<div className="text-xs text-muted-foreground py-4 text-center">No device data</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default AnalyticsDetailPage;
