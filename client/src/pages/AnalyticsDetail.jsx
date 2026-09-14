import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useAnalyticsOverview, useUrlByIdQuery } from "@/queries";
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
import {
	IconBolt,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconAdjustments,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
	AnalyticsKpiCards,
	AnalyticsTimeSeriesChart,
	AnalyticsGeoCard,
	AnalyticsDeviceCard,
	AnalyticsReferrersCard,
} from "@/components/analytics";

/* Hallmark · page: Link Analytics Detail · decomposed into modular components */

export function AnalyticsDetailPage() {
	const params = useParams();
	const identifier = params.shortCode || params.id;
	const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(identifier || "");

	const { data: urlData } = useUrlByIdQuery(identifier, {
		enabled: isUuid && !!identifier,
	});

	const shortCode = isUuid ? urlData?.shortCode || "" : identifier;

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
		enabled: !!shortCode,
	});

	const fullShortUrl = `${window.location.origin}/r/${shortCode}`;

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
		const series = analytics?.timeSeries;
		if (!series) return [];
		return series.map((point) => {
			const rawDate = point.timestamp || "";
			let label = rawDate;
			try {
				const d = new Date(rawDate);
				if (days === 1) {
					label = d.toLocaleTimeString([], { hour: "numeric", hour12: true });
				} else {
					label = d.toLocaleDateString([], { month: "short", day: "numeric" });
				}
			} catch {
				/* ignore date parse error */
			}

			return {
				date: label,
				fullDate: rawDate,
				clicks: point.clicks,
				humanClicks: point.humanClicks ?? point.clicks,
				botClicks: point.botClicks ?? 0,
			};
		});
	}, [analytics, days]);

	const totalClicks = analytics?.totalClicks ?? 0;
	const humanClicks = analytics?.humanClicks ?? 0;
	const botClicks = analytics?.botClicks ?? 0;
	const uniqueVisitors = analytics?.uniqueVisitors ?? 0;

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Breadcrumbs & Quick Back */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
				<div className="space-y-1">
					<Breadcrumb>
						<BreadcrumbList className="text-xs">
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to={ROUTES.ANALYTICS}>Analytics</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage className="font-mono font-semibold text-foreground">
									/r/{shortCode}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
						<span>Telemetry & Traffic Attribution</span>
						<Badge variant="outline" className="font-mono text-xs">
							/r/{shortCode}
						</Badge>
					</h1>
				</div>

				{/* Quick Actions */}
				<div className="flex items-center gap-2 flex-wrap">
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopy}
						className="text-xs h-8.5 gap-1.5 cursor-pointer shadow-2xs"
					>
						{copied ? <IconCheck className="size-3.5 text-emerald-500" /> : <IconCopy className="size-3.5" />}
						<span>Copy Link</span>
					</Button>

					<a
						href={fullShortUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 px-3 h-8.5 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
					>
						<span>Open</span>
						<IconExternalLink className="size-3.5" />
					</a>

					<Button
						variant="outline"
						size="sm"
						onClick={handleSimulateClick}
						disabled={isSimulating}
						className="text-xs h-8.5 gap-1.5 cursor-pointer shadow-2xs text-amber-500 hover:text-amber-600 border-amber-500/30"
						title="Produce real Kafka click event"
					>
						<IconBolt className={`size-3.5 ${isSimulating ? "animate-spin" : ""}`} />
						<span>Simulate Hit</span>
					</Button>

					<Link to={`/redirect-links/${shortCode}`}>
						<Button size="sm" className="text-xs h-8.5 gap-1.5 font-semibold cursor-pointer shadow-xs">
							<IconAdjustments className="size-3.5" />
							<span>Configure</span>
						</Button>
					</Link>
				</div>
			</div>

			{/* 2. KPI Summary Cards */}
			<AnalyticsKpiCards
				totalClicks={totalClicks}
				humanClicks={humanClicks}
				botClicks={botClicks}
				uniqueVisitors={uniqueVisitors}
				isLoading={isLoading}
			/>

			{/* 3. Time Series Chart */}
			<AnalyticsTimeSeriesChart
				data={timeSeriesData}
				isLoading={isLoading}
				title={`Traffic Trend: /r/${shortCode}`}
				description="Time-series click frequency across selected resolution window."
				timeRangeDays={days}
				onTimeRangeChange={setDays}
			/>

			{/* 4. Deep Breakdown Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<AnalyticsGeoCard
					countries={analytics?.topCountries || []}
					totalClicks={totalClicks}
				/>
				<AnalyticsDeviceCard
					browsers={analytics?.topBrowsers || []}
					totalClicks={totalClicks}
				/>
				<AnalyticsReferrersCard
					referrers={analytics?.topReferrers || []}
					totalClicks={totalClicks}
				/>
			</div>
		</div>
	);
}

export default AnalyticsDetailPage;
