import * as React from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import {
	useUrlsQuery,
	useCampaignsQuery,
	useCreateCampaignMutation,
	useDeleteCampaignMutation,
	useCampaignUrlsQuery,
} from "@/queries";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
	IconAdjustments,
	IconPlus,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconChartBar,
	IconTag,
	IconShare,
	IconSearch,
	IconFolder,
	IconTrash,
	IconLink,
	IconUnlink,
	IconLayersSubtract,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/queryKeys";
import { updateUrl } from "@/api/url";
import { toast } from "sonner";

/* Hallmark · page: Campaigns & UTM Tracking · macrostructure: Workbench · theme: modern-minimal */

export function CampaignsPage() {
	const queryClient = useQueryClient();
	const { onOpenCreateModal } = useOutletContext() || {};
	const [activeTab, setActiveTab] = React.useState("campaigns"); // "campaigns" | "utm_links"
	const [linkToAssignId, setLinkToAssignId] = React.useState("");

	// Fetch backend campaigns
	const {
		data: campaigns = [],
		isLoading: campaignsLoading,
		refetch: refetchCampaigns,
	} = useCampaignsQuery();

	// Fetch all URLs for UTM parsing and campaign association
	const { data: serverUrls = [] } = useUrlsQuery({ page: 0, size: 100 });
	const urls = Array.isArray(serverUrls) ? serverUrls : serverUrls?.content || [];

	const [searchQuery, setSearchQuery] = React.useState("");
	const [copiedId, setCopiedId] = React.useState(null);

	// Modals state
	const [isNewCampaignOpen, setIsNewCampaignOpen] = React.useState(false);
	const [isUtmBuilderOpen, setIsUtmBuilderOpen] = React.useState(false);
	const [selectedCampaignForUrls, setSelectedCampaignForUrls] = React.useState(null);

	// New Campaign Form
	const [newCampaignName, setNewCampaignName] = React.useState("");
	const [newCampaignDesc, setNewCampaignDesc] = React.useState("");

	// UTM Builder state
	const [targetUrl, setTargetUrl] = React.useState("https://mysite.com/product");
	const [utmSource, setUtmSource] = React.useState("twitter");
	const [utmMedium, setUtmMedium] = React.useState("social");
	const [utmCampaign, setUtmCampaign] = React.useState("summer_launch");

	const [searchParams] = useSearchParams();
	const queryCampaignId = searchParams.get("id");

	// Deep link handler: if campaign id is in URL query, auto-open its drilldown modal
	React.useEffect(() => {
		if (queryCampaignId && campaigns.length > 0) {
			const target = campaigns.find((c) => c.id === queryCampaignId);
			if (target && (!selectedCampaignForUrls || selectedCampaignForUrls.id !== queryCampaignId)) {
				setSelectedCampaignForUrls(target);
			}
		}
	}, [queryCampaignId, campaigns]);

	// Campaign URL drill-down
	const { data: campaignUrls = [], isLoading: campaignUrlsLoading } = useCampaignUrlsQuery(
		selectedCampaignForUrls?.id,
		{ enabled: !!selectedCampaignForUrls?.id }
	);

	// URLs available to be attached to this campaign
	const unassignedUrlItems = React.useMemo(() => {
		return urls
			.filter((u) => !campaignUrls.some((cu) => cu.id === u.id))
			.map((u) => ({
				value: u.id,
				label: `/r/${u.shortCode}`,
				sub: u.destinationUrl,
				badge: u.isAbTest ? "A/B Test" : "Direct",
			}));
	}, [urls, campaignUrls]);

	const [campaignToDelete, setCampaignToDelete] = React.useState(null);

	// Mutations
	const createCampaignMutation = useCreateCampaignMutation({
		onSuccess: async () => {
			setIsNewCampaignOpen(false);
			setNewCampaignName("");
			setNewCampaignDesc("");
			await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			await queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchCampaigns?.();
		},
	});

	const deleteCampaignMutation = useDeleteCampaignMutation({
		onSuccess: async () => {
			if (selectedCampaignForUrls) {
				setSelectedCampaignForUrls(null);
			}
			setCampaignToDelete(null);
			await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			await queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchCampaigns?.();
		},
	});

	// Parse UTM parameters from destination URLs
	const campaignLinks = React.useMemo(() => {
		return urls
			.map((url) => {
				try {
					const u = new URL(url.destinationUrl);
					const source = u.searchParams.get("utm_source");
					const medium = u.searchParams.get("utm_medium");
					const campaign = u.searchParams.get("utm_campaign");

					return {
						...url,
						hasUtm: !!(source || medium || campaign),
						utmSource: source || "direct",
						utmMedium: medium || "none",
						utmCampaign: campaign || "unassigned",
					};
				} catch {
					return {
						...url,
						hasUtm: false,
						utmSource: "direct",
						utmMedium: "none",
						utmCampaign: "unassigned",
					};
				}
			})
			.filter((l) => l.hasUtm);
	}, [urls]);

	// Filter campaigns by search
	const filteredCampaigns = React.useMemo(() => {
		if (!searchQuery.trim()) return campaigns;
		const q = searchQuery.toLowerCase().trim();
		return campaigns.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				(c.description && c.description.toLowerCase().includes(q))
		);
	}, [campaigns, searchQuery]);

	// Filter UTM links by search
	const filteredUtmLinks = React.useMemo(() => {
		if (!searchQuery.trim()) return campaignLinks;
		const q = searchQuery.toLowerCase().trim();
		return campaignLinks.filter(
			(c) =>
				c.utmCampaign.toLowerCase().includes(q) ||
				c.utmSource.toLowerCase().includes(q) ||
				c.utmMedium.toLowerCase().includes(q) ||
				c.shortCode.toLowerCase().includes(q)
		);
	}, [campaignLinks, searchQuery]);

	const handleCopy = (text, id) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		toast.success("Copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const handleCreateCampaignSubmit = (e) => {
		e.preventDefault();
		if (!newCampaignName.trim()) {
			toast.error("Campaign name is required");
			return;
		}
		createCampaignMutation.mutate({
			name: newCampaignName.trim(),
			description: newCampaignDesc.trim() || null,
		});
	};

	const handleAssignLinkToCampaign = async () => {
		if (!linkToAssignId || !selectedCampaignForUrls?.id) return;
		try {
			const targetUrl = urls.find((u) => u.id === linkToAssignId || u.shortCode === linkToAssignId);
			if (!targetUrl) return;
			await updateUrl(targetUrl.id, {
				destinationUrl: targetUrl.destinationUrl,
				campaignId: selectedCampaignForUrls.id,
			});
			toast.success("Short link assigned to campaign!");
			setLinkToAssignId("");
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.urls(selectedCampaignForUrls.id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
		} catch (err) {
			toast.error(err?.response?.data?.message || "Failed to assign link to campaign");
		}
	};

	const handleUnlinkFromCampaign = async (url) => {
		try {
			await updateUrl(url.id, {
				destinationUrl: url.destinationUrl,
				campaignId: null,
			});
			toast.success("Link removed from campaign");
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.urls(selectedCampaignForUrls.id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
		} catch (err) {
			toast.error(err?.response?.data?.message || "Failed to unlink from campaign");
		}
	};

	const generatedUtmUrl = React.useMemo(() => {
		try {
			const base = targetUrl.trim().split("?")[0] || "https://example.com";
			const params = new URLSearchParams();
			if (utmSource.trim()) params.set("utm_source", utmSource.trim());
			if (utmMedium.trim()) params.set("utm_medium", utmMedium.trim());
			if (utmCampaign.trim()) params.set("utm_campaign", utmCampaign.trim());
			const qs = params.toString();
			return qs ? `${base}?${qs}` : base;
		} catch {
			return targetUrl;
		}
	}, [targetUrl, utmSource, utmMedium, utmCampaign]);

	const formatDate = (dateStr) => {
		if (!dateStr) return "Recently";
		try {
			return new Date(dateStr).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return "Recently";
		}
	};

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Header Banner */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
				<div>
					<h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
						<IconAdjustments className="size-7 text-primary" />
						<span>Campaigns & Attribution Workbench</span>
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						Organize links into multi-channel marketing campaigns, generate standardized UTM tags, and attribute click traffic.
					</p>
				</div>

				<div className="flex items-center gap-2.5 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsUtmBuilderOpen(true)}
						className="gap-1.5 text-xs h-9 font-medium cursor-pointer shadow-2xs"
					>
						<IconTag className="size-4" />
						<span>UTM Builder</span>
					</Button>

					<Button
						size="sm"
						onClick={() => setIsNewCampaignOpen(true)}
						className="gap-1.5 text-xs h-9 font-semibold cursor-pointer shadow-xs"
					>
						<IconPlus className="size-4" />
						<span>New Campaign</span>
					</Button>
				</div>
			</div>

			{/* 2. Overview KPI Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Backend Campaigns
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-foreground mt-0.5 sm:mt-1">
								{campaigns.length}
							</div>
							<div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
								Managed initiatives
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary border border-primary/20">
							<IconFolder className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								UTM Tagged Links
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-emerald-500 mt-0.5 sm:mt-1">
								{campaignLinks.length}
							</div>
							<div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
								{urls.length > 0 ? Math.round((campaignLinks.length / urls.length) * 100) : 0}% of all URLs
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
							<IconTag className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs col-span-2 sm:col-span-1">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Total Tagged Clicks
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-blue-500 mt-0.5 sm:mt-1">
								{campaignLinks.reduce((acc, curr) => acc + (curr.clickCount || 0), 0)}
							</div>
							<div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
								Attributed inbound volume
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
							<IconShare className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 3. Tab Switcher & Search */}
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-2">
					{/* Tabs */}
					<div className="flex items-center gap-2">
						<button
							onClick={() => setActiveTab("campaigns")}
							className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
								activeTab === "campaigns"
									? "bg-primary text-primary-foreground shadow-2xs"
									: "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
							}`}
						>
							Campaigns List ({campaigns.length})
						</button>
						<button
							onClick={() => setActiveTab("utm_links")}
							className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
								activeTab === "utm_links"
									? "bg-primary text-primary-foreground shadow-2xs"
									: "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
							}`}
						>
							UTM Tagged Links ({campaignLinks.length})
						</button>
					</div>

					{/* Search */}
					<div className="relative w-full sm:w-64">
						<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={activeTab === "campaigns" ? "Search campaigns..." : "Search UTM tags or links..."}
							className="pl-9 h-8.5 text-xs bg-card"
						/>
					</div>
				</div>

				{/* 4. Tab Content: Campaigns List */}
				{activeTab === "campaigns" && (
					<div className="space-y-4">
						{filteredCampaigns.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{filteredCampaigns.map((c) => (
									<Card key={c.id} className="border-border/70 bg-card shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all group">
										<CardHeader className="p-4 pb-2 space-y-1">
											<div className="flex items-center justify-between gap-2">
												<CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate">
													<IconFolder className="size-4 text-primary shrink-0" />
													<span className="truncate">{c.name}</span>
												</CardTitle>
												<span className="text-[11px] text-muted-foreground shrink-0 font-mono">
													{formatDate(c.createdAt)}
												</span>
											</div>
											<p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
												{c.description || "No description provided for this campaign."}
											</p>
										</CardHeader>

										<CardContent className="p-4 pt-2 border-t border-border/40 flex items-center justify-between">
											<Button
												variant="outline"
												size="sm"
												onClick={() => setSelectedCampaignForUrls(c)}
												className="text-xs h-7.5 gap-1.5 cursor-pointer shadow-2xs"
											>
												<IconLink className="size-3 text-primary" />
												<span>View Linked URLs</span>
											</Button>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => setCampaignToDelete(c)}
												className="text-xs h-7.5 text-destructive hover:bg-destructive/10 cursor-pointer"
												title="Delete campaign"
											>
												<IconTrash className="size-3.5" />
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<Card className="border-dashed border-border/80 bg-muted/10 p-8 sm:p-12 text-center">
								<div className="max-w-md mx-auto space-y-3">
									<IconFolder className="size-10 mx-auto text-muted-foreground/50" />
									<h3 className="font-heading font-bold text-base text-foreground">
										No Campaigns Found
									</h3>
									<p className="text-xs text-muted-foreground">
										Create marketing campaigns to bundle related promotional short links together and monitor channel ROI.
									</p>
									<Button
										size="sm"
										onClick={() => setIsNewCampaignOpen(true)}
										className="gap-1.5 text-xs font-semibold cursor-pointer"
									>
										<IconPlus className="size-3.5" />
										<span>Create Your First Campaign</span>
									</Button>
								</div>
							</Card>
						)}
					</div>
				)}

				{/* 5. Tab Content: UTM Tagged Links Table */}
				{activeTab === "utm_links" && (
					<Card className="border-border/70 bg-card overflow-hidden shadow-xs">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-xs border-collapse">
								<thead>
									<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
										<th className="py-3 px-4">Campaign Name</th>
										<th className="py-3 px-4">Source / Medium</th>
										<th className="py-3 px-4">Short Code</th>
										<th className="py-3 px-4 text-center">Clicks</th>
										<th className="py-3 px-4 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border/50">
									{filteredUtmLinks.length > 0 ? (
										filteredUtmLinks.map((link) => {
											const id = link.id || link.shortCode;
											return (
												<tr key={id} className="hover:bg-muted/30 transition-colors">
													<td className="py-3.5 px-4 font-semibold text-foreground">
														<div className="flex items-center gap-1.5">
															<IconTag className="size-3.5 text-primary" />
															<span>{link.utmCampaign}</span>
														</div>
													</td>
													<td className="py-3.5 px-4">
														<div className="flex items-center gap-1.5">
															<Badge variant="outline" className="text-[10px] font-mono">
																{link.utmSource}
															</Badge>
															<span className="text-muted-foreground">/</span>
															<Badge variant="secondary" className="text-[10px] font-mono">
																{link.utmMedium}
															</Badge>
														</div>
													</td>
													<td className="py-3.5 px-4 font-mono">
														<Link
															to={`/redirect-links/${link.shortCode}`}
															className="font-semibold text-primary hover:underline transition-colors"
															title="Configure link"
														>
															/r/{link.shortCode}
														</Link>
													</td>
													<td className="py-3.5 px-4 text-center font-mono">
														<Badge variant="secondary">{link.clickCount ?? 0}</Badge>
													</td>
													<td className="py-3.5 px-4 text-right">
														<div className="flex items-center justify-end gap-1.5">
															<Link
																to={`/redirect-links/${link.shortCode}`}
																className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
																title="Configure link"
															>
																<IconAdjustments className="size-3.5" />
															</Link>
															<Link
																to={`/analytics/${link.shortCode}`}
																className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
																title="View telemetry"
															>
																<IconChartBar className="size-3.5" />
															</Link>
															<button
																onClick={() => handleCopy(`http://localhost:8080/r/${link.shortCode}`, id)}
																className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
												</tr>
											);
										})
									) : (
										<tr>
											<td colSpan={5} className="py-10 text-center text-muted-foreground">
												<IconTag className="size-8 mx-auto text-muted-foreground/50 mb-2" />
												<p className="font-semibold text-foreground">No UTM Links Detected</p>
												<p className="text-xs max-w-sm mx-auto mt-1">
													Use the UTM Builder above to construct campaign-tagged short links.
												</p>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</Card>
				)}
			</div>

			{/* 6. New Campaign Modal */}
			<Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<IconFolder className="size-5 text-primary" />
							<span>Create New Campaign</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							Define a campaign to organize and monitor related marketing shortcodes.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleCreateCampaignSubmit} className="space-y-3.5 py-2">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">Campaign Name</label>
							<Input
								value={newCampaignName}
								onChange={(e) => setNewCampaignName(e.target.value)}
								placeholder="e.g. Q3 Summer Product Launch"
								className="text-xs"
								required
							/>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">Description (Optional)</label>
							<Input
								value={newCampaignDesc}
								onChange={(e) => setNewCampaignDesc(e.target.value)}
								placeholder="e.g. Inbound influencer & Twitter promotional outreach"
								className="text-xs"
							/>
						</div>

						<DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setIsNewCampaignOpen(false)}
								className="text-xs"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={createCampaignMutation.isPending}
								className="text-xs font-semibold"
							>
								{createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* 7. Campaign Linked URLs Drill-Down Modal */}
			<Dialog open={!!selectedCampaignForUrls} onOpenChange={(open) => !open && setSelectedCampaignForUrls(null)}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<IconLink className="size-5 text-primary" />
							<span>URLs in "{selectedCampaignForUrls?.name}"</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							Short links assigned to this campaign.
						</DialogDescription>
					</DialogHeader>

					{/* Add Existing Link to Campaign */}
					<div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2 my-1">
						<label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
							Attach Existing Short Link
						</label>
						<div className="flex items-center gap-2">
							<div className="flex-1">
								<SearchCombobox
									items={unassignedUrlItems}
									value={linkToAssignId}
									onValueChange={(val) => setLinkToAssignId(val)}
									placeholder="Search by code, URL, or type..."
									emptyMessage="No unattached URLs found."
								/>
							</div>
							<Button
								size="sm"
								disabled={!linkToAssignId}
								onClick={handleAssignLinkToCampaign}
								className="text-xs h-9 px-3 gap-1 cursor-pointer shrink-0"
							>
								<IconPlus className="size-3.5" />
								<span>Attach</span>
							</Button>
						</div>
					</div>

					<div className="max-h-72 overflow-y-auto space-y-2 py-2">
						{campaignUrlsLoading ? (
							<div className="py-6 text-center text-xs text-muted-foreground">Loading linked URLs...</div>
						) : campaignUrls.length > 0 ? (
							campaignUrls.map((url) => (
								<div
									key={url.id || url.shortCode}
									className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3 text-xs"
								>
									<div className="space-y-0.5 min-w-0">
										<Link
											to={`/redirect-links/${url.shortCode}`}
											className="font-mono font-bold text-primary hover:underline"
										>
											/r/{url.shortCode}
										</Link>
										<div className="text-muted-foreground truncate max-w-xs" title={url.destinationUrl}>
											{url.destinationUrl}
										</div>
									</div>
									<div className="flex items-center gap-1.5 shrink-0">
										<Link to={`/analytics/${url.shortCode}`}>
											<Button variant="outline" size="sm" className="h-7 text-xs px-2 cursor-pointer" title="View Telemetry">
												<IconChartBar className="size-3" />
											</Button>
										</Link>
										<a
											href={`http://localhost:8080/r/${url.shortCode}`}
											target="_blank"
											rel="noreferrer"
											className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
											title="Test Redirection"
										>
											<IconExternalLink className="size-3.5" />
										</a>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleUnlinkFromCampaign(url)}
											className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
											title="Unlink from campaign"
										>
											<IconUnlink className="size-3.5" />
										</Button>
									</div>
								</div>
							))
						) : (
							<div className="py-8 text-center text-xs text-muted-foreground space-y-2">
								<IconLink className="size-6 mx-auto opacity-40" />
								<p>No short links currently assigned to this campaign.</p>
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setSelectedCampaignForUrls(null);
										onOpenCreateModal?.();
									}}
									className="text-xs"
								>
									Create Link for this Campaign
								</Button>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSelectedCampaignForUrls(null)}
							className="text-xs"
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 8. UTM URL Builder Modal */}
			<Dialog open={isUtmBuilderOpen} onOpenChange={setIsUtmBuilderOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<IconTag className="size-5 text-primary" />
							<span>UTM Campaign URL Builder</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							Build campaign-tagged URLs to attribute clicks to specific channels in your analytics.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3.5 py-2">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">Destination Target URL</label>
							<Input
								value={targetUrl}
								onChange={(e) => setTargetUrl(e.target.value)}
								placeholder="https://mysite.com/product"
								className="text-xs"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-foreground">utm_source</label>
								<Input
									value={utmSource}
									onChange={(e) => setUtmSource(e.target.value)}
									placeholder="twitter, google"
									className="text-xs"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold text-foreground">utm_medium</label>
								<Input
									value={utmMedium}
									onChange={(e) => setUtmMedium(e.target.value)}
									placeholder="social, email"
									className="text-xs"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold text-foreground">utm_campaign</label>
								<Input
									value={utmCampaign}
									onChange={(e) => setUtmCampaign(e.target.value)}
									placeholder="summer_sale"
									className="text-xs"
								/>
							</div>
						</div>

						<div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
							<div className="text-[11px] font-semibold text-muted-foreground">Generated Target URL:</div>
							<div className="font-mono text-xs text-foreground break-all bg-card p-2 rounded-md border border-border">
								{generatedUtmUrl}
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleCopy(generatedUtmUrl, "modal")}
							className="text-xs gap-1.5"
						>
							<IconCopy className="size-3.5" />
							<span>Copy Target URL</span>
						</Button>
						<Button
							size="sm"
							onClick={() => {
								setIsUtmBuilderOpen(false);
								onOpenCreateModal?.(generatedUtmUrl);
							}}
							className="text-xs font-semibold"
						>
							Shorten This URL
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 8. Official Shadcn Alert Dialog for Campaign Deletion */}
			<AlertDialog
				open={!!campaignToDelete}
				onOpenChange={(open) => {
					if (!open) setCampaignToDelete(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete{" "}
							<span className="font-semibold text-foreground">
								"{campaignToDelete?.name}"
							</span>
							? All associated short links will remain active, but will no longer be grouped under this campaign.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setCampaignToDelete(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								if (campaignToDelete?.id) {
									deleteCampaignMutation.mutate(campaignToDelete.id);
								}
							}}
							disabled={deleteCampaignMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
						>
							{deleteCampaignMutation.isPending ? "Deleting..." : "Delete Campaign"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default CampaignsPage;
