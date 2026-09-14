import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
	useCampaignQuery,
	useCampaignUrlsQuery,
	useCampaignAnalyticsQuery,
	useUpdateCampaignMutation,
	useDeleteCampaignMutation,
} from "@/queries/campaignQueries";
import { useUpdateUrlMutation } from "@/queries/urlQueries";
import { queryKeys } from "@/queries/queryKeys";
import { ROUTES } from "@/routes/paths";
import { getShortUrl } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import {
	EditCampaignModal,
	DeleteCampaignDialog,
	CampaignAnalyticsModal,
} from "@/components/campaigns";
import {
	IconFolder,
	IconArrowLeft,
	IconPencil,
	IconTrash,
	IconChartBar,
	IconLink,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconMouse,
	IconUsers,
	IconRobot,
	IconCalendar,
} from "@tabler/icons-react";
import { toast } from "sonner";

/* Hallmark · page: Dedicated Campaign Details & Telemetry Workbench */

export function CampaignDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [days, setDays] = useState(30);
	const includeBots = false;
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
	const [copiedShortCode, setCopiedShortCode] = useState(null);

	// 1. Fetch Campaign Metadata
	const {
		data: campaign,
		isLoading: isCampaignLoading,
		error: campaignError,
	} = useCampaignQuery(id);

	// 2. Fetch URLs Assigned to This Campaign
	const {
		data: urls = [],
		isLoading: isUrlsLoading,
	} = useCampaignUrlsQuery(id);

	// 3. Fetch Aggregate Campaign Analytics
	const {
		data: analytics,
		isLoading: isAnalyticsLoading,
	} = useCampaignAnalyticsQuery(id, { days, includeBots });

	// 4. Mutations
	const updateMutation = useUpdateCampaignMutation({
		onSuccess: () => {
			setEditModalOpen(false);
		},
	});

	const deleteMutation = useDeleteCampaignMutation({
		onSuccess: () => {
			setDeleteDialogOpen(false);
			navigate(ROUTES.CAMPAIGNS);
		},
	});

	const toggleUrlMutation = useUpdateUrlMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.urls(id) });
			toast.success("Shortlink status updated");
		},
	});

	const handleCopy = (shortCode) => {
		const full = getShortUrl(shortCode);
		navigator.clipboard.writeText(full);
		setCopiedShortCode(shortCode);
		toast.success("Shortlink copied to clipboard");
		setTimeout(() => setCopiedShortCode(null), 2000);
	};

	const handleToggleUrlActive = (url, e) => {
		e.stopPropagation();
		toggleUrlMutation.mutate({
			id: url.id,
			destinationUrl: url.destinationUrl,
			campaignId: url.campaignId,
			isActive: url.isActive === false,
		});
	};

	if (isCampaignLoading) {
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

	if (campaignError || !campaign) {
		return (
			<div className="p-12 text-center max-w-md mx-auto space-y-4">
				<div className="size-12 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
					<IconFolder className="size-6" />
				</div>
				<h2 className="font-heading text-lg font-bold text-foreground">
					Campaign Not Found
				</h2>
				<p className="text-xs text-muted-foreground">
					The requested marketing campaign does not exist or has been removed.
				</p>
				<Button
					onClick={() => navigate(ROUTES.CAMPAIGNS)}
					variant="outline"
					size="sm"
					className="cursor-pointer gap-1.5"
				>
					<IconArrowLeft className="size-3.5" />
					<span>Back to Campaigns</span>
				</Button>
			</div>
		);
	}

	const totalClicks = analytics?.totalClicks ?? 0;
	const humanClicks = analytics?.humanClicks ?? 0;
	const botClicks = analytics?.botClicks ?? 0;
	const humanPercentage = totalClicks > 0 ? Math.round((humanClicks / totalClicks) * 100) : 100;
	const linkAttribution = analytics?.linkBreakdown || [];

	return (
		<div className="space-y-6 max-w-6xl mx-auto">
			{/* 1. Page Header & Action Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Link
							to={ROUTES.CAMPAIGNS}
							className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer mr-1"
						>
							<IconArrowLeft className="size-3.5" />
							<span>Campaigns</span>
						</Link>
						<span className="text-muted-foreground/50">/</span>
						<Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
							Folder
						</Badge>
					</div>
					<h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
						<IconFolder className="size-6 text-primary shrink-0" />
						<span>{campaign.name}</span>
					</h1>
					{campaign.description && (
						<p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
							{campaign.description}
						</p>
					)}
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setAnalyticsModalOpen(true)}
						className="text-xs gap-1.5 shadow-2xs cursor-pointer"
					>
						<IconChartBar className="size-3.5 text-primary" />
						<span>Analytics Modal</span>
					</Button>
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

			{/* 2. Key Telemetry KPI HUD */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Total Clicks</p>
							<div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
								{isAnalyticsLoading ? <Skeleton className="h-7 w-16" /> : totalClicks.toLocaleString()}
							</div>
							<p className="text-[10px] text-muted-foreground mt-0.5">Last {days} days</p>
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
							<p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
								{humanPercentage}% organic
							</p>
						</div>
						<div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
							<IconUsers className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Bot / Scraper</p>
							<div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-500 mt-0.5">
								{isAnalyticsLoading ? <Skeleton className="h-7 w-16" /> : botClicks.toLocaleString()}
							</div>
							<p className="text-[10px] text-muted-foreground mt-0.5">Filtered automations</p>
						</div>
						<div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
							<IconRobot className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<p className="text-[11px] font-medium text-muted-foreground">Assigned URLs</p>
							<div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">
								{isUrlsLoading ? <Skeleton className="h-7 w-16" /> : urls.length}
							</div>
							<p className="text-[10px] text-muted-foreground mt-0.5">Active routing nodes</p>
						</div>
						<div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
							<IconLink className="size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 3. Campaign Metadata & Attribution Overview */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Campaign Meta Card */}
				<Card className="border-border/70 bg-card shadow-xs md:col-span-1">
					<CardHeader className="p-5 pb-3">
						<CardTitle className="text-sm font-semibold flex items-center gap-2">
							<IconFolder className="size-4 text-primary" />
							<span>Campaign Information</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-5 pt-0 space-y-4 text-xs">
						<div className="space-y-1">
							<span className="text-muted-foreground">Campaign Name</span>
							<p className="font-semibold text-foreground">{campaign.name}</p>
						</div>

						{campaign.description && (
							<div className="space-y-1">
								<span className="text-muted-foreground">Description</span>
								<p className="text-foreground leading-relaxed">{campaign.description}</p>
							</div>
						)}

						<div className="space-y-1">
							<span className="text-muted-foreground">Created At</span>
							<p className="font-mono text-foreground flex items-center gap-1.5">
								<IconCalendar className="size-3.5 text-muted-foreground" />
								<span>{new Date(campaign.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
							</p>
						</div>

						<div className="space-y-1">
							<span className="text-muted-foreground">Campaign Identifier</span>
							<div className="font-mono text-[11px] bg-muted/40 p-2 rounded-md border border-border/60 break-all select-all">
								{campaign.id}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Per-Link Attribution Leaderboard */}
				<Card className="border-border/70 bg-card shadow-xs md:col-span-2">
					<CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
						<div>
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								<IconChartBar className="size-4 text-primary" />
								<span>Attribution Share by Shortlink</span>
							</CardTitle>
							<CardDescription className="text-xs">
								Traffic distribution across short URLs configured under this campaign
							</CardDescription>
						</div>

						<div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs">
							{[7, 30, 90].map((d) => (
								<button
									key={d}
									type="button"
									onClick={() => setDays(d)}
									className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
										days === d
											? "bg-card text-foreground font-semibold shadow-2xs border border-border/70"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{d}d
								</button>
							))}
						</div>
					</CardHeader>
					<CardContent className="p-5 pt-0">
						{isAnalyticsLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
						) : linkAttribution.length === 0 ? (
							<div className="p-8 text-center text-xs text-muted-foreground space-y-1">
								<IconChartBar className="size-6 mx-auto opacity-30" />
								<p>No traffic recorded for this campaign in the selected timeframe.</p>
							</div>
						) : (
							<div className="space-y-3">
								{linkAttribution.map((item) => {
									const sharePct = totalClicks > 0 ? Math.round(((item.totalClicks || 0) / totalClicks) * 100) : 0;
									return (
										<div key={item.shortCode || item.urlId} className="space-y-1">
											<div className="flex items-center justify-between text-xs">
												<Link
													to={`/redirect-links/${item.shortCode}`}
													className="font-mono font-bold text-primary hover:underline flex items-center gap-1"
												>
													<span>/r/{item.shortCode}</span>
													<IconExternalLink className="size-3 opacity-60" />
												</Link>
												<div className="flex items-center gap-2 font-mono">
													<span className="font-semibold text-foreground">{item.totalClicks || 0} clicks</span>
													<span className="text-muted-foreground text-[10px]">({sharePct}%)</span>
												</div>
											</div>
											<Progress value={sharePct} className="h-1.5" />
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* 4. Assigned Short URLs Table */}
			<Card className="border-border/70 bg-card shadow-xs">
				<CardHeader className="p-5 pb-3">
					<CardTitle className="text-sm font-semibold flex items-center justify-between">
						<div className="flex items-center gap-2">
							<IconLink className="size-4 text-primary" />
							<span>Campaign Shortlinks ({urls.length})</span>
						</div>
					</CardTitle>
					<CardDescription className="text-xs">
						Direct routing targets and tracking codes organized under this campaign
					</CardDescription>
				</CardHeader>

				<CardContent className="p-0">
					{isUrlsLoading ? (
						<div className="p-6 space-y-3">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : urls.length === 0 ? (
						<div className="p-12 text-center text-xs text-muted-foreground space-y-2">
							<IconLink className="size-8 mx-auto opacity-30" />
							<p className="font-medium text-foreground">No Shortlinks Assigned</p>
							<p className="max-w-sm mx-auto">
								Assign existing shortlinks to this campaign or generate tagged URLs via the UTM builder.
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-muted/40">
									<TableRow className="hover:bg-transparent">
										<TableHead className="text-xs font-semibold">Shortlink & Target</TableHead>
										<TableHead className="text-xs font-semibold text-center">7D Velocity</TableHead>
										<TableHead className="text-xs font-semibold text-center">Status</TableHead>
										<TableHead className="text-xs font-semibold text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{urls.map((u) => {
										const isCopied = copiedShortCode === u.shortCode;
										return (
											<TableRow key={u.id} className="hover:bg-muted/15">
												<TableCell className="py-3">
													<div className="space-y-0.5">
														<div className="flex items-center gap-2">
															<Link
																to={`/redirect-links/${u.shortCode}`}
																className="font-mono text-xs font-bold text-primary hover:underline"
															>
																/r/{u.shortCode}
															</Link>
															<button
																type="button"
																onClick={() => handleCopy(u.shortCode)}
																className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
																title="Copy shortlink"
															>
																{isCopied ? (
																	<IconCheck className="size-3.5 text-emerald-500" />
																) : (
																	<IconCopy className="size-3.5" />
																)}
															</button>
														</div>
														<p
															className="text-[11px] text-muted-foreground truncate max-w-md"
															title={u.destinationUrl}
														>
															{u.destinationUrl}
														</p>
													</div>
												</TableCell>

												<TableCell className="py-3 text-center">
													{(() => {
														const linkStat = linkAttribution.find(
															(lb) => lb.name === u.shortCode || lb.name === `/r/${u.shortCode}`
														);
														const clicks = linkStat?.count ?? u.clickCount ?? 0;
														const pct = linkStat?.percentage ?? (totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0);
														return (
															<div className="flex flex-col items-center justify-center gap-1">
																<span className="font-mono text-xs font-semibold text-foreground">
																	{clicks.toLocaleString()} clicks
																</span>
																<div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
																	<div
																		className="h-full bg-primary/70 rounded-full transition-all"
																		style={{ width: `${Math.min(100, Math.max(clicks ? 15 : 0, pct))}%` }}
																	/>
																</div>
															</div>
														);
													})()}
												</TableCell>

												<TableCell className="py-3 text-center">
													<button
														type="button"
														onClick={(e) => handleToggleUrlActive(u, e)}
														className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer border ${
															u.isActive !== false
																? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
																: "bg-muted text-muted-foreground border-border hover:text-foreground"
														}`}
													>
														{u.isActive !== false ? "Active" : "Paused"}
													</button>
												</TableCell>

												<TableCell className="py-3 text-right">
													<div className="flex items-center justify-end gap-1">
														<Button
															asChild
															variant="ghost"
															size="icon-sm"
															className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
															title="View link details"
														>
															<Link to={`/redirect-links/${u.shortCode}`}>
																<IconExternalLink className="size-3.5" />
															</Link>
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* 5. Modals */}
			<EditCampaignModal
				campaign={campaign}
				open={editModalOpen}
				onOpenChange={setEditModalOpen}
				onSave={(payload) => updateMutation.mutate({ id: campaign.id, ...payload })}
				isSaving={updateMutation.isPending}
			/>

			<DeleteCampaignDialog
				campaign={campaign}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={() => deleteMutation.mutate(campaign.id)}
				isDeleting={deleteMutation.isPending}
			/>

			<CampaignAnalyticsModal
				campaign={campaign}
				open={analyticsModalOpen}
				onOpenChange={setAnalyticsModalOpen}
			/>
		</div>
	);
}

export default CampaignDetailPage;
