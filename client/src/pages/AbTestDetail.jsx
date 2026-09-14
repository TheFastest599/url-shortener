import * as React from "react";
import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
	useAbTestByIdQuery,
	useAbTestAnalyticsQuery,
	useUpdateAbTestStatusByIdMutation,
	useDeleteAbTestByIdMutation,
} from "@/queries/abTestingQueries";
import { ROUTES } from "@/routes/paths";
import { getShortUrl } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EditAbTestModal,
	PromoteWinnerDialog,
	DeleteAbTestDialog,
} from "@/components/ab-testing";
import {
	AnalyticsTimeSeriesChart,
	AnalyticsGeoCard,
	AnalyticsDeviceCard,
	AnalyticsReferrersCard,
} from "@/components/analytics";
import {
	IconFlask,
	IconArrowLeft,
	IconPencil,
	IconTrash,
	IconTrophy,
	IconPlayerPause,
	IconPlayerPlay,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconUsers,
	IconMouse,
	IconPercentage,
	IconRobot,
	IconDeviceDesktop,
} from "@tabler/icons-react";
import { toast } from "sonner";

/* Hallmark · page: Dedicated A/B Experiment Details & Telemetry Workbench */

export function AbTestDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [days, setDays] = useState(30);
	const [includeBots, setIncludeBots] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	// 1. Fetch Experiment by ID
	const {
		data: experiment,
		isLoading: isExpLoading,
		error: expError,
	} = useAbTestByIdQuery(id);

	// 2. Fetch Aggregate A/B Analytics directly for inline telemetry
	const {
		data: analytics,
		isLoading: isAnalyticsLoading,
	} = useAbTestAnalyticsQuery(
		experiment?.id || id,
		{ days, includeBots },
		{ enabled: !!id }
	);

	// 3. Status Mutation (Pause / Resume)
	const statusMutation = useUpdateAbTestStatusByIdMutation({
		onSuccess: (updated) => {
			toast.success(`A/B Test is now ${updated?.status || "updated"}`);
		},
	});

	// 4. Delete Mutation
	const deleteMutation = useDeleteAbTestByIdMutation({
		onSuccess: () => {
			setDeleteDialogOpen(false);
			toast.success("A/B experiment removed");
			navigate(ROUTES.AB_TESTING);
		},
	});

	const handleCopy = () => {
		if (!experiment?.shortCode) return;
		const full = getShortUrl(experiment.shortCode);
		navigator.clipboard.writeText(full);
		setCopied(true);
		toast.success("Experiment shortlink copied");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleTogglePause = () => {
		if (!experiment) return;
		const nextStatus = experiment.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
		statusMutation.mutate({ id: experiment.id, payload: { status: nextStatus } });
	};

	// Map variant performance breakdown from backend DTO (variantBreakdown: [{ name, count, percentage }])
	const variantStats = useMemo(() => {
		const map = {};
		if (Array.isArray(analytics?.variantBreakdown)) {
			analytics.variantBreakdown.forEach((vb) => {
				const key = vb.name || vb.key || vb.variantKey;
				if (key) {
					map[key] = {
						totalClicks: vb.count ?? vb.clicks ?? vb.totalClicks ?? 0,
						percentage: vb.percentage ?? 0,
					};
				}
			});
		} else if (analytics?.variantStats && typeof analytics.variantStats === "object") {
			Object.entries(analytics.variantStats).forEach(([k, val]) => {
				map[k] = {
					totalClicks: typeof val === "number" ? val : val?.totalClicks ?? val?.count ?? 0,
					percentage: val?.percentage ?? 0,
				};
			});
		} else if (analytics?.variantSplit && typeof analytics.variantSplit === "object") {
			Object.entries(analytics.variantSplit).forEach(([k, val]) => {
				map[k] = {
					totalClicks: typeof val === "number" ? val : val?.totalClicks ?? val?.clicks ?? val?.count ?? 0,
					percentage: val?.percentage ?? 0,
				};
			});
		}
		return map;
	}, [analytics]);

	// Aggregate clicks
	const totalClicks =
		analytics?.totalClicks ??
		Object.values(variantStats).reduce((sum, s) => sum + (s.totalClicks || 0), 0);
	const humanClicks = analytics?.humanClicks ?? 0;
	const botClicks = analytics?.botClicks ?? 0;
	const humanPct = totalClicks > 0 ? Math.round((humanClicks / totalClicks) * 100) : 100;
	const botPct = totalClicks > 0 ? Math.round((botClicks / totalClicks) * 100) : 0;

	// Format time-series points
	const timeSeriesData = useMemo(() => {
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

	if (isExpLoading) {
		return (
			<div className="space-y-6 max-w-6xl mx-auto">
				<Skeleton className="h-10 w-48 rounded-lg" />
				<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-96 rounded-xl" />
			</div>
		);
	}

	if (expError || !experiment) {
		return (
			<div className="p-12 text-center max-w-md mx-auto space-y-4">
				<div className="size-12 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
					<IconFlask className="size-6" />
				</div>
				<h2 className="font-heading text-lg font-bold text-foreground">
					A/B Experiment Not Found
				</h2>
				<p className="text-xs text-muted-foreground">
					The requested split experiment does not exist or has been deleted.
				</p>
				<Button
					onClick={() => navigate(ROUTES.AB_TESTING)}
					variant="outline"
					size="sm"
					className="cursor-pointer gap-1.5"
				>
					<IconArrowLeft className="size-3.5" />
					<span>Back to A/B Experiments</span>
				</Button>
			</div>
		);
	}

	const isConcluded = experiment.status === "CONCLUDED";
	const isRunning = experiment.status === "ACTIVE";
	const variants = experiment.variants || [];

	return (
		<div className="space-y-6 max-w-6xl mx-auto">
			{/* 1. Header & Actions */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Link
							to={ROUTES.AB_TESTING}
							className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer mr-1"
						>
							<IconArrowLeft className="size-3.5" />
							<span>A/B Experiments</span>
						</Link>
						<span className="text-muted-foreground/50">/</span>
						<Badge
							variant="outline"
							className={`text-[10px] font-mono capitalize ${
								isRunning
									? "text-emerald-500 border-emerald-500/30"
									: isConcluded
									? "text-blue-500 border-blue-500/30"
									: "text-amber-500 border-amber-500/30"
							}`}
						>
							{experiment.status || "Draft"}
						</Badge>
					</div>

					<h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
						<IconFlask className="size-6 text-primary shrink-0" />
						<span>{experiment.name || `Experiment /r/${experiment.shortCode}`}</span>
					</h1>

					<div className="flex items-center gap-2 pt-0.5">
						<span className="text-xs text-muted-foreground">Routing Shortlink:</span>
						<div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-primary">
							<span>/r/{experiment.shortCode}</span>
							<button
								type="button"
								onClick={handleCopy}
								className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
								title="Copy routing shortlink"
							>
								{copied ? (
									<IconCheck className="size-3.5 text-emerald-500" />
								) : (
									<IconCopy className="size-3.5" />
								)}
							</button>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.open(getShortUrl(experiment.shortCode), "_blank")}
						className="text-xs gap-1.5 shadow-2xs cursor-pointer"
					>
						<IconExternalLink className="size-3.5" />
						<span>Test Split</span>
					</Button>

					{!isConcluded && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleTogglePause}
							disabled={statusMutation.isPending}
							className="text-xs gap-1.5 shadow-2xs cursor-pointer"
						>
							{isRunning ? (
								<>
									<IconPlayerPause className="size-3.5 text-amber-500" />
									<span>Pause</span>
								</>
							) : (
								<>
									<IconPlayerPlay className="size-3.5 text-emerald-500" />
									<span>Resume</span>
								</>
							)}
						</Button>
					)}

					{!isConcluded && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPromoteDialogOpen(true)}
							className="text-xs gap-1.5 shadow-2xs text-amber-500 hover:bg-amber-500/10 border-amber-500/30 cursor-pointer"
						>
							<IconTrophy className="size-3.5" />
							<span>Promote Winner</span>
						</Button>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={() => setEditModalOpen(true)}
						className="text-xs gap-1.5 shadow-2xs cursor-pointer"
					>
						<IconPencil className="size-3.5" />
						<span>Edit</span>
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setDeleteDialogOpen(true)}
						className="text-xs gap-1.5 shadow-2xs text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
					>
						<IconTrash className="size-3.5" />
						<span>Delete</span>
					</Button>
				</div>
			</div>

			{/* 2. Inline Telemetry Resolution & Filter Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border/70 bg-card shadow-xs text-xs">
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium text-muted-foreground">Analytics Resolution:</span>
					<div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/60">
						{[7, 30, 90].map((d) => (
							<button
								key={d}
								type="button"
								onClick={() => setDays(d)}
								className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
									days === d
										? "bg-primary text-primary-foreground font-semibold shadow-2xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{d}d
							</button>
						))}
					</div>
				</div>

				<label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
					<input
						type="checkbox"
						checked={includeBots}
						onChange={(e) => setIncludeBots(e.target.checked)}
						className="rounded border-border text-primary size-3.5 cursor-pointer"
					/>
					<span>Include Bot Traffic</span>
				</label>
			</div>

			{/* 3. Key Metrics HUD */}
			<div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Total Routed</p>
							<div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
								{isAnalyticsLoading ? <Skeleton className="h-7 w-16" /> : totalClicks.toLocaleString()}
							</div>
							<p className="text-[10px] text-muted-foreground mt-0.5">Redirect requests</p>
						</div>
						<div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
							<IconMouse className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Human Traffic</p>
							<div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-500 mt-0.5">
								{isAnalyticsLoading ? <Skeleton className="h-7 w-16" /> : humanClicks.toLocaleString()}
							</div>
							<p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{humanPct}% organic</p>
						</div>
						<div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
							<IconUsers className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Automated Bots</p>
							<div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-500 mt-0.5">
								{isAnalyticsLoading ? <Skeleton className="h-7 w-16" /> : botClicks.toLocaleString()}
							</div>
							<p className="text-[10px] text-muted-foreground mt-0.5">{botPct}% filtered</p>
						</div>
						<div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
							<IconRobot className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Variants</p>
							<div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
								{variants.length}
							</div>
							<p className="text-[10px] text-muted-foreground mt-0.5">Active split targets</p>
						</div>
						<div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
							<IconPercentage className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs col-span-2 sm:col-span-1">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Cookie TTL</p>
							<div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
								{Math.round((experiment.cookieTtlSeconds || 2592000) / 86400)}d
							</div>
							<p className="text-[10px] text-muted-foreground mt-0.5">User stickiness</p>
						</div>
						<div className="size-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
							<IconFlask className="size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 4. Traffic Ratio Visualizer */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardHeader className="p-5 pb-3">
					<CardTitle className="text-sm font-semibold flex items-center justify-between">
						<span>Traffic Distribution Ratio</span>
						<span className="text-xs font-mono text-muted-foreground">
							Total Allocated: {variants.reduce((sum, v) => sum + (v.weight || 0), 0)}%
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-5 pt-0 space-y-3">
					<div className="h-4 w-full rounded-full overflow-hidden flex bg-muted border border-border/50">
						{variants.map((v, i) => {
							const colorClass =
								i === 0
									? "bg-primary"
									: i === 1
									? "bg-blue-500"
									: i === 2
									? "bg-purple-500"
									: "bg-emerald-500";
							return (
								<div
									key={v.key}
									style={{ width: `${v.weight}%` }}
									className={`h-full ${colorClass} transition-all`}
									title={`Variant ${v.key}: ${v.weight}%`}
								/>
							);
						})}
					</div>

					<div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
						<div className="flex items-center gap-4 flex-wrap">
							{variants.map((v, i) => {
								const dotColor =
									i === 0
										? "bg-primary"
										: i === 1
										? "bg-blue-500"
										: i === 2
										? "bg-purple-500"
										: "bg-emerald-500";
								return (
									<div key={v.key} className="flex items-center gap-1.5">
										<span className={`size-2.5 rounded-full ${dotColor}`} />
										<span className="font-semibold text-foreground">Variant {v.key}:</span>
										<span className="font-mono text-muted-foreground">{v.weight}% configured</span>
									</div>
								);
							})}
						</div>

						<div className="text-xs font-mono text-muted-foreground">
							Observed:{" "}
							{variants.map((v) => {
								const stat = variantStats[v.key] || variantStats[v.name];
								const pct = stat?.percentage !== undefined ? Math.round(stat.percentage) : 0;
								return `${v.key}: ${pct}% (${stat?.totalClicks ?? 0})`;
							}).join(" · ")}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 5. Variants Breakdown Cards */}
			<div className="space-y-4">
				<h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
					<span>Configured Destinations & Variant Performance</span>
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{variants.map((v) => {
						const stat = variantStats[v.key] || variantStats[v.name] || variantStats[v.id];
						const clicks = stat?.totalClicks ?? 0;
						const conversionPct =
							stat?.percentage !== undefined
								? Math.round(stat.percentage)
								: totalClicks > 0
								? Math.round((clicks / totalClicks) * 100)
								: 0;
						const isWinner =
							experiment.winnerVariantKey === v.key ||
							experiment.winningVariantKey === v.key;

						return (
							<Card
								key={v.key}
								className={`border bg-card shadow-xs transition-colors ${
									isWinner
										? "border-amber-500/60 bg-amber-500/5 dark:bg-amber-500/10"
										: "border-border/70"
								}`}
							>
								<CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge
											variant={isWinner ? "default" : "secondary"}
											className={isWinner ? "bg-amber-500 text-white font-bold" : ""}
										>
											Variant {v.key}
										</Badge>
										{isWinner && (
											<Badge
												variant="outline"
												className="text-[10px] text-amber-500 border-amber-500/40 gap-1"
											>
												<IconTrophy className="size-3" />
												<span>Winner</span>
											</Badge>
										)}
									</div>
									<span className="font-mono text-xs font-semibold text-foreground">
										{v.weight}% Traffic Weight
									</span>
								</CardHeader>

								<CardContent className="p-5 pt-0 space-y-4">
									<div className="space-y-1">
										<span className="text-xs text-muted-foreground">Destination Target URL:</span>
										<a
											href={v.destinationUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs font-mono text-primary hover:underline break-all block flex items-center gap-1"
										>
											<span>{v.destinationUrl}</span>
											<IconExternalLink className="size-3 shrink-0 opacity-60" />
										</a>
									</div>

									<div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
										<div>
											<span className="text-muted-foreground text-[11px]">Clicks:</span>
											<p className="font-mono text-base font-bold text-foreground mt-0.5">
												{clicks.toLocaleString()}
											</p>
										</div>
										<div>
											<span className="text-muted-foreground text-[11px]">Click Share:</span>
											<p className="font-mono text-base font-bold text-primary mt-0.5">
												{conversionPct}%
											</p>
										</div>
									</div>

									{!isConcluded && !isWinner && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPromoteDialogOpen(true)}
											className="w-full text-xs gap-1.5 shadow-2xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 cursor-pointer mt-2"
										>
											<IconTrophy className="size-3.5" />
											<span>Promote Variant {v.key} as Winner</span>
										</Button>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>

			{/* 6. Telemetry Time Series Trend */}
			{analytics?.timeSeries && analytics.timeSeries.length > 0 && (
				<AnalyticsTimeSeriesChart
					data={timeSeriesData}
					isLoading={isAnalyticsLoading}
					title={`Traffic Trend: /r/${experiment.shortCode}`}
					description={`Time-series click velocity across past ${days} days.`}
					timeRangeDays={days}
					onTimeRangeChange={setDays}
				/>
			)}

			{/* 7. Telemetry Deep Breakdown: Geo, Devices, Referrers */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-xs font-semibold flex items-center justify-between">
							<span>Device Types</span>
							<IconDeviceDesktop className="size-3.5 text-primary" />
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-1 space-y-2 text-xs">
						{(analytics?.topDevices && analytics.topDevices.length > 0) ? (
							analytics.topDevices.map((d) => (
								<div key={d.name} className="flex items-center justify-between">
									<span className="text-muted-foreground truncate">{d.name || "Desktop"}</span>
									<span className="font-mono font-semibold">{d.count}</span>
								</div>
							))
						) : (
							<span className="text-muted-foreground text-[11px]">No device telemetry yet</span>
						)}
					</CardContent>
				</Card>
			</div>

			{/* 8. Modals (Edit, Promote Winner, Delete only - No Telemetry Modal) */}
			<EditAbTestModal
				experiment={experiment}
				open={editModalOpen}
				onOpenChange={setEditModalOpen}
			/>

			<PromoteWinnerDialog
				experiment={experiment}
				open={promoteDialogOpen}
				onOpenChange={setPromoteDialogOpen}
			/>

			<DeleteAbTestDialog
				experiment={experiment}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={() => deleteMutation.mutate(experiment.id)}
				isDeleting={deleteMutation.isPending}
			/>
		</div>
	);
}

export default AbTestDetailPage;
