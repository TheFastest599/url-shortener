import * as React from "react";
import { Link } from "react-router-dom";
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
	IconFlask,
	IconArrowRight,
	IconCopy,
	IconCheck,
	IconCalendar,
	IconSearch,
	IconTrophy,
} from "@tabler/icons-react";
import { toast } from "sonner";

/**
 * Pure, reusable A/B Experiments table component with integrated search toolbar
 * and pagination. Used across both Dashboard and the dedicated A/B Testing page.
 */
export function AbTestsTable({
	abTests = [],
	isLoading = false,
	totalAbTests = 0,
	totalPages = 1,
	currentPage = 1,
	onPageChange,
	isFetching = false,
	searchQuery = "",
	onSearchChange,
	limit = null,
}) {
	const [copiedCode, setCopiedCode] = React.useState(null);

	const handleCopy = (shortCode, e) => {
		e.stopPropagation();
		const fullUrl = `${window.location.origin}/r/${shortCode}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedCode(shortCode);
		toast.success(`Copied /r/${shortCode} to clipboard!`);
		setTimeout(() => setCopiedCode(null), 2000);
	};

	const rawTests = Array.isArray(abTests) ? abTests : abTests?.content || [];
	const displayTests = limit ? rawTests.slice(0, limit) : rawTests;
	const count = totalAbTests || rawTests.length;

	return (
		<div className="space-y-3">
			{/* Table Card Container */}
			<div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
				{/* Integrated Search Toolbar */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-b border-border/60 bg-muted/20">
					<div className="relative flex-1 min-w-0">
						<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => onSearchChange?.(e.target.value)}
							placeholder="Search experiments by name, shortcode, or variant destination URL..."
							className="pl-9 pr-8 h-9 text-xs bg-background/80 w-full font-mono border-border/70"
						/>
						{isFetching && (
							<div
								className="absolute right-3 top-1/2 -translate-y-1/2 size-2 rounded-full bg-amber-500 animate-ping"
								title="Querying backend..."
							/>
						)}
					</div>

					<div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground font-mono">
						<span>
							Showing {displayTests.length} of {count} experiments {searchQuery ? "(filtered)" : ""}
						</span>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					<Table>
						<TableHeader className="bg-muted/40">
							<TableRow className="hover:bg-transparent">
								<TableHead className="w-[280px] text-xs font-semibold">Experiment & Shortlink</TableHead>
								<TableHead className="text-xs font-semibold text-center">Status</TableHead>
								<TableHead className="text-xs font-semibold min-w-[220px]">Traffic Distribution</TableHead>
								<TableHead className="text-xs font-semibold">Outcome</TableHead>
								<TableHead className="text-xs font-semibold">Cookie Window</TableHead>
								<TableHead className="text-xs font-semibold">Created Date</TableHead>
								<TableHead className="text-xs font-semibold text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{isLoading ? (
								Array.from({ length: 4 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={7} className="py-4">
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
								))
							) : displayTests.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-36 text-center text-xs text-muted-foreground"
									>
										<div className="flex flex-col items-center justify-center gap-2">
											<IconFlask className="size-7 text-muted-foreground/40" />
											<span className="font-medium text-foreground">
												{searchQuery
													? `No A/B split experiments found matching "${searchQuery}".`
													: "No A/B split experiments configured yet."}
											</span>
											<span className="text-[11px] text-muted-foreground max-w-sm">
												{searchQuery
													? "Try searching for a different keyword or alias."
													: "Multi-variant edge routing experiments will be listed here."}
											</span>
										</div>
									</TableCell>
								</TableRow>
							) : (
								displayTests.map((test) => {
									const status = test.status || "ACTIVE";
									const variants = test.variants || [];
									const cookieDays = Math.round((test.cookieTtlSeconds || 2592000) / 86400);
									const detailHref = `/ab-testing/${test.id || test.shortCode}`;

									return (
										<TableRow key={test.id} className="hover:bg-muted/15 transition-colors">
											{/* Experiment & Shortlink */}
											<TableCell className="py-3 font-medium">
												<div className="space-y-0.5 min-w-0">
													<Link
														to={detailHref}
														className="font-heading text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 hover:underline group"
														title="View complete A/B telemetry & workbench details"
													>
														<IconFlask className="size-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
														<span className="truncate max-w-[210px]">{test.name || "A/B Experiment"}</span>
													</Link>
													<div className="flex items-center gap-1.5">
														<Link
															to={`/redirect-links/${test.shortCode}`}
															className="font-mono text-[11px] text-primary hover:underline font-bold"
														>
															/r/{test.shortCode}
														</Link>
														<button
															type="button"
															onClick={(e) => handleCopy(test.shortCode, e)}
															className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
															title="Copy shortlink"
														>
															{copiedCode === test.shortCode ? (
																<IconCheck className="size-3 text-emerald-500" />
															) : (
																<IconCopy className="size-3" />
															)}
														</button>
													</div>
												</div>
											</TableCell>

											{/* Status Badge */}
											<TableCell className="py-3 text-center">
												<Badge
													variant={
														status === "ACTIVE"
															? "default"
															: status === "PAUSED"
																? "outline"
																: "secondary"
													}
													className={`text-[10px] font-semibold ${
														status === "ACTIVE"
															? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
															: status === "PAUSED"
																? "text-amber-500 border-amber-500/30 bg-amber-500/10"
																: "bg-purple-500/15 text-purple-500 border border-purple-500/30"
													}`}
												>
													{status}
												</Badge>
											</TableCell>

											{/* Traffic Distribution Multi-Pill & Bar */}
											<TableCell className="py-3">
												<div className="space-y-1.5">
													<div className="flex items-center gap-1.5 flex-wrap">
														{variants.length > 0 ? (
															variants.map((v) => (
																<Badge
																	key={v.id || v.variantKey || v.key}
																	variant="outline"
																	className={`text-[10px] font-mono px-1.5 py-0 ${
																		v.isControl
																			? "border-primary/40 text-primary bg-primary/5"
																			: "border-border text-foreground"
																	}`}
																	title={`Destination: ${v.destinationUrl}`}
																>
																	Var {v.variantKey || v.key}: {v.weight}% {v.isControl ? "(Control)" : ""}
																</Badge>
															))
														) : (
															<span className="text-xs text-muted-foreground font-mono">
																50% / 50% split
															</span>
														)}
													</div>
													{variants.length > 0 && (
														<div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden flex">
															{variants.map((v, idx) => {
																const colors = ["bg-primary", "bg-sky-500", "bg-indigo-500", "bg-emerald-500"];
																return (
																	<div
																		key={v.id || idx}
																		style={{ width: `${v.weight}%` }}
																		className={`h-full ${colors[idx % colors.length]}`}
																		title={`Variant ${v.variantKey || v.key}: ${v.weight}%`}
																	/>
																);
															})}
														</div>
													)}
												</div>
											</TableCell>

											{/* Winning Outcome */}
											<TableCell className="py-3 text-xs">
												{test.winningVariant ? (
													<Badge variant="outline" className="text-[10px] font-mono gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
														<IconTrophy className="size-3 text-amber-500" />
														<span>Winner: {test.winningVariant}</span>
													</Badge>
												) : status === "CONCLUDED" ? (
													<span className="text-muted-foreground text-[11px] font-mono">Concluded</span>
												) : (
													<span className="text-muted-foreground text-[11px] font-mono">Live Testing</span>
												)}
											</TableCell>

											{/* Cookie Window */}
											<TableCell className="py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
												<span>{cookieDays}d stickiness</span>
											</TableCell>

											{/* Created Date */}
											<TableCell className="py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
												<div className="flex items-center gap-1.5">
													<IconCalendar className="size-3 opacity-60" />
													<span>
														{test.createdAt
															? new Date(test.createdAt).toLocaleDateString()
															: "Recent"}
													</span>
												</div>
											</TableCell>

											{/* Actions: Link to complete details at /ab-testing/:id */}
											<TableCell className="py-3 text-right">
												<Link to={detailHref}>
													<Button
														size="sm"
														variant="ghost"
														className="h-7 px-2.5 text-xs gap-1 cursor-pointer text-primary hover:text-primary hover:bg-primary/10"
														title="View complete workbench details & telemetry"
													>
														<span>Details</span>
														<IconArrowRight className="size-3" />
													</Button>
												</Link>
											</TableCell>
										</TableRow>
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
						Page {currentPage} of {totalPages} ({totalAbTests} total)
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

export default AbTestsTable;
