import * as React from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
	useUrlsQuery,
	useCampaignsQuery,
	useCreateCampaignMutation,
	useUpdateCampaignMutation,
	useDeleteCampaignMutation,
	useCampaignUrlsQuery,
} from "@/queries";
import { queryKeys } from "@/queries/queryKeys";
import { updateUrl } from "@/api/url";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import {
	CampaignHeader,
	CampaignStatsCards,
	CampaignGrid,
	CampaignUtmTable,
	CreateCampaignModal,
	EditCampaignModal,
	CampaignLinksModal,
	CampaignAnalyticsModal,
	UtmBuilderModal,
	DeleteCampaignDialog,
} from "@/components/campaigns";

/* Hallmark · page: Campaigns & Attribution Workbench · decomposed into components */

export function CampaignsPage() {
	const queryClient = useQueryClient();
	const { onOpenCreateModal } = useOutletContext() || {};
	const [activeTab, setActiveTab] = React.useState("campaigns"); // "campaigns" | "utm_links"
	const [searchQuery, setSearchQuery] = React.useState("");

	// Modals state
	const [isNewCampaignOpen, setIsNewCampaignOpen] = React.useState(false);
	const [isUtmBuilderOpen, setIsUtmBuilderOpen] = React.useState(false);
	const [searchParams] = useSearchParams();
	const [selectedCampaignId, setSelectedCampaignId] = React.useState(
		() => searchParams.get("id") || null
	);
	const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = React.useState(null);
	const [campaignToEdit, setCampaignToEdit] = React.useState(null);
	const [campaignToDelete, setCampaignToDelete] = React.useState(null);

	// Backend Queries
	const {
		data: campaigns = [],
		isLoading: campaignsLoading,
		refetch: refetchCampaigns,
	} = useCampaignsQuery();

	const { data: serverUrls = [] } = useUrlsQuery(
		{ page: 0, size: 100 },
		{ enabled: activeTab === "utm_links" || isUtmBuilderOpen || !!selectedCampaignId }
	);
	const urls = React.useMemo(() => {
		return Array.isArray(serverUrls) ? serverUrls : serverUrls?.content || [];
	}, [serverUrls]);

	const selectedCampaignForUrls = React.useMemo(() => {
		if (!selectedCampaignId) return null;
		return campaigns.find((c) => c.id === selectedCampaignId) || null;
	}, [campaigns, selectedCampaignId]);

	// Campaign URL drill-down
	const { data: campaignUrls = [], isLoading: campaignUrlsLoading } = useCampaignUrlsQuery(
		selectedCampaignForUrls?.id,
		{ enabled: !!selectedCampaignForUrls?.id }
	);


	// URLs available to be attached
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

	// Parse UTM links
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

	// Filter campaigns
	const filteredCampaigns = React.useMemo(() => {
		if (!searchQuery.trim()) return campaigns;
		const q = searchQuery.toLowerCase().trim();
		return campaigns.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				(c.description && c.description.toLowerCase().includes(q))
		);
	}, [campaigns, searchQuery]);

	// Filter UTM links
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

	// Mutations
	const createMutation = useCreateCampaignMutation({
		onSuccess: async () => {
			setIsNewCampaignOpen(false);
			await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			refetchCampaigns();
		},
	});

	const updateMutation = useUpdateCampaignMutation({
		onSuccess: async () => {
			setCampaignToEdit(null);
			await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			refetchCampaigns();
		},
	});

	const deleteMutation = useDeleteCampaignMutation({
		onSuccess: async () => {
			if (selectedCampaignId === campaignToDelete?.id) {
				setSelectedCampaignId(null);
			}
			setCampaignToDelete(null);
			await queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			refetchCampaigns();
		},
	});

	// Attach link handler
	const handleAssignLinkToCampaign = async (linkId) => {
		if (!linkId || !selectedCampaignForUrls?.id) return;
		try {
			const targetUrl = urls.find((u) => u.id === linkId || u.shortCode === linkId);
			if (!targetUrl) return;
			await updateUrl(targetUrl.id, {
				destinationUrl: targetUrl.destinationUrl,
				campaignId: selectedCampaignForUrls.id,
			});
			toast.success("Short link assigned to campaign!");
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.urls(selectedCampaignForUrls.id) });
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
		} catch (err) {
			toast.error(err?.response?.data?.message || "Failed to assign link to campaign");
		}
	};

	// Unlink link handler
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

	const totalTaggedClicks = campaignLinks.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Header Banner */}
			<CampaignHeader
				onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
				onOpenUtmBuilder={() => setIsUtmBuilderOpen(true)}
			/>

			{/* 2. Overview KPI Cards */}
			<CampaignStatsCards
				totalCampaigns={campaigns.length}
				totalUtmLinks={campaignLinks.length}
				totalUrls={urls.length}
				totalTaggedClicks={totalTaggedClicks}
			/>

			{/* 3. Tab Switcher & Search Bar */}
			<div className="space-y-4">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-2">
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

				{/* 4. Tab Content */}
				{activeTab === "campaigns" ? (
					<CampaignGrid
						campaigns={filteredCampaigns}
						isLoading={campaignsLoading}
						onViewUrls={(c) => setSelectedCampaignId(c.id)}
						onViewAnalytics={(c) => setSelectedCampaignForAnalytics(c)}
						onEdit={(c) => setCampaignToEdit(c)}
						onDelete={(c) => setCampaignToDelete(c)}
						onCreateNew={() => setIsNewCampaignOpen(true)}
					/>
				) : (
					<CampaignUtmTable links={filteredUtmLinks} />
				)}
			</div>

			{/* 5. Modals & Dialogs */}
			<CreateCampaignModal
				open={isNewCampaignOpen}
				onOpenChange={setIsNewCampaignOpen}
				onSubmit={(payload) => createMutation.mutate(payload)}
				isSubmitting={createMutation.isPending}
			/>

			<EditCampaignModal
				key={campaignToEdit?.id}
				campaign={campaignToEdit}
				open={!!campaignToEdit}
				onOpenChange={(open) => !open && setCampaignToEdit(null)}
				onSubmit={(data) => updateMutation.mutate(data)}
				isSubmitting={updateMutation.isPending}
			/>

			<CampaignLinksModal
				campaign={selectedCampaignForUrls}
				open={!!selectedCampaignForUrls}
				onOpenChange={(open) => !open && setSelectedCampaignId(null)}
				campaignUrls={campaignUrls}
				isLoading={campaignUrlsLoading}
				unassignedUrlItems={unassignedUrlItems}
				onAssignLink={handleAssignLinkToCampaign}
				onUnlinkLink={handleUnlinkFromCampaign}
				onCreateNewLink={() => onOpenCreateModal?.()}
			/>

			<CampaignAnalyticsModal
				campaign={selectedCampaignForAnalytics}
				open={!!selectedCampaignForAnalytics}
				onOpenChange={(open) => !open && setSelectedCampaignForAnalytics(null)}
			/>

			<UtmBuilderModal
				open={isUtmBuilderOpen}
				onOpenChange={setIsUtmBuilderOpen}
				onShortenUrl={(url) => onOpenCreateModal?.(url)}
			/>

			<DeleteCampaignDialog
				campaign={campaignToDelete}
				open={!!campaignToDelete}
				onOpenChange={(open) => !open && setCampaignToDelete(null)}
				onConfirm={(id) => deleteMutation.mutate(id)}
				isDeleting={deleteMutation.isPending}
			/>
		</div>
	);
}

export default CampaignsPage;
