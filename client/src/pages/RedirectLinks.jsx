import * as React from "react";
import { Link, useParams, useOutletContext } from "react-router-dom";
import { useUrlsQuery, useDeleteUrlMutation } from "@/queries";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	IconLink,
	IconPlus,
	IconSearch,
	IconCopy,
	IconCheck,
	IconQrcode,
	IconChartBar,
	IconExternalLink,
	IconTrash,
	IconChevronLeft,
	IconChevronRight,
	IconArrowsSort,
	IconFilter,
	IconSparkles,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function RedirectLinksPage() {
	const { shortCode: routeParamCode } = useParams();
	const { urls = [], onOpenCreateModal, onOpenQrModal } = useOutletContext() || {};

	const [searchQuery, setSearchQuery] = React.useState(routeParamCode || "");
	const [debouncedSearch, setDebouncedSearch] = React.useState(routeParamCode || "");
	const [statusFilter, setStatusFilter] = React.useState("all");
	const [sortBy, setSortBy] = React.useState("newest");
	const [currentPage, setCurrentPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);
	const [copiedId, setCopiedId] = React.useState(null);
	const [deleteTarget, setDeleteTarget] = React.useState(null);

	// Debounce search query input (250ms)
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
			setCurrentPage(1); // reset to page 1 on new search
		}, 250);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Update search if route param changes
	React.useEffect(() => {
		if (routeParamCode) {
			setSearchQuery(routeParamCode);
			setDebouncedSearch(routeParamCode);
		}
	}, [routeParamCode]);

	const queryParams = React.useMemo(() => {
		const p = {
			page: currentPage - 1,
			size: pageSize,
		};
		if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
		if (statusFilter !== "all") p.status = statusFilter;
		if (sortBy === "alpha_asc") {
			p.sortBy = "shortCode";
			p.direction = "ASC";
		} else if (sortBy === "alpha_desc") {
			p.sortBy = "shortCode";
			p.direction = "DESC";
		} else if (sortBy === "oldest") {
			p.sortBy = "createdAt";
			p.direction = "ASC";
		} else {
			p.sortBy = "createdAt";
			p.direction = "DESC";
		}
		return p;
	}, [currentPage, pageSize, debouncedSearch, statusFilter, sortBy]);

	const { data: serverData, isLoading, refetch: refetchUrls } = useUrlsQuery(queryParams);

	const deleteMutation = useDeleteUrlMutation({
		onSuccess: () => {
			toast.success("Short URL deleted successfully");
			setDeleteTarget(null);
			refetchUrls?.();
		},
	});

	const handleCopy = (shortCode, id) => {
		const fullUrl = `http://localhost:8080/r/${shortCode}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedId(id);
		toast.success("Short URL copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const extractHostname = (urlStr) => {
		try {
			return new URL(urlStr).hostname;
		} catch {
			return "external link";
		}
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return "—";
		try {
			return new Date(dateStr).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return "—";
		}
	};

	// Extract content, total elements, and total pages from backend response
	const paginatedUrls = Array.isArray(serverData) ? serverData : serverData?.content || [];
	const totalItems = Array.isArray(serverData) ? serverData.length : serverData?.totalElements || 0;
	const totalPages = Math.max(1, Array.isArray(serverData) ? Math.ceil(totalItems / pageSize) : serverData?.totalPages || 1);
	const startIndex = (currentPage - 1) * pageSize;

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
							{urls.length} Total
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

			{/* Search, Filter & Sort Controls Toolbar */}
			<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card border border-border/70 rounded-xl p-3 shadow-2xs">
				{/* Search Bar with Icon */}
				<div className="relative flex-1 min-w-0">
					<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by slug, title, or destination..."
						className="pl-9 h-9 text-xs bg-background/80 w-full"
					/>
				</div>

				{/* Filters and Sorting Cluster */}
				<div className="flex flex-wrap items-center gap-2 shrink-0">
					{/* Status Pill Filter */}
					<div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
						{[
							{ label: "All", value: "all" },
							{ label: "Active", value: "active" },
							{ label: "Inactive", value: "inactive" },
						].map((item) => (
							<button
								key={item.value}
								onClick={() => {
									setStatusFilter(item.value);
									setCurrentPage(1);
								}}
								className={`px-3 py-1 font-medium rounded-md transition-all cursor-pointer ${
									statusFilter === item.value
										? "bg-background text-foreground shadow-2xs font-semibold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{item.label}
							</button>
						))}
					</div>

					{/* Sorting Dropdown */}
					<div className="flex items-center gap-1.5">
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="h-8.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-2xs"
						>
							<option value="newest">Sort: Newest First</option>
							<option value="oldest">Sort: Oldest First</option>
							<option value="most_clicks">Sort: Most Clicks</option>
							<option value="least_clicks">Sort: Least Clicks</option>
							<option value="alpha_asc">Sort: A-Z Alphabetical</option>
						</select>
					</div>

					{/* Page Size Dropdown */}
					<select
						value={pageSize}
						onChange={(e) => {
							setPageSize(Number(e.target.value));
							setCurrentPage(1);
						}}
						className="h-8.5 rounded-lg border border-border bg-background px-2 text-xs font-medium text-muted-foreground outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-2xs"
					>
						<option value={10}>10 / page</option>
						<option value={20}>20 / page</option>
						<option value={50}>50 / page</option>
					</select>
				</div>
			</div>

			{/* Links Table */}
			<Card className="border-border/70 bg-card overflow-hidden shadow-xs">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse">
						<thead>
							<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
								<th className="py-3 px-4">Shortcode & Target</th>
								<th className="py-3 px-4 hidden md:table-cell">Host Domain</th>
								<th className="py-3 px-4 text-center">Clicks</th>
								<th className="py-3 px-4 hidden sm:table-cell">Created</th>
								<th className="py-3 px-4 text-center">Status</th>
								<th className="py-3 px-4 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/50">
							{paginatedUrls.length > 0 ? (
								paginatedUrls.map((url) => {
									const id = url.id || url.shortCode;
									const fullUrl = `http://localhost:8080/r/${url.shortCode}`;
									const hostname = extractHostname(url.destinationUrl);
									const isHighlighted = routeParamCode === url.shortCode;

									return (
										<tr
											key={id}
											className={`hover:bg-muted/30 transition-colors group ${
												isHighlighted ? "bg-primary/5 border-l-2 border-primary" : ""
											}`}
										>
											{/* Shortcode & Target */}
											<td className="py-3.5 px-4 max-w-xs sm:max-w-md">
												<div className="flex items-center gap-2">
													<Link
														to={`/redirect-links/${url.shortCode}`}
														className="font-mono font-bold text-primary hover:underline text-xs sm:text-sm cursor-pointer"
														title="View Link Details"
													>
														/r/{url.shortCode}
													</Link>
													<button
														onClick={() => handleCopy(url.shortCode, id)}
														className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
														title="Copy short link"
													>
														{copiedId === id ? (
															<IconCheck className="size-3.5 text-emerald-500" />
														) : (
															<IconCopy className="size-3.5" />
														)}
													</button>
													{url.title && (
														<span className="hidden sm:inline text-[11px] text-muted-foreground font-medium truncate max-w-[150px]">
															· {url.title}
														</span>
													)}
												</div>
												<div className="mt-1 truncate text-[11px] text-muted-foreground">
													<span title={url.destinationUrl}>{url.destinationUrl}</span>
												</div>
											</td>

											{/* Host Domain */}
											<td className="py-3.5 px-4 hidden md:table-cell text-muted-foreground whitespace-nowrap">
												<span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono">
													{hostname}
												</span>
											</td>

											{/* Clicks */}
											<td className="py-3.5 px-4 text-center whitespace-nowrap">
												<Badge variant="secondary" className="font-mono text-[11px] px-2 py-0.5">
													{url.clickCount ?? 0}
												</Badge>
											</td>

											{/* Created Date */}
											<td className="py-3.5 px-4 hidden sm:table-cell text-muted-foreground whitespace-nowrap">
												{formatDate(url.createdAt)}
											</td>

											{/* Status */}
											<td className="py-3.5 px-4 text-center whitespace-nowrap">
												<Badge
													variant="outline"
													className={`text-[10px] ${
														url.isActive !== false
															? "text-emerald-500 border-emerald-500/30"
															: "text-muted-foreground border-border"
													}`}
												>
													{url.isActive !== false ? "Active" : "Inactive"}
												</Badge>
											</td>

											{/* Actions Cluster */}
											<td className="py-3.5 px-4 text-right whitespace-nowrap">
												<div className="flex items-center justify-end gap-1 sm:gap-1.5">
													{/* View Analytics Button */}
													<Link
														to={`/analytics/${url.shortCode}`}
														className="inline-flex size-7 sm:size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
														title="View deep telemetry"
													>
														<IconChartBar className="size-3.5 sm:size-4" />
													</Link>

													{/* QR Code Modal Trigger */}
													<button
														onClick={() => onOpenQrModal?.(fullUrl)}
														className="inline-flex size-7 sm:size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
														title="Generate QR code"
													>
														<IconQrcode className="size-3.5 sm:size-4" />
													</button>

													{/* External Test Link */}
													<a
														href={fullUrl}
														target="_blank"
														rel="noreferrer"
														className="inline-flex size-7 sm:size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
														title="Test 302 redirection"
													>
														<IconExternalLink className="size-3.5 sm:size-4" />
													</a>

													{/* Delete Button */}
													<button
														onClick={() => setDeleteTarget(url)}
														className="inline-flex size-7 sm:size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer"
														title="Delete short link"
													>
														<IconTrash className="size-3.5 sm:size-4" />
													</button>
												</div>
											</td>
										</tr>
									);
								})
							) : (
								<tr>
									<td colSpan={6} className="py-12 text-center">
										<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
											<IconLink className="size-6" />
										</div>
										<h3 className="font-heading text-sm font-semibold text-foreground">
											No Short Links Found
										</h3>
										<p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
											{debouncedSearch
												? `No results match "${debouncedSearch}". Try a different search term.`
												: "Create your first short URL to begin generating clicks and tracking analytics."}
										</p>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination Footer Controls */}
				{totalItems > 0 && (
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/70 px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
						<div>
							Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{" "}
							<span className="font-semibold text-foreground">
								{Math.min(startIndex + pageSize, totalItems)}
							</span>{" "}
							of <span className="font-semibold text-foreground">{totalItems}</span> links
						</div>

						<div className="flex items-center gap-1.5 self-end sm:self-auto">
							<Button
								variant="outline"
								size="sm"
								disabled={currentPage <= 1}
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								className="h-8 gap-1 text-xs px-2.5 cursor-pointer disabled:cursor-not-allowed"
							>
								<IconChevronLeft className="size-3.5" />
								<span>Prev</span>
							</Button>

							<div className="flex items-center gap-1 px-1">
								{Array.from({ length: totalPages }, (_, i) => i + 1)
									.filter(
										(p) =>
											p === 1 ||
											p === totalPages ||
											Math.abs(p - currentPage) <= 1
									)
									.map((p, idx, arr) => {
										const prev = arr[idx - 1];
										return (
											<React.Fragment key={p}>
												{prev && p - prev > 1 && (
													<span className="px-1 text-muted-foreground">...</span>
												)}
												<button
													onClick={() => setCurrentPage(p)}
													className={`size-8 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
														currentPage === p
															? "bg-primary text-primary-foreground"
															: "hover:bg-muted text-muted-foreground hover:text-foreground"
													}`}
												>
													{p}
												</button>
											</React.Fragment>
										);
									})}
							</div>

							<Button
								variant="outline"
								size="sm"
								disabled={currentPage >= totalPages}
								onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
								className="h-8 gap-1 text-xs px-2.5 cursor-pointer disabled:cursor-not-allowed"
							>
								<span>Next</span>
								<IconChevronRight className="size-3.5" />
							</Button>
						</div>
					</div>
				)}
			</Card>

			{/* Delete Confirmation Dialog */}
			<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Short URL</DialogTitle>
						<DialogDescription className="text-xs">
							Are you sure you want to delete{" "}
							<span className="font-mono font-bold text-foreground">
								/r/{deleteTarget?.shortCode}
							</span>
							? This will immediately disable all redirect traffic and cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:gap-0 mt-4">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDeleteTarget(null)}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							disabled={deleteMutation.isPending}
							onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id || deleteTarget.shortCode)}
							className="text-xs font-semibold"
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default RedirectLinksPage;
