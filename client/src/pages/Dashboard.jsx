import * as React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import {
	useUrlsQuery,
	useCampaignsQuery,
	useAbTestsQuery,
	useUpdateUrlMutation,
} from "@/queries";
import { toast } from "sonner";

import {
	DashboardHeader,
	DashboardKpiCards,
	CampaignConstellationBar,
} from "@/components/dashboard";
import { LinksTable } from "@/components/links";
import { CampaignsTable } from "@/components/campaigns";
import { AbTestsTable } from "@/components/ab-testing";

/* Hallmark · page: Dashboard Mission Control · decomposed into modular components */

export function DashboardPage() {
	const { user } = useAuthStore();
	const { onOpenCreateModal } = useOutletContext() || {};

	// Interactive Filters & State
	const [activeCampaignFilter, setActiveCampaignFilter] = React.useState("ALL");
	const [searchQuery, setSearchQuery] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [currentPage, setCurrentPage] = React.useState(1);
	const pageSize = 5;

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

	// 1. Direct Shortlinks Query (Core OLTP)
	const {
		data: serverUrls,
		isLoading: urlsLoading,
		isFetching: urlsFetching,
	} = useUrlsQuery(queryParams);

	// 2. Campaigns Query (Core OLTP with explicit page & search params)
	const [campaignsPage, setCampaignsPage] = React.useState(1);
	const [campaignSearch, setCampaignSearch] = React.useState("");
	const [debouncedCampaignSearch, setDebouncedCampaignSearch] = React.useState("");
	const campaignsPageSize = 5;

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedCampaignSearch(campaignSearch.trim());
			setCampaignsPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [campaignSearch]);

	const {
		data: serverCampaigns,
		isLoading: campaignsLoading,
		isFetching: campaignsFetching,
	} = useCampaignsQuery({
		page: campaignsPage - 1,
		size: campaignsPageSize,
		search: debouncedCampaignSearch || undefined,
		sortBy: "createdAt",
		direction: "DESC",
	});

	// 3. A/B Tests Query (Core OLTP with explicit page & search params)
	const [abTestsPage, setAbTestsPage] = React.useState(1);
	const [abTestSearch, setAbTestSearch] = React.useState("");
	const [debouncedAbTestSearch, setDebouncedAbTestSearch] = React.useState("");
	const abTestsPageSize = 5;

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedAbTestSearch(abTestSearch.trim());
			setAbTestsPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [abTestSearch]);

	const {
		data: abTestsData,
		isLoading: abTestsLoading,
		isFetching: abTestsFetching,
	} = useAbTestsQuery({
		page: abTestsPage - 1,
		size: abTestsPageSize,
		search: debouncedAbTestSearch || undefined,
		sortBy: "createdAt",
		direction: "DESC",
	});

	const urls = Array.isArray(serverUrls) ? serverUrls : serverUrls?.content || [];
	const totalLinks = serverUrls?.totalElements ?? urls.length;
	const totalPages = Math.max(1, serverUrls?.totalPages || 1);
	const activeLinks = urls.filter((u) => u.isActive !== false).length;

	const campaigns = Array.isArray(serverCampaigns) ? serverCampaigns : serverCampaigns?.content || [];
	const totalCampaigns = serverCampaigns?.totalElements ?? campaigns.length;
	const totalCampaignPages = Math.max(1, serverCampaigns?.totalPages || 1);

	const abTests = Array.isArray(abTestsData) ? abTestsData : abTestsData?.content || [];
	const totalAbTests = abTestsData?.totalElements ?? abTests.length;
	const totalAbTestPages = Math.max(1, abTestsData?.totalPages || 1);
	const activeAbTests = abTests.filter((t) => (t.status || "ACTIVE") === "ACTIVE").length;

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

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Playful Technical Mission Control Header */}
			<DashboardHeader
				username={user?.username}
				onOpenCreateModal={() => onOpenCreateModal?.()}
			/>

			{/* 2. Executive Growth & Fleet HUD */}
			<DashboardKpiCards
				totalLinks={totalLinks}
				activeLinks={activeLinks}
				totalCampaigns={totalCampaigns}
				totalAbTests={totalAbTests}
				activeAbTests={activeAbTests}
			/>

			{/* 3. Campaign Constellation Filter Strip for Shortlinks */}
			<CampaignConstellationBar
				campaigns={campaigns}
				totalLinks={totalLinks}
				activeFilter={activeCampaignFilter}
				onSelectFilter={handleSelectCampaignFilter}
			/>

			{/* 4. Table 1: Shortcode Links Table */}
			<div className="space-y-2.5 pt-1">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
					<div>
						<h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
							Active Shortlinks
						</h2>
						<p className="text-xs text-muted-foreground">
							Top short URLs with live traffic routing and click statistics
						</p>
					</div>
					<Link to={ROUTES.REDIRECT_LINKS}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 text-xs font-semibold cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
						>
							<span>Go to URLs</span>
							<IconArrowRight className="size-3.5 text-primary" />
						</Button>
					</Link>
				</div>
				<LinksTable
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
			</div>

			{/* 5. Table 2: Marketing Campaigns Table */}
			<div className="space-y-2.5 pt-2">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
					<div>
						<h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
							Marketing Campaigns
						</h2>
						<p className="text-xs text-muted-foreground">
							Grouped campaigns with UTM parameters and link clusters
						</p>
					</div>
					<Link to={ROUTES.CAMPAIGNS}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 text-xs font-semibold cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
						>
							<span>Go to Campaigns</span>
							<IconArrowRight className="size-3.5 text-primary" />
						</Button>
					</Link>
				</div>
				<CampaignsTable
					campaigns={campaigns}
					isLoading={campaignsLoading}
					totalCampaigns={totalCampaigns}
					totalPages={totalCampaignPages}
					currentPage={campaignsPage}
					onPageChange={setCampaignsPage}
					isFetching={campaignsFetching}
					searchQuery={campaignSearch}
					onSearchChange={setCampaignSearch}
				/>
			</div>

			{/* 6. Table 3: A/B Split Experiments Table */}
			<div className="space-y-2.5 pt-2">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
					<div>
						<h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
							A/B Split Experiments
						</h2>
						<p className="text-xs text-muted-foreground">
							Live traffic splitting and variant conversion tracking
						</p>
					</div>
					<Link to={ROUTES.AB_TESTING}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 text-xs font-semibold cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
						>
							<span>Go to A/B Tests</span>
							<IconArrowRight className="size-3.5 text-primary" />
						</Button>
					</Link>
				</div>
				<AbTestsTable
					abTests={abTests}
					isLoading={abTestsLoading}
					totalAbTests={totalAbTests}
					totalPages={totalAbTestPages}
					currentPage={abTestsPage}
					onPageChange={setAbTestsPage}
					isFetching={abTestsFetching}
					searchQuery={abTestSearch}
					onSearchChange={setAbTestSearch}
				/>
			</div>
		</div>
	);
}

export default DashboardPage;



