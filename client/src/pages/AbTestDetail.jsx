import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	EditAbTestModal,
	PromoteWinnerDialog,
	DeleteAbTestDialog,
	AbTestAnalyticsModal,
} from "@/components/ab-testing";
import {
	IconFlask,
	IconArrowLeft,
	IconPencil,
	IconTrash,
	IconTrophy,
	IconChartBar,
	IconPlayerPause,
	IconPlayerPlay,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconUsers,
	IconMouse,
	IconPercentage,
} from "@tabler/icons-react";
import { toast } from "sonner";

/* Hallmark · page: Dedicated A/B Experiment Details & Telemetry Workbench */

export function AbTestDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	const days = 30;
	const includeBots = false;
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	// 1. Fetch Experiment by ID
	const {
		data: experiment,
		isLoading: isExpLoading,
		error: expError,
	} = useAbTestByIdQuery(id);

	// 2. Fetch Aggregate A/B Analytics
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
	const variantStats = analytics?.variantStats || {};

	// Aggregate clicks
	const totalClicks =
		analytics?.totalClicks ??
		Object.values(variantStats).reduce((sum, s) => sum + (s.totalClicks || 0), 0);
	const humanClicks = analytics?.humanClicks ?? 0;

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

					<Button
						variant="outline"
						size="sm"
						onClick={() => setAnalyticsModalOpen(true)}
						className="text-xs gap-1.5 shadow-2xs cursor-pointer"
					>
						<IconChartBar className="size-3.5 text-primary" />
						<span>Telemetry</span>
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

			{/* 2. Key Metrics HUD */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Total Routed</p>
							<p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
								{isAnalyticsLoading ? <Skeleton className="h-7 w-16" /> : totalClicks.toLocaleString()}
							</p>
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
							<p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-500 mt-0.5">
								{isAnalyticsLoading ? <Skeleton className="h-7 w-16" /> : humanClicks.toLocaleString()}
							</p>
							<p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Verified organic</p>
						</div>
						<div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
							<IconUsers className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Variants</p>
							<p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
								{variants.length}
							</p>
							<p className="text-[10px] text-muted-foreground mt-0.5">Active split targets</p>
						</div>
						<div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
							<IconPercentage className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Cookie TTL</p>
							<p className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
								{Math.round((experiment.cookieTtlSeconds || 2592000) / 86400)}d
							</p>
							<p className="text-[10px] text-muted-foreground mt-0.5">User stickiness</p>
						</div>
						<div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
							<IconFlask className="size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 3. Traffic Ratio Visualizer */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardHeader className="p-5 pb-3">
					<CardTitle className="text-sm font-semibold flex items-center justify-between">
						<span>Traffic Distribution Ratio</span>
						<span className="text-xs font-mono text-muted-foreground">
							Total Allocated: {variants.reduce((sum, v) => sum + (v.weight || 0), 0)}%
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-5 pt-0 space-y-2">
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

					<div className="flex items-center gap-4 text-xs font-medium pt-1 flex-wrap">
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
									<span className="font-mono text-muted-foreground">{v.weight}%</span>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* 4. Variants Breakdown Cards */}
			<div className="space-y-4">
				<h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
					<span>Configured Destinations & Variant Performance</span>
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{variants.map((v) => {
						const stat = variantStats[v.key];
						const clicks = stat?.totalClicks || 0;
						const conversionPct =
							totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;
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
											<p className="font-mono text-sm font-bold text-foreground mt-0.5">
												{clicks.toLocaleString()}
											</p>
										</div>
										<div>
											<span className="text-muted-foreground text-[11px]">Click Share:</span>
											<p className="font-mono text-sm font-bold text-primary mt-0.5">
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

			{/* 5. Modals */}
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

			<AbTestAnalyticsModal
				experiment={experiment}
				open={analyticsModalOpen}
				onOpenChange={setAnalyticsModalOpen}
			/>
		</div>
	);
}

export default AbTestDetailPage;
