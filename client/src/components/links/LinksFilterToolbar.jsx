import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";

export function LinksFilterToolbar({
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	sortBy,
	onSortByChange,
	pageSize,
	onPageSizeChange,
}) {
	return (
		<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card border border-border/70 rounded-xl p-3 shadow-2xs">
			{/* Search Bar */}
			<div className="relative flex-1 min-w-0">
				<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<Input
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
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
							onClick={() => onStatusFilterChange(item.value)}
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
						onChange={(e) => onSortByChange(e.target.value)}
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
					onChange={(e) => onPageSizeChange(Number(e.target.value))}
					className="h-8.5 rounded-lg border border-border bg-background px-2 text-xs font-medium text-muted-foreground outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-2xs"
				>
					<option value={10}>10 / page</option>
					<option value={20}>20 / page</option>
					<option value={50}>50 / page</option>
				</select>
			</div>
		</div>
	);
}

export default LinksFilterToolbar;
