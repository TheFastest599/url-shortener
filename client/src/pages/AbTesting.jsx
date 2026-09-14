import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
	useAbTestsQuery,
	useUrlsQuery,
	useConfigureAbTestMutation,
} from "@/queries";
import { queryKeys } from "@/queries/queryKeys";

import {
	AbTestHeader,
	AbTestStatsCards,
	AbTestsTable,
	CreateAbTestModal,
} from "@/components/ab-testing";

/* Hallmark · page: A/B Testing Experiments · component-based architecture */

export function AbTestingPage() {
	const queryClient = useQueryClient();

	// Modal states
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);

	// Search & candidate links
	const [searchFilter, setSearchFilter] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [currentPage, setCurrentPage] = React.useState(1);
	const [pageSize] = React.useState(20);

	const [linkSearchQuery, setLinkSearchQuery] = React.useState("");
	const [debouncedLinkQuery, setDebouncedLinkQuery] = React.useState("");

	// Debounce table search
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchFilter.trim());
			setCurrentPage(1);
		}, 250);
		return () => clearTimeout(timer);
	}, [searchFilter]);

	// Debounce candidate search query for creation modal
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedLinkQuery(linkSearchQuery.trim());
		}, 300);
		return () => clearTimeout(timer);
	}, [linkSearchQuery]);

	// 1. Query for A/B Experiments with pagination & search
	const {
		data: pagedAbTests,
		isLoading: expLoading,
		isFetching: expFetching,
		refetch: refetchExperiments,
	} = useAbTestsQuery({
		page: currentPage - 1,
		size: pageSize,
		search: debouncedSearch || undefined,
		sortBy: "createdAt",
		direction: "DESC",
	});

	const experimentsList = React.useMemo(() => {
		return Array.isArray(pagedAbTests)
			? pagedAbTests
			: pagedAbTests?.content || [];
	}, [pagedAbTests]);

	// 2. Candidate URLs query for the creation modal
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

	// Create mutation
	const configureMutation = useConfigureAbTestMutation({
		onSuccess: async () => {
			setIsCreateOpen(false);
			await queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			await queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchExperiments();
		},
	});

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

			{/* 3. Experiments Table with Integrated Search */}
			<AbTestsTable
				abTests={pagedAbTests}
				isLoading={expLoading}
				isFetching={expFetching}
				totalAbTests={totalExperimentsCount}
				totalPages={pagedAbTests?.totalPages ?? 1}
				currentPage={currentPage}
				onPageChange={setCurrentPage}
				searchQuery={searchFilter}
				onSearchChange={setSearchFilter}
			/>

			{/* 4. Create Modal */}
			<CreateAbTestModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				candidateUrls={candidateUrls}
				onSearchUrls={(query) => setLinkSearchQuery(query)}
				onSubmit={({ shortCode, payload }) => configureMutation.mutate({ shortCode, payload })}
				isSubmitting={configureMutation.isPending}
			/>
		</div>
	);
}

export default AbTestingPage;
