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
	IconSearch,
	IconCopy,
	IconCheck,
	IconFolder,
	IconFlask,
	IconChevronDown,
	IconChevronUp,
	IconChevronLeft,
	IconChevronRight,
	IconAdjustments,
	IconChartBar,
	IconQrcode,
	IconExternalLink,
	IconTrash,
	IconArrowRight,
	IconLink,
} from "@tabler/icons-react";
import { RelationalTray } from "./RelationalTray";
import { toast } from "sonner";

/**
 * Pure, reusable Shortlinks table component with integrated search toolbar
 * and pagination. Used across both Dashboard and Redirect Links workbench.
 */
export function LinksTable({
	urls = [],
	totalLinks = 0,
	totalItems = null,
	totalPages = 1,
	currentPage = 1,
	pageSize = 10,
	onPageChange,
	isLoading = false,
	isFetching = false,
	searchQuery = "",
	onSearchChange,
	statusFilter = null,
	onStatusFilterChange = null,
	campaignMap = {},
	highlightCode = null,
	onToggleActive,
	onOpenQrModal,
	onDeleteClick,
}) {
	const [expandedRowId, setExpandedRowId] = React.useState(null);
	const [copiedId, setCopiedId] = React.useState(null);

	const count = totalItems !== null ? totalItems : totalLinks;
	const rawUrls = Array.isArray(urls) ? urls : urls?.content || [];

	const handleCopy = (shortCode, id, e) => {
		e?.stopPropagation();
		const fullUrl = `${window.location.origin}/r/${shortCode}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedId(id);
		toast.success("Short URL copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	return (
		<div className="space-y-3">
			{/* Unified Card Container with Integrated Search Header & Table */}
			<div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
				{/* Integrated Search & Results Toolbar */}
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 border-b border-border/60 bg-muted/20">
					<div className="relative flex-1 min-w-0">
						<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => onSearchChange?.(e.target.value)}
							placeholder="Search backend directly by shortcode or destination URL..."
							className="pl-9 pr-8 h-9 text-xs bg-background/80 w-full font-mono border-border/70"
						/>
						{isFetching && (
							<div
								className="absolute right-3 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary animate-ping"
								title="Querying backend..."
							/>
						)}
					</div>

					<div className="flex flex-wrap items-center gap-2.5 shrink-0">
						{/* Optional Status Pills */}
						{onStatusFilterChange && (
							<div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
								{[
									{ label: "All", value: "all" },
									{ label: "Active", value: "active" },
									{ label: "Inactive", value: "inactive" },
								].map((item) => (
									<button
										key={item.value}
										onClick={() => onStatusFilterChange(item.value)}
										className={`px-2.5 py-1 font-medium rounded-md transition-all cursor-pointer text-[11px] ${
											statusFilter === item.value
												? "bg-background text-foreground shadow-2xs font-semibold"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										{item.label}
									</button>
								))}
							</div>
						)}

						<span className="text-xs text-muted-foreground font-mono">
							Showing {rawUrls.length} of {count} links {searchQuery ? "(Search Match)" : ""}
						</span>
					</div>
				</div>

				<div className="overflow-x-auto">
					<Table>
						<TableHeader className="bg-muted/40">
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-[300px] text-xs font-semibold">Shortlink & Target</TableHead>
								<TableHead className="text-xs font-semibold">Campaign Attribution</TableHead>
								<TableHead className="text-xs font-semibold">Routing Engine</TableHead>
								<TableHead className="text-xs font-semibold text-center">Status</TableHead>
								<TableHead className="text-xs font-semibold text-right">Relations & Actions</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{isLoading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={5} className="py-4">
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
								))
							) : rawUrls.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="h-36 text-center text-xs text-muted-foreground">
										<div className="flex flex-col items-center justify-center gap-2">
											<IconLink className="size-7 text-muted-foreground/40" />
											<span className="font-medium text-foreground">
												{searchQuery
													? `No shortlinks found matching "${searchQuery}".`
													: "No shortlinks available."}
											</span>
											<span className="text-[11px] text-muted-foreground max-w-sm">
												{searchQuery
													? "Try searching for a different keyword or shortcode."
													: "Create your first short URL to begin routing traffic."}
											</span>
										</div>
									</TableCell>
								</TableRow>
							) : (
								rawUrls.map((url) => {
									const id = url.id || url.shortCode;
									const fullUrl = `${window.location.origin}/r/${url.shortCode}`;
									const campaign = url.campaignId ? campaignMap[url.campaignId] : null;
									const isExpanded = expandedRowId === id;
									const isHighlighted = highlightCode === url.shortCode;

									return (
										<React.Fragment key={id}>
											<TableRow
												onClick={() => setExpandedRowId(isExpanded ? null : id)}
												className={`cursor-pointer transition-colors ${
													isHighlighted
														? "bg-primary/5 border-l-2 border-primary"
														: isExpanded
														? "bg-muted/30"
														: "hover:bg-muted/15"
												}`}
											>
												{/* Shortlink & Target */}
												<TableCell className="py-3 font-medium">
													<div className="space-y-0.5 min-w-0">
														<div className="flex items-center gap-2">
															<Link
																to={`/redirect-links/${url.shortCode}`}
																onClick={(e) => e.stopPropagation()}
																className="font-mono text-xs font-bold text-primary hover:underline cursor-pointer"
																title="View Link Details"
															>
																/r/{url.shortCode}
															</Link>
															<button
																onClick={(e) => handleCopy(url.shortCode, id, e)}
																className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
																title="Copy shortlink"
															>
																{copiedId === id ? (
																	<IconCheck className="size-3.5 text-emerald-500" />
																) : (
																	<IconCopy className="size-3.5" />
																)}
															</button>
															{url.title && (
																<span className="hidden sm:inline text-[11px] text-muted-foreground font-medium truncate max-w-[130px]">
																	· {url.title}
																</span>
															)}
														</div>
														<p
															className="text-[11px] text-muted-foreground truncate max-w-[280px]"
															title={url.destinationUrl}
														>
															{url.destinationUrl}
														</p>
													</div>
												</TableCell>

												{/* Campaign Attribution */}
												<TableCell className="py-3">
													{url.campaignId || url.campaignName ? (
														<Link
															to={url.campaignId ? `/campaigns/${url.campaignId}` : ROUTES.CAMPAIGNS}
															onClick={(e) => e.stopPropagation()}
															title={`Open ${url.campaignName || campaign?.name || "Campaign"} workbench`}
														>
															<Badge
																variant="secondary"
																className="text-[10px] gap-1 font-medium hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
															>
																<IconFolder className="size-3 text-primary shrink-0" />
																<span className="truncate max-w-[120px]">
																	{url.campaignName || campaign?.name || "Campaign"}
																</span>
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
															to={url.abTestId ? `/ab-testing/${url.abTestId}` : ROUTES.AB_TESTING}
															onClick={(e) => e.stopPropagation()}
															title={url.abTestName ? `Experiment: ${url.abTestName}` : "View A/B Experiment"}
														>
															<Badge
																variant="outline"
																className="text-[10px] text-amber-500 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer gap-1 max-w-[140px]"
															>
																<IconFlask className="size-3 shrink-0" />
																<span className="truncate">{url.abTestName || "A/B Split"}</span>
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

												{/* Live Active Status Toggle / Badge */}
												<TableCell className="py-3 text-center whitespace-nowrap">
													{onToggleActive ? (
														<button
															onClick={(e) => onToggleActive(url, e)}
															className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer border ${
																url.isActive !== false
																	? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20"
																	: "bg-muted text-muted-foreground border-border hover:text-foreground"
															}`}
															title="Click to toggle status real-time"
														>
															{url.isActive !== false ? "Active" : "Disabled"}
														</button>
													) : (
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
													)}
												</TableCell>

												{/* Actions & Relations Dropdown */}
												<TableCell className="py-3 text-right whitespace-nowrap">
													<div
														className="flex items-center justify-end gap-1.5"
														onClick={(e) => e.stopPropagation()}
													>
														{/* Inspect Relations Button */}
														<Button
															size="sm"
															variant={isExpanded ? "secondary" : "ghost"}
															onClick={() => setExpandedRowId(isExpanded ? null : id)}
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
															className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
															title="Configure shortlink"
														>
															<IconAdjustments className="size-3.5" />
														</Link>

														{/* Analytics Link */}
														<Link
															to={`/analytics/${url.shortCode}`}
															className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
															title="Telemetry & charts"
														>
															<IconChartBar className="size-3.5" />
														</Link>

														{/* QR Code Action (if provided) */}
														{onOpenQrModal && (
															<button
																onClick={() => onOpenQrModal(fullUrl)}
																className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
																title="Generate QR code"
															>
																<IconQrcode className="size-3.5" />
															</button>
														)}

														{/* Test Redirection External */}
														<a
															href={fullUrl}
															target="_blank"
															rel="noreferrer"
															className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
															title="Test redirection in new tab"
														>
															<IconExternalLink className="size-3.5" />
														</a>

														{/* Delete Action (if provided) */}
														{onDeleteClick && (
															<button
																onClick={() => onDeleteClick(url)}
																className="inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer"
																title="Delete short link"
															>
																<IconTrash className="size-3.5" />
															</button>
														)}
													</div>
												</TableCell>
											</TableRow>

											{/* Expanded Relational Tray */}
											{isExpanded && (
												<TableRow className="bg-transparent hover:bg-transparent">
													<TableCell colSpan={5} className="p-0">
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
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between px-2 pt-1 text-xs">
					<span className="text-muted-foreground font-mono">
						Page {currentPage} of {totalPages} ({count} total)
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage <= 1 || isFetching}
							onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
							className="h-8 px-3 text-xs cursor-pointer"
						>
							<IconChevronLeft className="size-3.5 mr-1" />
							<span>Previous</span>
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage >= totalPages || isFetching}
							onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
							className="h-8 px-3 text-xs cursor-pointer"
						>
							<span>Next</span>
							<IconChevronRight className="size-3.5 ml-1" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export default LinksTable;
