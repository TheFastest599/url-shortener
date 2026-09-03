import * as React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useAnalyticsOverview } from "@/queries";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	IconLink,
	IconChartBar,
	IconUser,
	IconRobot,
	IconArrowRight,
	IconPlus,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconFlame,
} from "@tabler/icons-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

/**
 * Top Link Card with Mini Click Velocity Chart
 */
function TopLinkCard({ url }) {
	const { data: analytics, isLoading } = useAnalyticsOverview(url.shortCode, {
		days: 7,
		includeBots: true,
	});

	const rawSeries = analytics?.timeSeries || [];
	const chartData = rawSeries.map((pt, idx) => ({
		index: idx,
		clicks: pt.clicks,
		date: pt.timestamp ? pt.timestamp.split("T")[0] : "",
	}));

	const totalClicks = analytics?.totalClicks ?? url.clickCount ?? 0;

	return (
		<Card className="border-border/70 bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between overflow-hidden group">
			<CardHeader className="p-4 pb-2 space-y-1">
				<div className="flex items-center justify-between gap-2">
					<span className="font-mono text-xs font-semibold text-primary truncate">
						/r/{url.shortCode}
					</span>
					<Badge
						variant="secondary"
						className="text-[10px] font-mono font-medium shrink-0 px-1.5 py-0"
					>
						{totalClicks} {totalClicks === 1 ? "click" : "clicks"}
					</Badge>
				</div>
				<p className="text-xs text-muted-foreground truncate" title={url.destinationUrl}>
					{url.title || url.destinationUrl}
				</p>
			</CardHeader>

			<CardContent className="p-4 pt-1 pb-3 flex-1 flex flex-col justify-end">
				{/* Mini Sparkline Velocity Chart */}
				<div className="h-16 w-full my-1">
					{isLoading ? (
						<Skeleton className="h-full w-full rounded-md" />
					) : chartData.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
								<defs>
									<linearGradient id={`grad-${url.shortCode}`} x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
										<stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
									</linearGradient>
								</defs>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length) {
											return (
												<div className="rounded-md border border-border bg-popover px-2 py-1 text-[10px] shadow-sm font-mono">
													<span className="font-semibold text-foreground">
														{payload[0].value} clicks
													</span>
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
									fill={`url(#grad-${url.shortCode})`}
									dot={false}
								/>
							</AreaChart>
						</ResponsiveContainer>
					) : (
						<div className="h-full flex items-center justify-center text-[11px] text-muted-foreground">
							No recent traffic
						</div>
					)}
				</div>

				<Link
					to={`/analytics/${url.shortCode}`}
					className="mt-2 inline-flex items-center justify-between text-xs font-medium text-primary hover:underline group-hover:translate-x-0.5 transition-transform"
				>
					<span>View Full Analytics</span>
					<IconArrowRight className="size-3.5" />
				</Link>
			</CardContent>
		</Card>
	);
}

