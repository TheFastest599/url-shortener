import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
	useUrlsQuery,
	useCampaignsQuery,
	useUpdateUrlMutation,
} from "@/queries";
import { toast } from "sonner";

import {
	DashboardHeader,
	DashboardKpiCards,
	CampaignConstellationBar,
	DashboardLinksTable,
	CampaignSpotlight,
} from "@/components/dashboard";

/* Hallmark · page: Dashboard Mission Control · decomposed into modular components */

export function DashboardPage() {
	const { user } = useAuthStore();
	const { onOpenCreateModal } = useOutletContext() || {};

	// Interactive Filters & State
	const [activeCampaignFilter, setActiveCampaignFilter] = React.useState("ALL");
	const [searchQuery, setSearchQuery] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [currentPage, setCurrentPage] = React.useState(1);
	const pageSize = 15;

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

	// Direct Backend Queries
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

	const handleSelectCampaignFilter = (filterVal) => {
		setActiveCampaignFilter(filterVal);
		setCurrentPage(1);
	};

	const totalCampaignClicks = campaigns.reduce((acc, c) => acc + (c.clickCount || 0), 0);
	const totalLinkClicks = urls.reduce((acc, u) => acc + (u.clickCount || 0), 0);
	const totalClicks = totalLinkClicks + totalCampaignClicks;

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Playful Technical Mission Control Header */}
			<DashboardHeader
				username={user?.username}
				onOpenCreateModal={() => onOpenCreateModal?.()}
			/>

			{/* 2. Executive Growth & Telemetry HUD */}
			<DashboardKpiCards
				totalLinks={totalLinks}
				activeLinks={activeLinks}
				totalClicks={totalClicks}
				totalCampaigns={campaigns.length}
				totalCampaignClicks={totalCampaignClicks}
				humanClicks={totalClicks}
			/>

			{/* 3. Campaign Constellation Filter Strip */}
			<CampaignConstellationBar
				campaigns={campaigns}
				totalLinks={totalLinks}
				activeFilter={activeCampaignFilter}
				onSelectFilter={handleSelectCampaignFilter}
			/>

			{/* 4. Connected Relational Links Table */}
			<DashboardLinksTable
				urls={urls}
				totalLinks={totalLinks}
				totalPages={totalPages}
				currentPage={currentPage}
				onPageChange={setCurrentPage}
				isLoading={urlsLoading}
				isFetching={urlsFetching}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				campaignMap={campaignMap}
				onToggleActive={handleToggleActive}
			/>

			{/* 5. Top Performing Marketing Campaigns Spotlight */}
			<CampaignSpotlight
				campaigns={campaigns}
				totalCampaignClicks={totalCampaignClicks}
			/>
		</div>
	);
}

export default DashboardPage;
