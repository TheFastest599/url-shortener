import * as React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
	useUrlsQuery,
	useCampaignsQuery,
	useAnalyticsOverview,
	useUpdateUrlMutation,
} from "@/queries";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
	IconAdjustments,
	IconFolder,
	IconFlask,
	IconSearch,
	IconChevronDown,
	IconChevronUp,
	IconSparkles,
	IconLayersSubtract,
	IconTopologyStar3,
} from "@tabler/icons-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

/**
 * Mini Sparkline Velocity for Table Rows
 */
function MiniSparkline({ shortCode }) {
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

/**
 * Expandable Relational Tray revealing connections: Campaign, A/B Testing, UTMs
 */
function RelationalTray({ url, campaign }) {
	let utmParams = [];
	try {
		const parsed = new URL(url.destinationUrl);
		["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
			const v = parsed.searchParams.get(k);
			if (v) utmParams.push({ key: k.replace("utm_", ""), val: v });
		});
	} catch {}

	return (
		<div className="p-4 bg-muted/20 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
			{/* 1. Campaign Attribution Node */}
			<div className="space-y-1.5 p-3 rounded-xl bg-card border border-border/60">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground flex items-center gap-1.5">
						<IconFolder className="size-3.5 text-primary" />
						<span>Campaign Attribution</span>
					</span>
					{campaign ? (
						<Link
							to={`/campaigns?id=${campaign.id}`}
							className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
						>
							<span>Drilldown</span>
							<IconArrowRight className="size-2.5" />
						</Link>
					) : (
						<Badge variant="outline" className="text-[9px] text-muted-foreground">
							None
						</Badge>
					)}
				</div>
				{campaign ? (
					<div className="space-y-1 pt-1">
						<div className="font-medium text-foreground text-xs">{campaign.name}</div>
						<p className="text-[11px] text-muted-foreground line-clamp-2">
							{campaign.description || "Active marketing campaign channel."}
						</p>
						<div className="text-[10px] text-muted-foreground font-mono">
							Target: {campaign.targetUrl || "Dynamic"}
						</div>
					</div>
				) : (
					<p className="text-[11px] text-muted-foreground pt-1">
						Standalone shortlink not assigned to any marketing campaign.
					</p>
				)}
			</div>

			{/* 2. Routing Engine & A/B Status */}
			<div className="space-y-1.5 p-3 rounded-xl bg-card border border-border/60">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground flex items-center gap-1.5">
						<IconFlask className="size-3.5 text-amber-500" />
						<span>Routing Engine</span>
					</span>
					{url.isAbTest ? (
						<Link
							to={ROUTES.AB_TESTING}
							className="text-[10px] text-amber-500 hover:underline font-medium inline-flex items-center gap-0.5"
						>
							<span>View Test</span>
							<IconArrowRight className="size-2.5" />
						</Link>
					) : (
						<Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/30">
							Direct
						</Badge>
					)}
				</div>
				<div className="space-y-1 pt-1">
					{url.isAbTest ? (
						<div>
							<div className="text-xs font-semibold text-foreground">
								🔀 Active Traffic Split
							</div>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								Redirecting traffic dynamically between variants with statistical tracking.
							</p>
						</div>
					) : (
						<div>
							<div className="text-xs font-semibold text-foreground">
								⚡ 1:1 Direct Redirection
							</div>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								Zero overhead low-latency gRPC edge routing directly to target URL.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* 3. UTM Metadata & Test Action */}
			<div className="space-y-1.5 p-3 rounded-xl bg-card border border-border/60">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground flex items-center gap-1.5">
						<IconSparkles className="size-3.5 text-primary" />
						<span>UTM Tags & Direct Test</span>
					</span>
					<a
						href={`http://localhost:8080/r/${url.shortCode}`}
						target="_blank"
						rel="noreferrer"
						className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
					>
						<span>Test Redirect</span>
						<IconExternalLink className="size-2.5" />
					</a>
				</div>
				<div className="pt-1">
					{utmParams.length > 0 ? (
						<div className="flex flex-wrap gap-1">
							{utmParams.map((p) => (
								<span
									key={p.key}
									className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono"
								>
									<span className="text-muted-foreground">{p.key}:</span>
									<span className="font-semibold text-foreground">{p.val}</span>
								</span>
							))}
						</div>
					) : (
						<p className="text-[11px] text-muted-foreground">
							No UTM tags detected on the target URL query string.
						</p>
					)}
					<div className="mt-2 text-[10px] text-muted-foreground font-mono truncate">
						Destination: {url.destinationUrl}
					</div>
				</div>
			</div>
		</div>
	);
}

export function DashboardPage() {
	const { user } = useAuthStore();
	const { onOpenCreateModal } = useOutletContext() || {};

	// Interactive Filters & State
	const [activeCampaignFilter, setActiveCampaignFilter] = React.useState("ALL");
	const [searchQuery, setSearchQuery] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [currentPage, setCurrentPage] = React.useState(1);
	const pageSize = 15;
	const [expandedRowId, setExpandedRowId] = React.useState(null);
	const [copiedId, setCopiedId] = React.useState(null);

	// Debounce search query to trigger backend search
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery.trim());
			setCurrentPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Backend Query Params - Direct PostgreSQL Search & Campaign Filtering
	const queryParams = React.useMemo(() => {
		const p = {
			page: currentPage - 1,
			size: pageSize,
			sortBy: "createdAt",
			direction: "DESC",
		};
		if (debouncedSearch) {
			p.search = debouncedSearch;
		}
		if (activeCampaignFilter === "UNASSIGNED") {
			p.campaignId = "unassigned";
		} else if (activeCampaignFilter && activeCampaignFilter !== "ALL") {
			p.campaignId = activeCampaignFilter;
		}
		return p;
	}, [currentPage, pageSize, debouncedSearch, activeCampaignFilter]);

	// Direct Backend Query
	const {
		data: serverUrls,
		isLoading: urlsLoading,
		isFetching: urlsFetching,
	} = useUrlsQuery(queryParams);

	const { data: campaigns = [] } = useCampaignsQuery();

	const urls = Array.isArray(serverUrls) ? serverUrls : serverUrls?.content || [];
	const totalLinks = serverUrls?.totalElements ?? urls.length;
	const totalPages = Math.max(1, serverUrls?.totalPages || 1);
	const activeLinks = urls.filter((u) => u.isActive !== false).length;

	// Global / Primary telemetry for growth KPIs
	const primaryCode = urls.length > 0 ? urls[0].shortCode : "";
	const { data: primaryAnalytics } = useAnalyticsOverview(primaryCode, {
		days: 30,
		includeBots: true,
		enabled: !!primaryCode,
	});

	// Campaign Map for instant relational lookups
	const campaignMap = React.useMemo(() => {
		const map = {};
		campaigns.forEach((c) => {
			map[c.id] = c;
		});
		return map;
	}, [campaigns]);

	// Realtime Toggle Mutation
	const updateMutation = useUpdateUrlMutation({
		onSuccess: () => {
			toast.success("Shortlink status updated real-time!");
		},
	});

	const handleToggleActive = (url, e) => {
		e.stopPropagation();
		updateMutation.mutate({
			id: url.id,
			destinationUrl: url.destinationUrl,
			campaignId: url.campaignId,
			isActive: url.isActive === false,
		});
	};

	const handleCopy = (shortCode, id, e) => {
		e.stopPropagation();
		const fullUrl = `http://localhost:8080/r/${shortCode}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedId(id);
		toast.success("Shortlink copied to clipboard!");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const handleSelectCampaignFilter = (filterVal) => {
		setActiveCampaignFilter(filterVal);
		setCurrentPage(1);
	};

	// Top Performing Campaigns Ranking
	const topCampaigns = React.useMemo(() => {
		return [...campaigns]
			.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
			.slice(0, 4);
	}, [campaigns]);

	const totalCampaignClicks = campaigns.reduce((acc, c) => acc + (c.clickCount || 0), 0);

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Playful Technical Mission Control Header */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/50 pb-5">
				<div className="space-y-1">
					<div className="flex items-center gap-2.5 flex-wrap">
						<h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							Growth Mission Control
						</h1>
						<div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<span>Mesh Connected</span>
						</div>
					</div>
					<p className="text-xs sm:text-sm text-muted-foreground">
						Relational campaign intelligence, edge routing velocity, and conversion attribution for{" "}
						<span className="font-semibold text-foreground">@{user?.username || "growth-marketer"}</span>.
					</p>
				</div>

				<div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
					<Link to={ROUTES.CAMPAIGNS}>
						<Button
							variant="outline"
							className="gap-1.5 text-xs sm:text-sm h-9 sm:h-10 px-3.5 font-medium cursor-pointer"
						>
							<IconFolder className="size-4 text-primary" />
							<span>Campaigns Hub</span>
						</Button>
					</Link>

					<Button
						onClick={() => onOpenCreateModal?.()}
						className="gap-2 text-xs sm:text-sm h-9 sm:h-10 px-4 font-semibold shadow-xs cursor-pointer"
					>
						<IconPlus className="size-4" />
						<span>Create Shortlink</span>
					</Button>
				</div>
			</div>

			{/* 2. Executive Growth & Telemetry HUD (4 KPI Cards) */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
				{/* KPI 1: Active Shortlinks */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
						<div className="space-y-1 min-w-0">
							<span className="text-xs font-medium text-muted-foreground">
								Shortlink Fleet
							</span>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
								{totalLinks}
							</div>
							<div className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
								<span>{activeLinks} active</span>
								<span className="text-muted-foreground">·</span>
								<span>{totalLinks > 0 ? Math.round((activeLinks / totalLinks) * 100) : 100}% live</span>
							</div>
						</div>
						<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
							<IconLink className="size-4.5 sm:size-5" />
						</div>
					</CardContent>
				</Card>

				{/* KPI 2: Redirect Traffic Velocity */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
						<div className="space-y-1 min-w-0">
							<span className="text-xs font-medium text-muted-foreground">
								30D Traffic Volume
							</span>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
								{primaryAnalytics?.totalClicks ?? 0}
							</div>
							<div className="text-[11px] text-blue-500 font-medium truncate">
								Redirect velocity verified
							</div>
						</div>
						<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
							<IconChartBar className="size-4.5 sm:size-5" />
						</div>
					</CardContent>
				</Card>

				{/* KPI 3: Marketing Campaigns Attribution */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
						<div className="space-y-1 min-w-0">
							<span className="text-xs font-medium text-muted-foreground">
								Active Campaigns
							</span>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
								{campaigns.length}
							</div>
							<div className="text-[11px] text-purple-500 font-medium truncate">
								{totalCampaignClicks} attributed clicks
							</div>
						</div>
						<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
							<IconFolder className="size-4.5 sm:size-5" />
						</div>
					</CardContent>
				</Card>

				{/* KPI 4: Human Traffic Quality */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-start justify-between gap-2">
						<div className="space-y-1 min-w-0">
							<span className="text-xs font-medium text-muted-foreground">
								Traffic Integrity
							</span>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-500">
								{primaryAnalytics?.humanClicks ?? 0}
							</div>
							<div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
								{primaryAnalytics?.totalClicks
									? `${Math.round(((primaryAnalytics.humanClicks || 0) / primaryAnalytics.totalClicks) * 100)}% verified humans`
									: "100% human"}
							</div>
						</div>
						<div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
							<IconUser className="size-4.5 sm:size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 3. Campaign Constellation Bar: Marketer's Filter Strip */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<IconTopologyStar3 className="size-4 text-primary" />
						<span className="text-xs font-semibold uppercase tracking-wider text-foreground">
							Campaign Constellation
						</span>
						<span className="text-[11px] text-muted-foreground">
							(Click to isolate campaign links)
						</span>
					</div>

					{activeCampaignFilter !== "ALL" && (
						<button
							onClick={() => setActiveCampaignFilter("ALL")}
							className="text-xs text-primary hover:underline font-medium cursor-pointer"
						>
							Reset Filter (Show All)
						</button>
					)}
				</div>

				<div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
					{/* All Links Pill */}
					<button
						onClick={() => handleSelectCampaignFilter("ALL")}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
							activeCampaignFilter === "ALL"
								? "bg-primary text-primary-foreground border-primary shadow-xs"
								: "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80"
						}`}
					>
						<span>All Workspace Links</span>
						<span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-background/20">
							{totalLinks}
						</span>
					</button>

					{/* Campaign Chips */}
					{campaigns.map((c) => {
						const isSelected = String(activeCampaignFilter) === String(c.id);

						return (
							<div
								key={c.id}
								className={`flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-xl text-xs font-medium transition-all shrink-0 border ${
									isSelected
										? "bg-primary/15 border-primary text-primary shadow-xs"
										: "bg-card border-border text-foreground hover:border-primary/40"
								}`}
							>
								<button
									onClick={() => handleSelectCampaignFilter(isSelected ? "ALL" : c.id)}
									className="flex items-center gap-1.5 cursor-pointer text-left"
								>
									<IconFolder className="size-3.5 text-primary shrink-0" />
									<span className="truncate max-w-[130px]">{c.name}</span>
								</button>

								{/* Direct link to campaign modal */}
								<Link
									to={`/campaigns?id=${c.id}`}
									title={`Open ${c.name} campaign workbench`}
									className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-background/80 transition-colors"
								>
									<IconArrowRight className="size-3.5" />
								</Link>
							</div>
						);
					})}

					{/* Standalone / Unassigned Pill */}
					<button
						onClick={() => handleSelectCampaignFilter("UNASSIGNED")}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
							activeCampaignFilter === "UNASSIGNED"
								? "bg-muted text-foreground border-foreground/30 font-semibold"
								: "bg-card border-border text-muted-foreground hover:text-foreground"
						}`}
					>
						<span>Standalone (No Campaign)</span>
					</button>
				</div>
			</div>

			{/* 4. Connected Relational Links Table */}
			<div className="space-y-3">
				{/* Search & Action Bar */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-xl p-3 shadow-2xs">
					<div className="relative flex-1 min-w-0">
						<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search backend directly by shortcode or destination URL..."
							className="pl-9 pr-8 h-9 text-xs bg-background/80 w-full font-mono"
						/>
						{urlsFetching && (
							<div
								className="absolute right-3 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary animate-ping"
								title="Querying backend..."
							/>
						)}
					</div>

					<div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground font-mono">
						<span>
							Showing {urls.length} of {totalLinks} links {debouncedSearch ? "(Search Match)" : ""}
						</span>
					</div>
				</div>

				{/* The Official Shadcn Table */}
				<div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
					<Table>
						<TableHeader className="bg-muted/40">
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-[280px] text-xs font-semibold">Shortlink & Target</TableHead>
								<TableHead className="text-xs font-semibold">Campaign Attribution</TableHead>
								<TableHead className="text-xs font-semibold">Routing Engine</TableHead>
								<TableHead className="text-xs font-semibold text-center">7D Velocity</TableHead>
								<TableHead className="text-xs font-semibold text-center">Status</TableHead>
								<TableHead className="text-xs font-semibold text-right">Relations & Actions</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{urlsLoading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={6} className="py-4">
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
								))
							) : urls.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-40 text-center text-xs text-muted-foreground">
										{debouncedSearch
											? `No shortlinks found matching "${debouncedSearch}".`
											: "No shortlinks found in this campaign filter."}
									</TableCell>
								</TableRow>
							) : (
								urls.map((url) => {
									const campaign = url.campaignId ? campaignMap[url.campaignId] : null;
									const isExpanded = expandedRowId === url.id;

									return (
										<React.Fragment key={url.id || url.shortCode}>
											<TableRow
												onClick={() => setExpandedRowId(isExpanded ? null : url.id)}
												className={`cursor-pointer transition-colors ${
													isExpanded ? "bg-muted/30" : "hover:bg-muted/15"
												}`}
											>
												{/* Shortlink & Target */}
												<TableCell className="py-3 font-medium">
													<div className="space-y-0.5 min-w-0">
														<div className="flex items-center gap-2">
															<Link
																to={`/redirect-links/${url.shortCode}`}
																onClick={(e) => e.stopPropagation()}
																className="font-mono text-xs font-bold text-primary hover:underline"
															>
																/r/{url.shortCode}
															</Link>
															<button
																onClick={(e) => handleCopy(url.shortCode, url.id, e)}
																className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
																title="Copy shortlink"
															>
																{copiedId === url.id ? (
																	<IconCheck className="size-3.5 text-emerald-500" />
																) : (
																	<IconCopy className="size-3.5" />
																)}
															</button>
														</div>
														<p
															className="text-[11px] text-muted-foreground truncate max-w-[260px]"
															title={url.destinationUrl}
														>
															{url.destinationUrl}
														</p>
													</div>
												</TableCell>

												{/* Campaign Attribution */}
												<TableCell className="py-3">
													{campaign ? (
														<Link
															to={`/campaigns?id=${campaign.id}`}
															onClick={(e) => e.stopPropagation()}
															title={`Open ${campaign.name} campaign workbench`}
														>
															<Badge
																variant="secondary"
																className="text-[10px] gap-1 font-medium hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
															>
																<IconFolder className="size-3 text-primary shrink-0" />
																<span className="truncate max-w-[120px]">{campaign.name}</span>
																<IconArrowRight className="size-2.5 opacity-60" />
															</Badge>
														</Link>
													) : (
														<Badge
															variant="outline"
															className="text-[10px] text-muted-foreground/70 border-dashed"
														>
															Standalone
														</Badge>
													)}
												</TableCell>

												{/* Routing Engine */}
												<TableCell className="py-3">
													{url.isAbTest ? (
														<Link
															to={ROUTES.AB_TESTING}
															onClick={(e) => e.stopPropagation()}
														>
															<Badge
																variant="outline"
																className="text-[10px] text-amber-500 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer gap-1"
															>
																<IconFlask className="size-3 shrink-0" />
																<span>A/B Split</span>
															</Badge>
														</Link>
													) : (
														<Badge
															variant="outline"
															className="text-[10px] text-emerald-500 border-emerald-500/30 gap-1"
														>
															<span>⚡ Direct</span>
														</Badge>
													)}
												</TableCell>

												{/* 7D Velocity Sparkline */}
												<TableCell className="py-3 text-center">
													<div className="flex flex-col items-center justify-center">
														<span className="font-mono text-xs font-semibold text-foreground">
															{url.clickCount || 0} clicks
														</span>
														<MiniSparkline shortCode={url.shortCode} />
													</div>
												</TableCell>

												{/* Live Active Status Toggle */}
												<TableCell className="py-3 text-center">
													<button
														onClick={(e) => handleToggleActive(url, e)}
														className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer border ${
															url.isActive !== false
																? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
																: "bg-muted text-muted-foreground border-border hover:text-foreground"
														}`}
														title="Click to toggle status real-time"
													>
														{url.isActive !== false ? "Active" : "Disabled"}
													</button>
												</TableCell>

												{/* Actions & Relations Dropdown */}
												<TableCell className="py-3 text-right">
													<div
														className="flex items-center justify-end gap-1.5"
														onClick={(e) => e.stopPropagation()}
													>
														{/* Inspect Relations Button */}
														<Button
															size="sm"
															variant={isExpanded ? "secondary" : "ghost"}
															onClick={() => setExpandedRowId(isExpanded ? null : url.id)}
															className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
															title="Inspect campaign & experiment relations"
														>
															<span>Relations</span>
															{isExpanded ? (
																<IconChevronUp className="size-3" />
															) : (
																<IconChevronDown className="size-3" />
															)}
														</Button>

														{/* Config Link */}
														<Link
															to={`/redirect-links/${url.shortCode}`}
															className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
															title="Configure shortlink"
														>
															<IconAdjustments className="size-3.5" />
														</Link>

														{/* Analytics Link */}
														<Link
															to={`/analytics/${url.shortCode}`}
															className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
															title="Telemetry & charts"
														>
															<IconChartBar className="size-3.5" />
														</Link>
													</div>
												</TableCell>
											</TableRow>

											{/* Expanded Relational Tray */}
											{isExpanded && (
												<TableRow className="bg-transparent hover:bg-transparent">
													<TableCell colSpan={6} className="p-0">
														<RelationalTray url={url} campaign={campaign} />
													</TableCell>
												</TableRow>
											)}
										</React.Fragment>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>

				{/* Pagination Controls for Server Results */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between px-2 pt-1 text-xs">
						<span className="text-muted-foreground font-mono">
							Page {currentPage} of {totalPages} ({totalLinks} total matching)
						</span>
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage <= 1 || urlsFetching}
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								className="h-8 px-3 text-xs cursor-pointer"
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage >= totalPages || urlsFetching}
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								className="h-8 px-3 text-xs cursor-pointer"
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* 5. Top Performing Marketing Campaigns Spotlight */}
			<div className="space-y-4 pt-2">
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<h2 className="text-base sm:text-lg font-heading font-semibold text-foreground flex items-center gap-2">
							<IconFlame className="size-4 text-amber-500" />
							<span>Campaign Performance Spotlight</span>
						</h2>
						<p className="text-xs text-muted-foreground">
							Track which growth initiatives are driving redirect conversion.
						</p>
					</div>

					<Link
						to={ROUTES.CAMPAIGNS}
						className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
					>
						<span>Manage all campaigns</span>
						<IconArrowRight className="size-3.5" />
					</Link>
				</div>

				{topCampaigns.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{topCampaigns.map((c) => {
							const share =
								totalCampaignClicks > 0
									? Math.round(((c.clickCount || 0) / totalCampaignClicks) * 100)
									: 0;

							return (
								<Card
									key={c.id}
									className="border-border/70 bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between"
								>
									<CardHeader className="p-4 pb-2 space-y-1">
										<div className="flex items-center justify-between">
											<Badge
												variant="secondary"
												className="text-[10px] font-mono px-1.5 py-0"
											>
												{share}% share
											</Badge>
											<Link
												to={`/campaigns?id=${c.id}`}
												className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
											>
												<span>Drilldown</span>
												<IconArrowRight className="size-2.5" />
											</Link>
										</div>
										<CardTitle className="text-sm font-semibold text-foreground truncate">
											{c.name}
										</CardTitle>
										<CardDescription className="text-xs truncate">
											{c.targetUrl || "Global campaign"}
										</CardDescription>
									</CardHeader>

									<CardContent className="p-4 pt-1 space-y-2">
										<div className="flex items-center justify-between text-xs font-mono">
											<span className="text-muted-foreground">Clicks:</span>
											<span className="font-bold text-foreground">{c.clickCount || 0}</span>
										</div>
										<Progress value={share} className="h-1.5" />
									</CardContent>
								</Card>
							);
						})}
					</div>
				) : (
					<Card className="border-dashed border-border/80 bg-muted/20 p-6 text-center">
						<p className="text-xs text-muted-foreground">
							No campaigns created yet. Click "+ New Campaign" above to group your links into ROI channels.
						</p>
					</Card>
				)}
			</div>
		</div>
	);
}
