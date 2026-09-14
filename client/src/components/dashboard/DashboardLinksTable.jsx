import * as React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
	IconSearch,
	IconCopy,
	IconCheck,
	IconFolder,
	IconFlask,
	IconChevronDown,
	IconChevronUp,
	IconAdjustments,
	IconChartBar,
	IconArrowRight,
} from "@tabler/icons-react";
import { RelationalTray } from "./RelationalTray";
import { toast } from "sonner";

export function DashboardLinksTable({
	urls = [],
	totalLinks = 0,
	totalPages = 1,
	currentPage = 1,
	onPageChange,
	isLoading = false,
	isFetching = false,
	searchQuery = "",
	onSearchChange,
	campaignMap = {},
	onToggleActive,
}) {
	const [expandedRowId, setExpandedRowId] = React.useState(null);
	const [copiedId, setCopiedId] = React.useState(null);

	const handleCopy = (shortCode, id, e) => {
		e.stopPropagation();
		const fullUrl = `${window.location.origin}/r/${shortCode}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedId(id);
		toast.success("Shortlink copied to clipboard!");
		setTimeout(() => setCopiedId(null), 2000);
	};

	return (
		<div className="space-y-3">
			{/* Search & Action Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-xl p-3 shadow-2xs">
				<div className="relative flex-1 min-w-0">
					<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Search backend directly by shortcode or destination URL..."
						className="pl-9 pr-8 h-9 text-xs bg-background/80 w-full font-mono"
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
						Showing {urls.length} of {totalLinks} links {searchQuery ? "(Search Match)" : ""}
					</span>
				</div>
			</div>

			{/* The Official Shadcn Table */}
			<div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
				<Table>
					<TableHeader className="bg-muted/40">
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-[280px] text-xs font-semibold">Shortlink & Target</TableHead>
							<TableHead className="text-xs font-semibold">Campaign Attribution</TableHead>
							<TableHead className="text-xs font-semibold">Routing Engine</TableHead>
							<TableHead className="text-xs font-semibold text-center">7D Velocity</TableHead>
							<TableHead className="text-xs font-semibold text-center">Status</TableHead>
							<TableHead className="text-xs font-semibold text-right">Relations & Actions</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell colSpan={6} className="py-4">
										<Skeleton className="h-6 w-full" />
									</TableCell>
								</TableRow>
							))
						) : urls.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="h-40 text-center text-xs text-muted-foreground">
									{searchQuery
										? `No shortlinks found matching "${searchQuery}".`
										: "No shortlinks found in this campaign filter."}
								</TableCell>
							</TableRow>
						) : (
							urls.map((url) => {
								const campaign = url.campaignId ? campaignMap[url.campaignId] : null;
								const isExpanded = expandedRowId === url.id;

								return (
									<React.Fragment key={url.id || url.shortCode}>
										<TableRow
											onClick={() => setExpandedRowId(isExpanded ? null : url.id)}
											className={`cursor-pointer transition-colors ${
												isExpanded ? "bg-muted/30" : "hover:bg-muted/15"
											}`}
										>
											{/* Shortlink & Target */}
											<TableCell className="py-3 font-medium">
												<div className="space-y-0.5 min-w-0">
													<div className="flex items-center gap-2">
														<Link
															to={`/redirect-links/${url.shortCode}`}
															onClick={(e) => e.stopPropagation()}
															className="font-mono text-xs font-bold text-primary hover:underline"
														>
															/r/{url.shortCode}
														</Link>
														<button
															onClick={(e) => handleCopy(url.shortCode, url.id, e)}
															className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
															title="Copy shortlink"
														>
															{copiedId === url.id ? (
																<IconCheck className="size-3.5 text-emerald-500" />
															) : (
																<IconCopy className="size-3.5" />
															)}
														</button>
													</div>
													<p
														className="text-[11px] text-muted-foreground truncate max-w-[260px]"
														title={url.destinationUrl}
													>
														{url.destinationUrl}
													</p>
												</div>
											</TableCell>

											{/* Campaign Attribution */}
											<TableCell className="py-3">
												{campaign ? (
													<Link
														to={`/campaigns/${campaign.id}`}
														onClick={(e) => e.stopPropagation()}
														title={`Open ${campaign.name} campaign workbench`}
													>
														<Badge
															variant="secondary"
															className="text-[10px] gap-1 font-medium hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
														>
															<IconFolder className="size-3 text-primary shrink-0" />
															<span className="truncate max-w-[120px]">{campaign.name}</span>
															<IconArrowRight className="size-2.5 opacity-60" />
														</Badge>
													</Link>
												) : (
													<Badge
														variant="outline"
														className="text-[10px] text-muted-foreground/70 border-dashed"
													>
														Standalone
													</Badge>
												)}
											</TableCell>

											{/* Routing Engine */}
											<TableCell className="py-3">
												{url.isAbTest ? (
													<Link
														to={ROUTES.AB_TESTING}
														onClick={(e) => e.stopPropagation()}
													>
														<Badge
															variant="outline"
															className="text-[10px] text-amber-500 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer gap-1"
														>
															<IconFlask className="size-3 shrink-0" />
															<span>A/B Split</span>
														</Badge>
													</Link>
												) : (
													<Badge
														variant="outline"
														className="text-[10px] text-emerald-500 border-emerald-500/30 gap-1"
													>
														<span>⚡ Direct</span>
													</Badge>
												)}
											</TableCell>

											{/* 7D Velocity */}
											<TableCell className="py-3 text-center">
												<div className="flex flex-col items-center justify-center gap-1">
													<span className="font-mono text-xs font-semibold text-foreground">
														{(url.clickCount || 0).toLocaleString()} clicks
													</span>
													<div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
														<div
															className="h-full bg-primary/70 rounded-full transition-all"
															style={{
																width: `${Math.min(100, Math.max((url.clickCount ? 15 : 0), ((url.clickCount || 0) / Math.max(1, totalLinks)) * 100))}%`
															}}
														/>
													</div>
												</div>
											</TableCell>

											{/* Live Active Status Toggle */}
											<TableCell className="py-3 text-center">
												<button
													onClick={(e) => onToggleActive(url, e)}
													className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer border ${
														url.isActive !== false
															? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
															: "bg-muted text-muted-foreground border-border hover:text-foreground"
													}`}
													title="Click to toggle status real-time"
												>
													{url.isActive !== false ? "Active" : "Disabled"}
												</button>
											</TableCell>

											{/* Actions & Relations Dropdown */}
											<TableCell className="py-3 text-right">
												<div
													className="flex items-center justify-end gap-1.5"
													onClick={(e) => e.stopPropagation()}
												>
													{/* Inspect Relations Button */}
													<Button
														size="sm"
														variant={isExpanded ? "secondary" : "ghost"}
														onClick={() => setExpandedRowId(isExpanded ? null : url.id)}
														className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
														title="Inspect campaign & experiment relations"
													>
														<span>Relations</span>
														{isExpanded ? (
															<IconChevronUp className="size-3" />
														) : (
															<IconChevronDown className="size-3" />
														)}
													</Button>

													{/* Config Link */}
													<Link
														to={`/redirect-links/${url.shortCode}`}
														className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
														title="Configure shortlink"
													>
														<IconAdjustments className="size-3.5" />
													</Link>

													{/* Analytics Link */}
													<Link
														to={`/analytics/${url.shortCode}`}
														className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
														title="Telemetry & charts"
													>
														<IconChartBar className="size-3.5" />
													</Link>
												</div>
											</TableCell>
										</TableRow>

										{/* Expanded Relational Tray */}
										{isExpanded && (
											<TableRow className="bg-transparent hover:bg-transparent">
												<TableCell colSpan={6} className="p-0">
													<RelationalTray url={url} campaign={campaign} />
												</TableCell>
											</TableRow>
										)}
									</React.Fragment>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between px-2 pt-1 text-xs">
					<span className="text-muted-foreground font-mono">
						Page {currentPage} of {totalPages} ({totalLinks} total matching)
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage <= 1 || isFetching}
							onClick={() => onPageChange(Math.max(1, currentPage - 1))}
							className="h-8 px-3 text-xs cursor-pointer"
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage >= totalPages || isFetching}
							onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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

export default DashboardLinksTable;
