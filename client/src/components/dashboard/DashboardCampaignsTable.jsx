import * as React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
	TableCell,
} from "@/components/ui/table";
import {
	IconFolder,
	IconLink,
	IconArrowRight,
	IconPlus,
	IconCalendar,
	IconSearch,
} from "@tabler/icons-react";

export function DashboardCampaignsTable({
	campaigns = [],
	isLoading = false,
	totalCampaigns = 0,
	totalPages = 1,
	currentPage = 1,
	onPageChange,
	isFetching = false,
	searchQuery = "",
	onSearchChange,
}) {
	const count = totalCampaigns || campaigns.length;

	return (
		<div className="space-y-3">
			{/* Header Strip */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="space-y-0.5">
					<div className="flex items-center gap-2">
						<IconFolder className="size-4 text-primary" />
						<h2 className="text-base sm:text-lg font-heading font-semibold text-foreground">
							Marketing Campaigns
						</h2>
						<Badge
							variant="secondary"
							className="font-mono text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20"
						>
							{count}
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground">
						Attribution channels and initiatives organizing your shortlink fleet.
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Link to={ROUTES.CAMPAIGNS}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs gap-1.5 font-medium cursor-pointer shadow-2xs"
						>
							<span>View all campaigns</span>
							<IconArrowRight className="size-3.5" />
						</Button>
					</Link>
				</div>
			</div>

			{/* Unified Table Card with Integrated Search Header */}
			<div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
				{/* Integrated Search & Action Toolbar */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-border/60 bg-muted/20">
					<div className="relative flex-1 min-w-0">
						<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => onSearchChange?.(e.target.value)}
							placeholder="Search backend directly by campaign name, target URL, or description..."
							className="pl-9 pr-8 h-9 text-xs bg-background/80 w-full font-mono border-border/70"
						/>
						{isFetching && (
							<div
								className="absolute right-3 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary animate-ping"
								title="Querying backend..."
							/>
						)}
					</div>

					<div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground font-mono">
						<span>
							Showing {campaigns.length} of {count} campaigns {searchQuery ? "(Search Match)" : ""}
						</span>
					</div>
				</div>

				<Table>
					<TableHeader className="bg-muted/40">
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-[300px] text-xs font-semibold">Campaign Name & Target</TableHead>
							<TableHead className="text-xs font-semibold text-center">Assigned Shortlinks</TableHead>
							<TableHead className="text-xs font-semibold">Description</TableHead>
							<TableHead className="text-xs font-semibold">Created Date</TableHead>
							<TableHead className="text-xs font-semibold text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{isLoading ? (
							Array.from({ length: 3 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell colSpan={5} className="py-4">
										<Skeleton className="h-6 w-full" />
									</TableCell>
								</TableRow>
							))
						) : campaigns.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-32 text-center text-xs text-muted-foreground"
								>
									<div className="flex flex-col items-center justify-center gap-2">
										<IconFolder className="size-6 text-muted-foreground/40" />
										<span>
											{searchQuery
												? `No marketing campaigns found matching "${searchQuery}".`
												: "No marketing campaigns created yet."}
										</span>
										{!searchQuery && (
											<Link to={ROUTES.CAMPAIGNS}>
												<Button size="sm" variant="outline" className="h-7 text-xs gap-1 mt-1 cursor-pointer">
													<IconPlus className="size-3" />
													<span>Create First Campaign</span>
												</Button>
											</Link>
										)}
									</div>
								</TableCell>
							</TableRow>
						) : (

							campaigns.map((campaign) => (
								<TableRow key={campaign.id} className="hover:bg-muted/15 transition-colors">
									{/* Campaign Name */}
									<TableCell className="py-3 font-medium">
										<div className="space-y-0.5 min-w-0">
											<Link
												to={`/campaigns/${campaign.id}`}
												className="font-heading text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 hover:underline"
											>
												<IconFolder className="size-3.5 text-primary shrink-0" />
												<span className="truncate max-w-[220px]">{campaign.name}</span>
											</Link>
											<p className="text-[11px] text-muted-foreground font-mono truncate max-w-[260px]">
												Target: {campaign.targetUrl || "Dynamic / Omnichannel"}
											</p>
										</div>
									</TableCell>

									{/* Assigned Shortlinks Count (Metadata from Core) */}
									<TableCell className="py-3 text-center">
										<Badge
											variant="secondary"
											className="text-[11px] font-mono gap-1 px-2 py-0.5"
										>
											<IconLink className="size-3 text-muted-foreground" />
											<span>{campaign.linkCount ?? 0} links</span>
										</Badge>
									</TableCell>

									{/* Description */}
									<TableCell className="py-3">
										<p className="text-xs text-muted-foreground truncate max-w-[280px]">
											{campaign.description || "No description provided."}
										</p>
									</TableCell>

									{/* Created Date */}
									<TableCell className="py-3 text-xs text-muted-foreground font-mono">
										<div className="flex items-center gap-1.5">
											<IconCalendar className="size-3 opacity-60" />
											<span>
												{campaign.createdAt
													? new Date(campaign.createdAt).toLocaleDateString()
													: "Recent"}
											</span>
										</div>
									</TableCell>

									{/* Actions */}
									<TableCell className="py-3 text-right">
										<Link to={`/campaigns/${campaign.id}`}>
											<Button
												size="sm"
												variant="ghost"
												className="h-7 px-2.5 text-xs gap-1 cursor-pointer hover:text-primary"
											>
												<span>Workbench</span>
												<IconArrowRight className="size-3" />
											</Button>
										</Link>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between px-2 pt-1 text-xs">
					<span className="text-muted-foreground font-mono">
						Page {currentPage} of {totalPages} ({totalCampaigns} total)
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage <= 1 || isFetching}
							onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
							className="h-8 px-3 text-xs cursor-pointer"
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage >= totalPages || isFetching}
							onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
							className="h-8 px-3 text-xs cursor-pointer"
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export default DashboardCampaignsTable;

