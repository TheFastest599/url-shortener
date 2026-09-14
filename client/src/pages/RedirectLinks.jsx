import * as React from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
	useUrlsQuery,
	useDeleteUrlMutation,
	useCampaignsQuery,
	useUpdateUrlMutation,
} from "@/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";

import {
	LinksTable,
	DeleteLinkDialog,
} from "@/components/links";

/* Hallmark · page: Redirect Links Workbench · decomposed into modular components */

export function RedirectLinksPage() {
	const { shortCode: routeParamCode } = useParams();
	const { onOpenCreateModal, onOpenQrModal } = useOutletContext() || {};

	const [searchQuery, setSearchQuery] = React.useState(routeParamCode || "");
	const [debouncedSearch, setDebouncedSearch] = React.useState(routeParamCode || "");
	const [statusFilter, setStatusFilter] = React.useState("all");
	const [currentPage, setCurrentPage] = React.useState(1);
	const pageSize = 20;
	const [deleteTarget, setDeleteTarget] = React.useState(null);

	// Debounce search query input (250ms)
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setCurrentPage(1);
		}, 250);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Update search if route param changes
	const prevRouteParamRef = React.useRef(routeParamCode);
	React.useEffect(() => {
		if (routeParamCode && routeParamCode !== prevRouteParamRef.current) {
			prevRouteParamRef.current = routeParamCode;
			setSearchQuery(routeParamCode);
			setDebouncedSearch(routeParamCode);
		}
	}, [routeParamCode]);

	const queryParams = React.useMemo(() => {
		const p = {
			page: currentPage - 1,
			size: pageSize,
			sortBy: "createdAt",
			direction: "DESC",
		};
		if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
		if (statusFilter !== "all") p.status = statusFilter;
		return p;
	}, [currentPage, pageSize, debouncedSearch, statusFilter]);

	const {
		data: serverData,
		isLoading,
		isFetching,
		refetch: refetchUrls,
	} = useUrlsQuery(queryParams);
	const { data: userCampaigns = [] } = useCampaignsQuery();

	const campaignMap = React.useMemo(() => {
		const map = {};
		userCampaigns.forEach((c) => {
			map[c.id] = c;
		});
		return map;
	}, [userCampaigns]);

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

	const deleteMutation = useDeleteUrlMutation({
		onSuccess: () => {
			toast.success("Short URL deleted successfully");
			setDeleteTarget(null);
			refetchUrls?.();
		},
	});

	const paginatedUrls = Array.isArray(serverData) ? serverData : serverData?.content || [];
	const totalItems = Array.isArray(serverData) ? serverData.length : serverData?.totalElements || 0;
	const totalPages = Math.max(1, Array.isArray(serverData) ? Math.ceil(totalItems / pageSize) : serverData?.totalPages || 1);

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							Redirect Links
						</h1>
						<Badge variant="secondary" className="font-mono text-xs font-semibold">
							{totalItems} Total
						</Badge>
					</div>
					<p className="text-xs sm:text-sm text-muted-foreground">
						Manage, sort, filter, and monitor all active short URLs in your workspace.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						onClick={() => onOpenCreateModal?.()}
						className="gap-2 text-xs sm:text-sm h-9 sm:h-10 px-4 font-semibold shadow-xs cursor-pointer"
					>
						<IconPlus className="size-4" />
						<span>Create Short Link</span>
					</Button>
				</div>
			</div>

			{/* Pure Links Table with Integrated Search, Status Pills & Pagination */}
			<LinksTable
				urls={paginatedUrls}
				totalItems={totalItems}
				totalPages={totalPages}
				currentPage={currentPage}
				pageSize={pageSize}
				onPageChange={setCurrentPage}
				isLoading={isLoading}
				isFetching={isFetching}
				searchQuery={searchQuery}
				onSearchChange={(q) => {
					setSearchQuery(q);
				}}
				statusFilter={statusFilter}
				onStatusFilterChange={(s) => {
					setStatusFilter(s);
					setCurrentPage(1);
				}}
				campaignMap={campaignMap}
				highlightCode={routeParamCode}
				onToggleActive={handleToggleActive}
				onOpenQrModal={onOpenQrModal}
				onDeleteClick={(url) => setDeleteTarget(url)}
			/>

			{/* Delete Confirmation Alert Dialog */}
			<DeleteLinkDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
				url={deleteTarget}
				onConfirm={(url) => url && deleteMutation.mutate(url.id || url.shortCode)}
				isDeleting={deleteMutation.isPending}
			/>
		</div>
	);
}

export default RedirectLinksPage;
