import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
	useAbTestsQuery,
	useUrlsQuery,
	useConfigureAbTestMutation,
	useUpdateAbTestStatusMutation,
	useDeleteAbTestMutation,
} from "@/queries";
import { queryKeys } from "@/queries/queryKeys";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";

import {
	AbTestHeader,
	AbTestStatsCards,
	AbTestGrid,
	CreateAbTestModal,
	EditAbTestModal,
	PromoteWinnerDialog,
	DeleteAbTestDialog,
	AbTestAnalyticsModal,
} from "@/components/ab-testing";

/* Hallmark · page: A/B Testing Experiments · decomposed into modular components */

export function AbTestingPage() {
	const queryClient = useQueryClient();

	// Modal states
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingExp, setEditingExp] = React.useState(null);
	const [promotingExp, setPromotingExp] = React.useState(null);
	const [deletingShortCode, setDeletingShortCode] = React.useState(null);
	const [telemetryTarget, setTelemetryTarget] = React.useState(null);

	// Search & candidate links
	const [searchFilter, setSearchFilter] = React.useState("");
	const [linkSearchQuery, setLinkSearchQuery] = React.useState("");
	const [debouncedLinkQuery, setDebouncedLinkQuery] = React.useState("");

	// Debounce candidate search query
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedLinkQuery(linkSearchQuery.trim());
		}, 300);
		return () => clearTimeout(timer);
	}, [linkSearchQuery]);

	// 1. Single Top-Level Query for A/B Experiments
	const {
		data: pagedAbTests,
		isLoading: expLoading,
		isFetching: expFetching,
		refetch: refetchExperiments,
	} = useAbTestsQuery({ page: 0, size: 50 });

	const experimentsList = React.useMemo(() => {
		return Array.isArray(pagedAbTests)
			? pagedAbTests
			: pagedAbTests?.content || [];
	}, [pagedAbTests]);

	// 2. Candidate URLs query for the creation modal (only fetched when create modal is active)
	const { data: searchResultsData } = useUrlsQuery(
		{
			page: 0,
			size: 8,
			search: debouncedLinkQuery,
			sortBy: "createdAt",
			direction: "DESC",
		},
		{
			enabled: isCreateOpen && debouncedLinkQuery.length > 0,
		}
	);

	const candidateUrls = React.useMemo(() => {
		const list = Array.isArray(searchResultsData)
			? searchResultsData
			: searchResultsData?.content || [];
		return list.filter((u) => !u.isAbTest);
	}, [searchResultsData]);

	// Filter experiments by search
	const filteredExperiments = React.useMemo(() => {
		if (!searchFilter.trim()) return experimentsList;
		const q = searchFilter.toLowerCase().trim();
		return experimentsList.filter((exp) => {
			return (
				exp.shortCode?.toLowerCase().includes(q) ||
				exp.name?.toLowerCase().includes(q) ||
				exp.variants?.some((v) => v.destinationUrl?.toLowerCase().includes(q))
			);
		});
	}, [experimentsList, searchFilter]);

	// Mutations
	const configureMutation = useConfigureAbTestMutation({
		onSuccess: async () => {
			setIsCreateOpen(false);
			setEditingExp(null);
			await queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			await queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchExperiments();
		},
	});

	const updateStatusMutation = useUpdateAbTestStatusMutation({
		onSuccess: async () => {
			setPromotingExp(null);
			await queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			await queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchExperiments();
		},
	});

	const deleteMutation = useDeleteAbTestMutation({
		onSuccess: async () => {
			setDeletingShortCode(null);
			await queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			await queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchExperiments();
		},
	});

	// Status Toggle
	const handleToggleStatus = (shortCode, currentStatus) => {
		const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
		updateStatusMutation.mutate({
			shortCode,
			payload: { status: newStatus },
		});
	};

	// Statistics
	const totalExperimentsCount = pagedAbTests?.totalElements ?? experimentsList.length;
	const activeExperimentsCount = experimentsList.filter(
		(e) => e.status === "ACTIVE"
	).length;
	const concludedExperimentsCount = experimentsList.filter(
		(e) => e.status === "CONCLUDED"
	).length;

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Header Banner */}
			<AbTestHeader
				onOpenNewTest={() => setIsCreateOpen(true)}
				onRefresh={() => refetchExperiments()}
				isRefreshing={expFetching}
			/>

			{/* 2. Overview KPI Cards */}
			<AbTestStatsCards
				totalExperiments={totalExperimentsCount}
				activeExperiments={activeExperimentsCount}
				concludedExperiments={concludedExperimentsCount}
			/>

			{/* 3. Toolbar & Search */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
				<h2 className="text-sm sm:text-base font-semibold font-heading text-foreground">
					Experiments List ({experimentsList.length})
				</h2>

				<div className="relative w-full sm:w-64">
					<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						value={searchFilter}
						onChange={(e) => setSearchFilter(e.target.value)}
						placeholder="Search experiments..."
						className="pl-9 h-8.5 text-xs bg-card"
					/>
				</div>
			</div>

			{/* 4. Experiments Grid */}
			<AbTestGrid
				experiments={filteredExperiments}
				isLoading={expLoading}
				onToggleStatus={handleToggleStatus}
				onEdit={(exp, shortCode) => setEditingExp({ exp, shortCode })}
				onPromoteWinner={(exp, shortCode) => setPromotingExp({ exp, shortCode })}
				onViewTelemetry={(exp, shortCode) => setTelemetryTarget({ exp, shortCode })}
				onDelete={(shortCode) => setDeletingShortCode(shortCode)}
				onCreateNew={() => setIsCreateOpen(true)}
			/>

			{/* 5. Modals & Dialogs */}
			<CreateAbTestModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				candidateUrls={candidateUrls}
				onSearchUrls={(query) => setLinkSearchQuery(query)}
				onSubmit={({ shortCode, payload }) => configureMutation.mutate({ shortCode, payload })}
				isSubmitting={configureMutation.isPending}
			/>

			<EditAbTestModal
				key={editingExp?.shortCode}
				open={!!editingExp}
				onOpenChange={(open) => !open && setEditingExp(null)}
				experiment={editingExp?.exp}
				shortCode={editingExp?.shortCode}
				onSubmit={({ shortCode, payload }) => configureMutation.mutate({ shortCode, payload })}
				isSubmitting={configureMutation.isPending}
			/>

			<PromoteWinnerDialog
				key={promotingExp?.shortCode}
				open={!!promotingExp}
				onOpenChange={(open) => !open && setPromotingExp(null)}
				experiment={promotingExp?.exp}
				shortCode={promotingExp?.shortCode}
				onConfirm={({ shortCode, winningVariant }) =>
					updateStatusMutation.mutate({
						shortCode,
						payload: { status: "CONCLUDED", winningVariant },
					})
				}
				isSubmitting={updateStatusMutation.isPending}
			/>

			<DeleteAbTestDialog
				open={!!deletingShortCode}
				onOpenChange={(open) => !open && setDeletingShortCode(null)}
				shortCode={deletingShortCode}
				onConfirm={(shortCode) => deleteMutation.mutate(shortCode)}
				isDeleting={deleteMutation.isPending}
			/>

			<AbTestAnalyticsModal
				open={!!telemetryTarget}
				onOpenChange={(open) => !open && setTelemetryTarget(null)}
				shortCode={telemetryTarget?.shortCode}
				experiment={telemetryTarget?.exp}
			/>
		</div>
	);
}

export default AbTestingPage;
