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
	CampaignsTable,
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
	
	// Server-side search & pagination for CampaignsTable
	const [campaignPage, setCampaignPage] = React.useState(1);
	const [campaignSearch, setCampaignSearch] = React.useState("");
	const [debouncedCampaignSearch, setDebouncedCampaignSearch] = React.useState("");
	const campaignPageSize = 20;

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedCampaignSearch(campaignSearch.trim());
			setCampaignPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [campaignSearch]);

	// Modals state
	const [isNewCampaignOpen, setIsNewCampaignOpen] = React.useState(false);
	const [isUtmBuilderOpen, setIsUtmBuilderOpen] = React.useState(false);
	const [utmSearchQuery, setUtmSearchQuery] = React.useState("");
	const [searchParams] = useSearchParams();
	const [selectedCampaignId, setSelectedCampaignId] = React.useState(
		() => searchParams.get("id") || null
	);
	const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = React.useState(null);
	const [campaignToEdit, setCampaignToEdit] = React.useState(null);
	const [campaignToDelete, setCampaignToDelete] = React.useState(null);

	// Backend Queries
	const {
		data: campaignsData,
		isLoading: campaignsLoading,
		isFetching: campaignsFetching,
		refetch: refetchCampaigns,
	} = useCampaignsQuery({
		page: campaignPage - 1,
		size: campaignPageSize,
		search: debouncedCampaignSearch || undefined,
		sortBy: "createdAt",
		direction: "DESC",
	});

	const campaigns = React.useMemo(() => {
		return Array.isArray(campaignsData) ? campaignsData : campaignsData?.content || [];
	}, [campaignsData]);

	const totalCampaigns = campaignsData?.totalElements ?? campaigns.length;
	const totalCampaignPages = Math.max(1, campaignsData?.totalPages || 1);

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
	// All URLs are shown, but URLs already assigned to a campaign (either this one or another)
	// are clearly presented as disabled and unselectable.
	const unassignedUrlItems = React.useMemo(() => {
		const targetCampaignId = selectedCampaignForUrls?.id;

		const items = urls.map((u) => {
			const isInThisCampaign =
				Boolean(targetCampaignId && u.campaignId === targetCampaignId) ||
				campaignUrls.some((cu) => cu.id === u.id || cu.shortCode === u.shortCode);
			const isInOtherCampaign =
				Boolean(u.campaignId && targetCampaignId && u.campaignId !== targetCampaignId) ||
				Boolean(u.campaignId && !targetCampaignId);

			if (isInThisCampaign) {
				return {
					value: u.id,
					label: `/r/${u.shortCode}`,
					sub: u.destinationUrl,
					badge: "In this campaign",
					disabled: true,
					disabledReason: "Already in this campaign",
				};
			}

			if (isInOtherCampaign) {
				return {
					value: u.id,
					label: `/r/${u.shortCode}`,
					sub: u.destinationUrl,
					badge: `In "${u.campaignName || "Other Campaign"}"`,
					disabled: true,
					disabledReason: `In "${u.campaignName || "Other Campaign"}"`,
				};
			}

			return {
				value: u.id,
				label: `/r/${u.shortCode}`,
				sub: u.destinationUrl,
				badge: u.isAbTest ? "A/B Test" : "Available",
				disabled: false,
			};
		});

		// Sort so unassigned/available links appear first, followed by disabled ones
		return items.sort((a, b) => {
			if (a.disabled === b.disabled) return 0;
			return a.disabled ? 1 : -1;
		});
	}, [urls, campaignUrls, selectedCampaignForUrls]);

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

	// Filter UTM links
	const filteredUtmLinks = React.useMemo(() => {
		if (!utmSearchQuery.trim()) return campaignLinks;
		const q = utmSearchQuery.toLowerCase().trim();
		return campaignLinks.filter(
			(c) =>
				c.utmCampaign.toLowerCase().includes(q) ||
				c.utmSource.toLowerCase().includes(q) ||
				c.utmMedium.toLowerCase().includes(q) ||
				c.shortCode.toLowerCase().includes(q)
		);
	}, [campaignLinks, utmSearchQuery]);

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
				totalCampaigns={totalCampaigns}
				totalUtmLinks={campaignLinks.length}
				totalUrls={urls.length}
				totalTaggedClicks={totalTaggedClicks}
			/>

			{/* 3. Tab Switcher */}
			<div className="space-y-4">
				<div className="flex items-center gap-2 border-b border-border/50 pb-2">
					<button
						onClick={() => setActiveTab("campaigns")}
						className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
							activeTab === "campaigns"
								? "bg-primary text-primary-foreground shadow-2xs"
								: "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
						}`}
					>
						Campaigns List ({totalCampaigns})
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

				{/* 4. Tab Content: Reusable CampaignsTable or UTM table */}
				{activeTab === "campaigns" ? (
					<CampaignsTable
						campaigns={campaigns}
						isLoading={campaignsLoading}
						isFetching={campaignsFetching}
						totalCampaigns={totalCampaigns}
						totalPages={totalCampaignPages}
						currentPage={campaignPage}
						onPageChange={setCampaignPage}
						searchQuery={campaignSearch}
						onSearchChange={setCampaignSearch}
					/>
				) : (
					<div className="space-y-3">
						<div className="relative w-full sm:w-72">
							<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								value={utmSearchQuery}
								onChange={(e) => setUtmSearchQuery(e.target.value)}
								placeholder="Search UTM tags or links..."
								className="pl-9 h-9 text-xs bg-card"
							/>
						</div>
						<CampaignUtmTable links={filteredUtmLinks} />
					</div>
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
