import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUrlsQuery, useAnalyticsOverview } from "@/queries";
import { ROUTES } from "@/routes/paths";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
	IconChartBar,
	IconLink,
	IconUser,
	IconRobot,
	IconWorld,
	IconDeviceDesktop,
	IconArrowRight,
	IconSearch,
	IconShare,
	IconFlame,
	IconTag,
	IconCalendar,
	IconExternalLink,
} from "@tabler/icons-react";
import {
	AreaChart,
	Area,
	ResponsiveContainer,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
} from "recharts";

/* Hallmark · page: Analytics Hub · macrostructure: Workbench · theme: modern-minimal */

export function AnalyticsPage() {
	const navigate = useNavigate();
	const [timeRangeDays, setTimeRangeDays] = React.useState(30);
	const [searchQuery, setSearchQuery] = React.useState("");

	// Fetch all user short URLs
	const { data: serverUrls, isLoading: urlsLoading } = useUrlsQuery({
		page: 0,
		size: 50,
		sortBy: "createdAt",
		direction: "DESC",
	});

	const urls = Array.isArray(serverUrls) ? serverUrls : serverUrls?.content || [];
	const totalLinks = serverUrls?.totalElements ?? urls.length;

	// Pick top URL or first URL for detailed telemetry sample, or aggregate
	const topUrl = React.useMemo(() => {
		if (urls.length === 0) return null;
		return [...urls].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
	}, [urls]);

	const selectedCode = topUrl?.shortCode || "";

	const { data: topAnalytics, isLoading: analyticsLoading } = useAnalyticsOverview(
		selectedCode,
		{
			days: timeRangeDays,
			includeBots: true,
			enabled: !!selectedCode,
		}
	);

	// Calculate aggregate click counts across all URLs
	const totalWorkspaceClicks = React.useMemo(() => {
		return urls.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);
	}, [urls]);

	// Filter links for the leaderboard
	const filteredUrls = React.useMemo(() => {
		if (!searchQuery.trim()) return urls;
		const q = searchQuery.toLowerCase().trim();
		return urls.filter(
			(u) =>
				u.shortCode.toLowerCase().includes(q) ||
				(u.destinationUrl && u.destinationUrl.toLowerCase().includes(q)) ||
				(u.title && u.title.toLowerCase().includes(q))
		);
	}, [urls, searchQuery]);

	// Prepare time-series chart data
	const timeSeriesData = React.useMemo(() => {
		const raw = topAnalytics?.timeSeries || [];
		return raw.map((pt) => ({
			date: pt.timestamp ? pt.timestamp.split("T")[0].slice(5) : "",
			fullDate: pt.timestamp ? pt.timestamp.split("T")[0] : "",
			clicks: pt.clicks,
			humanClicks: pt.humanClicks ?? pt.clicks,
			botClicks: pt.botClicks ?? 0,
		}));
	}, [topAnalytics]);

	const topCountries = topAnalytics?.topCountries || [];
	const topBrowsers = topAnalytics?.topBrowsers || [];
	const topReferrers = topAnalytics?.topReferrers || [];
	const topUtmSources = topAnalytics?.topUtmSources || [];

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Header & Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
				<div>
					<h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
						<IconChartBar className="size-7 text-primary" />
						<span>Workspace Analytics Hub</span>
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						Global traffic telemetry, bot filtering ratios, geographic distribution, and channel attribution.
					</p>
				</div>

				{/* Time Window Buttons */}
				<div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/60 shrink-0">
					{[
						{ label: "7D", days: 7 },
						{ label: "30D", days: 30 },
						{ label: "90D", days: 90 },
					].map((tab) => (
						<button
							key={tab.days}
							onClick={() => setTimeRangeDays(tab.days)}
							className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
								timeRangeDays === tab.days
									? "bg-background text-foreground shadow-2xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* 2. Top Metric Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="space-y-0.5 sm:space-y-1 min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Total Workspace Clicks
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-foreground">
								{totalWorkspaceClicks.toLocaleString()}
							</div>
							<div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
								Across {totalLinks} short links
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary border border-primary/20">
							<IconLink className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="space-y-0.5 sm:space-y-1 min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Top Link Clicks ({timeRangeDays}d)
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-blue-500">
								{topAnalytics?.totalClicks ?? (topUrl?.clickCount || 0)}
							</div>
							<div className="text-[10px] sm:text-[11px] text-muted-foreground truncate font-mono">
								{topUrl ? `/r/${topUrl.shortCode}` : "None"}
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
							<IconFlame className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="space-y-0.5 sm:space-y-1 min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Human Verification
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-emerald-500">
								{topAnalytics?.humanClicks ?? 0}
							</div>
							<div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
								{topAnalytics?.totalClicks
									? `${Math.round(((topAnalytics.humanClicks || 0) / topAnalytics.totalClicks) * 100)}% verified traffic`
									: "100% human"}
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
							<IconUser className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="space-y-0.5 sm:space-y-1 min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Automated Bots Filtered
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-amber-500">
								{topAnalytics?.botClicks ?? 0}
							</div>
							<div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate">
								{topAnalytics?.botPercentage ? `${topAnalytics.botPercentage}% crawl rate` : "Zero noise"}
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
							<IconRobot className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 3. Traffic Velocity Chart */}
			<Card className="border-border/70 bg-card shadow-xs overflow-hidden">
				<CardHeader className="p-4 sm:p-5 pb-2 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<div>
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<IconChartBar className="size-4 text-primary" />
							<span>Traffic Velocity Over Time ({timeRangeDays} Days)</span>
						</CardTitle>
						<CardDescription className="text-xs">
							Daily click volume for top active link: <span className="font-mono text-primary font-semibold">/r/{selectedCode || "..."}</span>
						</CardDescription>
					</div>

					{selectedCode && (
						<Link to={`/analytics/${selectedCode}`}>
							<Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 cursor-pointer">
								<span>Detailed Link Breakdown</span>
								<IconArrowRight className="size-3.5" />
							</Button>
						</Link>
					)}
				</CardHeader>

				<CardContent className="p-4 sm:p-6">
					<div className="h-64 sm:h-72 w-full">
						{analyticsLoading ? (
							<Skeleton className="h-full w-full rounded-lg" />
						) : timeSeriesData.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
									<defs>
										<linearGradient id="analyticsVelocityGrad" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
											<stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
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
									<Tooltip
										content={({ active, payload }) => {
											if (active && payload && payload.length) {
												const d = payload[0].payload;
												return (
													<div className="rounded-lg border border-border bg-popover p-2.5 shadow-md text-xs space-y-1">
														<div className="font-semibold text-foreground">{d.fullDate}</div>
														<div className="flex items-center justify-between gap-4 text-primary font-mono">
															<span>Total Clicks:</span>
															<span className="font-bold">{d.clicks}</span>
														</div>
														<div className="flex items-center justify-between gap-4 text-emerald-500 font-mono text-[11px]">
															<span>Human:</span>
															<span>{d.humanClicks}</span>
														</div>
														{d.botClicks > 0 && (
															<div className="flex items-center justify-between gap-4 text-amber-500 font-mono text-[11px]">
																<span>Bots:</span>
																<span>{d.botClicks}</span>
															</div>
														)}
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
										strokeWidth={2}
										fill="url(#analyticsVelocityGrad)"
										dot={false}
									/>
								</AreaChart>
							</ResponsiveContainer>
						) : (
							<div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs space-y-2">
								<IconChartBar className="size-8 opacity-40" />
								<span>No traffic data recorded in this time range</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 4. Categorical Breakdown Grids */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				{/* Top Referrers */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="p-4 pb-2 border-b border-border/40">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
							<span>Top Referrers</span>
							<IconShare className="size-4 text-primary" />
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-2.5">
						{topReferrers.length > 0 ? (
							topReferrers.slice(0, 5).map((ref) => (
								<div key={ref.label || "direct"} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
									<span className="font-medium text-foreground truncate max-w-[180px]" title={ref.label}>
										{ref.label || "Direct / None"}
									</span>
									<Badge variant="secondary" className="font-mono text-[11px]">
										{ref.count} clicks
									</Badge>
								</div>
							))
						) : (
							<div className="py-6 text-center text-xs text-muted-foreground">
								No referrer data available
							</div>
						)}
					</CardContent>
				</Card>

				{/* Top Browsers */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="p-4 pb-2 border-b border-border/40">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
							<span>Browsers & Devices</span>
							<IconDeviceDesktop className="size-4 text-primary" />
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-2.5">
						{topBrowsers.length > 0 ? (
							topBrowsers.slice(0, 5).map((browser) => (
								<div key={browser.label} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
									<span className="font-medium text-foreground">{browser.label}</span>
									<Badge variant="secondary" className="font-mono text-[11px]">
										{browser.count} clicks
									</Badge>
								</div>
							))
						) : (
							<div className="py-6 text-center text-xs text-muted-foreground">
								No device data available
							</div>
						)}
					</CardContent>
				</Card>

				{/* Top Countries */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="p-4 pb-2 border-b border-border/40">
						<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
							<span>Geographic Reach</span>
							<IconWorld className="size-4 text-primary" />
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 space-y-2.5">
						{topCountries.length > 0 ? (
							topCountries.slice(0, 5).map((country) => (
								<div key={country.label} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
									<span className="font-medium text-foreground">{country.label}</span>
									<Badge variant="secondary" className="font-mono text-[11px]">
										{country.count} clicks
									</Badge>
								</div>
							))
						) : (
							<div className="py-6 text-center text-xs text-muted-foreground">
								No geographic telemetry yet
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* 5. Links Leaderboard & Search */}
			<div className="space-y-3">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<h2 className="text-sm font-semibold font-heading text-foreground">
							All Short Links Telemetry Leaderboard
						</h2>
						<p className="text-xs text-muted-foreground">
							Select any link to inspect granular real-time analytics
						</p>
					</div>

					<div className="relative w-full sm:w-72">
						<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by code or destination..."
							className="pl-9 h-8.5 text-xs bg-card"
						/>
					</div>
				</div>

				<Card className="border-border/70 bg-card overflow-hidden shadow-xs">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
									<th className="py-3 px-4">Short Code</th>
									<th className="py-3 px-4">Destination Target</th>
									<th className="py-3 px-4 text-center">Type</th>
									<th className="py-3 px-4 text-center">Total Clicks</th>
									<th className="py-3 px-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{filteredUrls.length > 0 ? (
									filteredUrls.map((url) => (
										<tr key={url.id || url.shortCode} className="hover:bg-muted/30 transition-colors">
											<td className="py-3.5 px-4 font-mono font-semibold text-foreground">
												<Link
													to={`/analytics/${url.shortCode}`}
													className="text-primary hover:underline"
													title="Inspect analytics"
												>
													/r/{url.shortCode}
												</Link>
											</td>
											<td className="py-3.5 px-4 max-w-xs md:max-w-md truncate text-muted-foreground" title={url.destinationUrl}>
												{url.destinationUrl}
											</td>
											<td className="py-3.5 px-4 text-center">
												{url.isAbTest ? (
													<Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
														A/B Experiment
													</Badge>
												) : (
													<Badge variant="secondary" className="text-[10px]">
														Standard
													</Badge>
												)}
											</td>
											<td className="py-3.5 px-4 text-center font-mono">
												<Badge variant="secondary" className="font-semibold">
													{url.clickCount || 0}
												</Badge>
											</td>
											<td className="py-3.5 px-4 text-right">
												<div className="flex items-center justify-end gap-1.5">
													<Link
														to={`/analytics/${url.shortCode}`}
														className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
														title="View Analytics"
													>
														<IconChartBar className="size-3.5" />
													</Link>
													<Link
														to={`/redirect-links/${url.shortCode}`}
														className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
														title="Manage Link"
													>
														<IconExternalLink className="size-3.5" />
													</Link>
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={5} className="py-8 text-center text-muted-foreground">
											No short links found matching your query
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</Card>
			</div>
		</div>
	);
}

export default AnalyticsPage;
