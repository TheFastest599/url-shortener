import * as React from "react";
import { useParams, Link, useNavigate, useOutletContext } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useUrlByCodeQuery, useDeleteUrlMutation, useAnalyticsOverview } from "@/queries";
import { queryKeys } from "@/queries/queryKeys";
import { updateUrl } from "@/api/url";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
	IconArrowLeft,
	IconLink,
	IconChartBar,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconQrcode,
	IconDownload,
	IconTrash,
	IconEdit,
	IconCalendar,
	IconClock,
	IconDeviceAnalytics,
	IconTag,
	IconChecklist,
	IconSparkles,
} from "@tabler/icons-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

export function LinkDetailPage() {
	const { shortCode } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { onOpenQrModal } = useOutletContext() || {};

	const [isDeleting, setIsDeleting] = React.useState(false);

	const { data: urlData, isLoading, refetch } = useUrlByCodeQuery(shortCode, {
		enabled: !isDeleting && !!shortCode,
	});
	const updateMutation = useMutation({
		mutationFn: (payload) => updateUrl(urlData?.id, payload),
		onSuccess: () => {
			toast.success("Short URL updated successfully");
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.lists() });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.byCode(shortCode) });
			refetch();
		},
	});

	const deleteMutation = useDeleteUrlMutation({
		onSuccess: () => {
			toast.success("Short URL deleted");
			navigate(ROUTES.DASHBOARD);
		},
		onError: (err) => {
			setIsDeleting(false);
			toast.error(err?.response?.data?.message || "Failed to delete short URL");
		},
	});

	// Analytics preview
	const { data: analytics } = useAnalyticsOverview(shortCode, {
		days: 7,
		includeBots: true,
		enabled: !isDeleting && !!shortCode,
	});

	const [destinationUrl, setDestinationUrl] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(false);
	const [copied, setCopied] = React.useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

	const handleDelete = () => {
		if (!urlData?.id) return;
		setIsDeleting(true);
		setDeleteDialogOpen(false);
		queryClient.cancelQueries({ queryKey: queryKeys.urls.byCode(shortCode) });
		queryClient.removeQueries({ queryKey: queryKeys.urls.byCode(shortCode) });
		queryClient.removeQueries({ queryKey: queryKeys.analytics.all(shortCode) });
		deleteMutation.mutate(urlData.id);
	};

	React.useEffect(() => {
		if (urlData?.destinationUrl) {
			setDestinationUrl(urlData.destinationUrl);
		}
	}, [urlData]);

	const fullShortUrl = `http://localhost:8080/r/${shortCode}`;
	const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
		fullShortUrl,
	)}&margin=12`;

	const handleCopy = () => {
		navigator.clipboard.writeText(fullShortUrl);
		setCopied(true);
		toast.success("Short URL copied to clipboard");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownloadQr = async () => {
		try {
			const response = await fetch(qrImageUrl);
			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = `qr-${shortCode}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(blobUrl);
			toast.success("QR Code downloaded");
		} catch {
			window.open(qrImageUrl, "_blank");
		}
	};

	const handleSaveDestination = (e) => {
		e.preventDefault();
		const trimmedUrl = destinationUrl.trim();
		if (!trimmedUrl) {
			toast.error("Destination URL cannot be empty");
			return;
		}
		updateMutation.mutate({
			id: urlData?.id,
			destinationUrl: trimmedUrl,
			isActive: urlData?.isActive !== false,
		});
		setIsEditing(false);
	};

	const handleToggleActive = () => {
		const nextState = urlData?.isActive === false;
		updateMutation.mutate({
			id: urlData?.id,
			destinationUrl: destinationUrl || urlData?.destinationUrl,
			isActive: nextState,
		});
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return "—";
		try {
			return new Date(dateStr).toLocaleString(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
			});
		} catch {
			return "—";
		}
	};

	const chartData = (analytics?.timeSeries || []).map((pt, idx) => ({
		idx,
		clicks: pt.clicks,
		date: pt.timestamp ? pt.timestamp.split("T")[0] : "",
	}));

	if (isLoading) {
		return (
			<div className="space-y-6 max-w-5xl mx-auto py-4">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-5xl mx-auto">
			{/* Top Navigation */}
			<div className="flex items-center justify-between border-b border-border/50 pb-4">
				<Link
					to={ROUTES.REDIRECT_LINKS}
					className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
				>
					<IconArrowLeft className="size-3.5" />
					<span>Back to Redirect Links</span>
				</Link>

				<Link to={`/analytics/${shortCode}`}>
					<Button size="sm" className="gap-1.5 text-xs h-8 font-semibold shadow-xs cursor-pointer">
						<IconChartBar className="size-3.5" />
						<span>View Deep Analytics</span>
					</Button>
				</Link>
			</div>

			{/* Main Overview Card */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 sm:p-6 shadow-2xs">
				<div className="space-y-1.5 min-w-0">
					<div className="flex flex-wrap items-center gap-2.5">
						<span className="font-mono text-2xl font-bold tracking-tight text-foreground">
							/r/{shortCode}
						</span>
						<Badge
							variant="outline"
							className={`text-[10px] ${
								urlData?.isActive !== false
									? "text-emerald-500 border-emerald-500/30"
									: "text-muted-foreground border-border"
							}`}
						>
							{urlData?.isActive !== false ? "Active" : "Inactive"}
						</Badge>
						<Badge variant="secondary" className="font-mono text-[10px]">
							{analytics?.totalClicks ?? urlData?.clickCount ?? 0} Clicks
						</Badge>
					</div>
					<div className="text-xs text-muted-foreground truncate" title={urlData?.destinationUrl}>
						Target: <span className="text-foreground font-mono">{urlData?.destinationUrl}</span>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center gap-2 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopy}
						className="h-8.5 gap-1.5 text-xs cursor-pointer shadow-2xs"
					>
						{copied ? (
							<IconCheck className="size-3.5 text-emerald-500" />
						) : (
							<IconCopy className="size-3.5" />
						)}
						<span>{copied ? "Copied" : "Copy Short URL"}</span>
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenQrModal?.(fullShortUrl)}
						className="h-8.5 gap-1.5 text-xs cursor-pointer shadow-2xs"
						title="Open QR Code Modal"
					>
						<IconQrcode className="size-3.5 text-primary" />
						<span>QR Code</span>
					</Button>

					<a
						href={fullShortUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex size-8.5 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-2xs"
						title="Test Redirection"
					>
						<IconExternalLink className="size-4" />
					</a>
				</div>
			</div>

			{/* Details Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Column 1 & 2: Edit Configuration */}
				<div className="md:col-span-2 space-y-6">
					<Card className="border-border/70 bg-card shadow-xs">
						<CardHeader className="p-5 pb-3">
							<CardTitle className="text-sm font-semibold flex items-center gap-2">
								<IconEdit className="size-4 text-primary" />
								<span>Link Configuration</span>
							</CardTitle>
							<CardDescription className="text-xs">
								Update your destination redirect URL and manage availability status.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-5 pt-0 space-y-4">
							<form onSubmit={handleSaveDestination} className="space-y-2">
								<label className="text-xs font-semibold text-foreground">Destination Target URL</label>
								<div className="flex items-center gap-2">
									<Input
										value={destinationUrl}
										onChange={(e) => setDestinationUrl(e.target.value)}
										placeholder="https://example.com/target-page"
										className="text-xs font-mono"
									/>
									<Button
										type="submit"
										size="sm"
										disabled={updateMutation.isPending || destinationUrl === urlData?.destinationUrl}
										className="text-xs shrink-0 cursor-pointer"
									>
										{updateMutation.isPending ? "Saving..." : "Save Target"}
									</Button>
								</div>
							</form>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/50 text-xs">
								<div className="space-y-1">
									<span className="text-muted-foreground">Shortcode Slug</span>
									<div className="font-mono font-bold text-foreground">/r/{shortCode}</div>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground">Status Setting</span>
									<div>
										<button
											onClick={handleToggleActive}
											disabled={updateMutation.isPending}
											className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
												urlData?.isActive !== false
													? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
													: "bg-muted text-muted-foreground border-border hover:text-foreground"
											}`}
										>
											{urlData?.isActive !== false ? "Active (Click to Disable)" : "Disabled (Click to Activate)"}
										</button>
									</div>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground">Created At</span>
									<div className="text-foreground">{formatDate(urlData?.createdAt)}</div>
								</div>
								<div className="space-y-1">
									<span className="text-muted-foreground">Last Updated</span>
									<div className="text-foreground">{formatDate(urlData?.updatedAt)}</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Danger Zone */}
					<Card className="border-destructive/30 bg-destructive/5 shadow-xs">
						<CardContent className="p-5 flex items-center justify-between">
							<div className="space-y-0.5">
								<div className="text-xs font-semibold text-destructive">Delete Short Link</div>
								<div className="text-[11px] text-muted-foreground">
									Permanently remove this mapping. Traffic will immediately receive a 404 error.
								</div>
							</div>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setDeleteDialogOpen(true)}
								className="text-xs shrink-0 cursor-pointer"
							>
								<IconTrash className="size-3.5 mr-1" />
								<span>Delete Link</span>
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Column 3: Telemetry & Traffic Snapshot */}
				<div className="space-y-6">
					<Card className="border-border/70 bg-card shadow-xs">
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
								<span>7-Day Traffic Trend</span>
								<IconChartBar className="size-4 text-primary" />
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-1 space-y-3">
							<div className="text-2xl font-bold font-heading text-foreground">
								{analytics?.totalClicks ?? 0}
								<span className="text-xs font-normal text-muted-foreground ml-1.5">recent clicks</span>
							</div>

							<div className="h-24 w-full">
								{chartData.length > 0 ? (
									<ResponsiveContainer width="100%" height="100%">
										<AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
											<defs>
												<linearGradient id="linkDetailGrad" x1="0" y1="0" x2="0" y2="1">
													<stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
													<stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
												</linearGradient>
											</defs>
											<Tooltip
												content={({ active, payload }) => {
													if (active && payload && payload.length) {
														return (
															<div className="rounded-md border border-border bg-popover px-2 py-1 text-[10px] shadow-sm font-mono">
																<span>{payload[0].value} clicks</span>
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
												fill="url(#linkDetailGrad)"
											/>
										</AreaChart>
									</ResponsiveContainer>
								) : (
									<div className="h-full flex items-center justify-center text-xs text-muted-foreground">
										No traffic yet
									</div>
								)}
							</div>

							<Link
								to={`/analytics/${shortCode}`}
								className="block text-center text-xs text-primary font-medium hover:underline pt-2 border-t border-border/50"
							>
								Open Full Telemetry Hub →
							</Link>
						</CardContent>
					</Card>

					{/* QR Code Quick Card */}
					<Card className="border-border/70 bg-card shadow-xs">
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
								<span>QR Code</span>
								<IconQrcode className="size-4 text-primary" />
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-2 flex flex-col items-center text-center space-y-3">
							<div className="p-2.5 bg-white rounded-xl shadow-2xs border border-border/80">
								<img
									src={qrImageUrl}
									alt={`QR Code for /r/${shortCode}`}
									className="size-36 object-contain"
									loading="lazy"
								/>
							</div>
							<p className="text-[11px] text-muted-foreground leading-snug">
								Scan directly or download high-res PNG for marketing materials.
							</p>
							<div className="flex items-center gap-2 w-full pt-1">
								<Button
									variant="outline"
									size="sm"
									onClick={handleDownloadQr}
									className="flex-1 h-8 gap-1.5 text-xs cursor-pointer shadow-2xs"
								>
									<IconDownload className="size-3.5" />
									<span>Download PNG</span>
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={() => onOpenQrModal?.(fullShortUrl)}
									className="h-8 text-xs cursor-pointer shadow-2xs"
								>
									<span>Expand</span>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Short URL</DialogTitle>
						<DialogDescription className="text-xs">
							Are you sure you want to delete <span className="font-mono font-bold text-foreground">/r/{shortCode}</span>?
							This will permanently destroy the redirection rule and cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0 mt-4">
						<Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)} className="text-xs">
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							disabled={deleteMutation.isPending}
							onClick={handleDelete}
							className="text-xs font-semibold"
						>
							{deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default LinkDetailPage;
