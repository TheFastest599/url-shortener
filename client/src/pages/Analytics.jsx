import * as React from "react";
import { Link } from "react-router-dom";
import { useUrlsQuery, useAnalyticsOverview } from "@/queries";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { IconChartBar, IconFolder, IconFlask } from "@tabler/icons-react";

import {
	AnalyticsKpiCards,
	AnalyticsTimeSeriesChart,
	AnalyticsGeoCard,
	AnalyticsDeviceCard,
	AnalyticsReferrersCard,
	AnalyticsLeaderboard,
} from "@/components/analytics";

/* Hallmark · page: Analytics Hub · decomposed into modular components */

export function AnalyticsPage() {
	const [timeRangeDays, setTimeRangeDays] = React.useState(30);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery.trim());
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Fetch current page of user short URLs (limited to 10)
	const { data: serverUrls, isLoading: urlsLoading } = useUrlsQuery({
		page: 0,
		size: 10,
		search: debouncedSearch || undefined,
		sortBy: "createdAt",
		direction: "DESC",
	});

	const urls = React.useMemo(() => {
		return Array.isArray(serverUrls) ? serverUrls : serverUrls?.content || [];
	}, [serverUrls]);

	const selectedCode = urls[0]?.shortCode || "";

	const { data: topAnalytics, isLoading: analyticsLoading } = useAnalyticsOverview(
		selectedCode,
		{
			days: timeRangeDays,
			includeBots: true,
			enabled: !!selectedCode,
		}
	);

	// Total clicks on current page items
	const totalWorkspaceClicks = React.useMemo(() => {
		return urls.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);
	}, [urls]);

	const filteredUrls = urls;

	// Format time-series chart data
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

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Header Banner */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
				<div>
					<h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
						<IconChartBar className="size-7 text-primary" />
						<span>Unified Telemetry & Analytics Hub</span>
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						Real-time Kafka clickstream aggregation, bot filtering, and attribution performance across your workspace.
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Link to={ROUTES.CAMPAIGNS}>
						<Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 font-medium cursor-pointer shadow-2xs">
							<IconFolder className="size-3.5 text-primary" />
							<span>Campaigns</span>
						</Button>
					</Link>
					<Link to={ROUTES.AB_TESTING}>
						<Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 font-medium cursor-pointer shadow-2xs">
							<IconFlask className="size-3.5 text-amber-500" />
							<span>A/B Tests</span>
						</Button>
					</Link>
				</div>
			</div>

			{/* 2. Workspace Summary KPIs */}
			<AnalyticsKpiCards
				totalClicks={totalWorkspaceClicks}
				humanClicks={topAnalytics?.humanClicks ?? totalWorkspaceClicks}
				botClicks={topAnalytics?.botClicks ?? 0}
				uniqueVisitors={topAnalytics?.uniqueVisitors ?? 0}
				isLoading={urlsLoading || analyticsLoading}
			/>

			{/* 3. Primary Traffic Velocity Chart */}
			<AnalyticsTimeSeriesChart
				data={timeSeriesData}
				isLoading={analyticsLoading}
				title={`Traffic Velocity: ${selectedCode ? `/r/${selectedCode}` : "Workspace"}`}
				description={`Daily redirect request distribution with bot detection for top link /r/${selectedCode || "-"}.`}
				timeRangeDays={timeRangeDays}
				onTimeRangeChange={setTimeRangeDays}
			/>

			{/* 4. Deep Breakdown Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<AnalyticsGeoCard
					countries={topCountries}
					totalClicks={topAnalytics?.totalClicks || totalWorkspaceClicks}
				/>
				<AnalyticsDeviceCard
					browsers={topBrowsers}
					totalClicks={topAnalytics?.totalClicks || totalWorkspaceClicks}
				/>
				<AnalyticsReferrersCard
					referrers={topReferrers}
					totalClicks={topAnalytics?.totalClicks || totalWorkspaceClicks}
				/>
			</div>

			{/* 5. Shortlink Leaderboard */}
			<AnalyticsLeaderboard
				urls={filteredUrls}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
			/>
		</div>
	);
}

export default AnalyticsPage;