export function DashboardPage() {
	const { user } = useAuthStore();
	const { urls = [], onOpenCreateModal } = useOutletContext() || {};
	const [copiedId, setCopiedId] = React.useState(null);

	// High-level overview: aggregate overall stats across user links
	const totalLinks = urls.length;
	const activeLinks = urls.filter((u) => u.isActive !== false).length;

	// Pick top link for primary ratio or use aggregate
	const primaryCode = urls.length > 0 ? urls[0].shortCode : "";
	const { data: primaryAnalytics } = useAnalyticsOverview(primaryCode, {
		days: 30,
		includeBots: true,
	});

	// Top 4 links by total clicks (or most recent if counts equal)
	const top4Links = React.useMemo(() => {
		return [...urls]
			.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
			.slice(0, 4);
	}, [urls]);

	// 5 most recent links
	const recentLinks = React.useMemo(() => {
		return [...urls]
			.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
			.slice(0, 5);
	}, [urls]);

	const handleCopy = (shortCode, id) => {
		const fullUrl = `http://localhost:8080/r/${shortCode}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedId(id);
		toast.success("Short URL copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return "Just now";
		try {
			return new Date(dateStr).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
			});
		} catch {
			return "Recently";
		}
	};

	return (
		<div className="space-y-8 max-w-7xl mx-auto">
			{/* 1. Dashboard Header Banner: Single "+ Create Link" Button */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
				<div>
					<h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
						Welcome back, {user?.username || "there"}
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						High-velocity link redirection, real-time telemetry, and workspace performance.
					</p>
				</div>

				<div className="flex items-center gap-3 shrink-0">
					<Button
						onClick={() => onOpenCreateModal?.()}
						className="gap-2 text-xs sm:text-sm h-9 sm:h-10 px-4 font-semibold shadow-xs cursor-pointer"
					>
						<IconPlus className="size-4" />
						<span>Create Short Link</span>
					</Button>
				</div>
			</div>

			{/* 2. Overview Telemetry Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div className="space-y-1">
							<div className="text-xs font-medium text-muted-foreground">Total Short URLs</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
								{totalLinks}
							</div>
							<div className="text-[11px] text-emerald-500 font-medium">
								{activeLinks} active ({totalLinks > 0 ? Math.round((activeLinks / totalLinks) * 100) : 100}%)
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
							<IconLink className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div className="space-y-1">
							<div className="text-xs font-medium text-muted-foreground">Total Click Events</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
								{primaryAnalytics?.totalClicks ?? 0}
							</div>
							<div className="text-[11px] text-muted-foreground">
								Over 30-day monitoring window
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
							<IconChartBar className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div className="space-y-1">
							<div className="text-xs font-medium text-muted-foreground">Verified Human Traffic</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-500">
								{primaryAnalytics?.humanClicks ?? 0}
							</div>
							<div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
								{primaryAnalytics?.totalClicks
									? `${Math.round(((primaryAnalytics.humanClicks || 0) / primaryAnalytics.totalClicks) * 100)}% verified`
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
						<div className="space-y-1">
							<div className="text-xs font-medium text-muted-foreground">Automated Bots Filtered</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-amber-500">
								{primaryAnalytics?.botClicks ?? 0}
							</div>
							<div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
								{primaryAnalytics?.botPercentage ? `${primaryAnalytics.botPercentage}% bot ratio` : "0% bots"}
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
							<IconRobot className="size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 3. Top 4 Links with Mini Charts */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-base sm:text-lg font-heading font-semibold text-foreground flex items-center gap-2">
							<IconFlame className="size-4.5 text-amber-500" />
							<span>Top Performing Links</span>
						</h2>
						<p className="text-xs text-muted-foreground">
							Your highest-traffic short URLs and recent click velocity
						</p>
					</div>
					{urls.length > 4 && (
						<Link
							to={ROUTES.REDIRECT_LINKS}
							className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
						>
							<span>View all {urls.length} links</span>
							<IconArrowRight className="size-3.5" />
						</Link>
					)}
				</div>

				{top4Links.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{top4Links.map((url) => (
							<TopLinkCard key={url.id || url.shortCode} url={url} />
						))}
					</div>
				) : (
					<Card className="border-dashed border-border/80 bg-muted/20 p-8 text-center">
						<p className="text-xs sm:text-sm text-muted-foreground">
							No short URLs created yet. Click "+ Create Short Link" above to get started.
						</p>
					</Card>
				)}
			</div>

			{/* 4. Recent Links Table Overview */}
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-base sm:text-lg font-heading font-semibold text-foreground">
							Recent Short Links
						</h2>
						<p className="text-xs text-muted-foreground">
							Quickly access and copy recently generated redirect links
						</p>
					</div>

					<Link
						to={ROUTES.REDIRECT_LINKS}
						className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
					>
						<span>Manage all links</span>
						<IconArrowRight className="size-3.5" />
					</Link>
				</div>

				<Card className="border-border/70 bg-card overflow-hidden shadow-xs">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
									<th className="py-3 px-4">Shortcode</th>
									<th className="py-3 px-4 hidden sm:table-cell">Destination Target</th>
									<th className="py-3 px-4">Created</th>
									<th className="py-3 px-4">Status</th>
									<th className="py-3 px-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{recentLinks.length > 0 ? (
									recentLinks.map((url) => {
										const id = url.id || url.shortCode;
										return (
											<tr key={id} className="hover:bg-muted/30 transition-colors group">
												<td className="py-3 px-4">
													<div className="flex items-center gap-2">
														<span className="font-mono font-semibold text-foreground">
															/r/{url.shortCode}
														</span>
														<button
															onClick={() => handleCopy(url.shortCode, id)}
															className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
															title="Copy short link"
														>
															{copiedId === id ? (
																<IconCheck className="size-3.5 text-emerald-500" />
															) : (
																<IconCopy className="size-3.5" />
															)}
														</button>
													</div>
												</td>
												<td className="py-3 px-4 hidden sm:table-cell max-w-xs md:max-w-md truncate text-muted-foreground">
													<span title={url.destinationUrl}>{url.destinationUrl}</span>
												</td>
												<td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
													{formatDate(url.createdAt)}
												</td>
												<td className="py-3 px-4">
													<Badge
														variant="outline"
														className={`text-[10px] ${
															url.isActive !== false
																? "text-emerald-500 border-emerald-500/30"
																: "text-muted-foreground border-border"
														}`}
													>
														{url.isActive !== false ? "Active" : "Inactive"}
													</Badge>
												</td>
												<td className="py-3 px-4 text-right whitespace-nowrap">
													<div className="flex items-center justify-end gap-1.5">
														<Link
															to={`/analytics/${url.shortCode}`}
															className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
															title="View link analytics"
														>
															<IconChartBar className="size-3.5" />
														</Link>
														<a
															href={`http://localhost:8080/r/${url.shortCode}`}
															target="_blank"
															rel="noreferrer"
															className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
															title="Test redirect"
														>
															<IconExternalLink className="size-3.5" />
														</a>
													</div>
												</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan={5} className="py-8 text-center text-muted-foreground">
											No links created yet.
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

export default DashboardPage;
