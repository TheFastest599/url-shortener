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
	IconFlask,
	IconArrowRight,
	IconPlus,
	IconCopy,
	IconCheck,
	IconCalendar,
	IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function DashboardAbTestsTable({
	abTests = [],
	isLoading = false,
	totalAbTests = 0,
	totalPages = 1,
	currentPage = 1,
	onPageChange,
	isFetching = false,
	searchQuery = "",
	onSearchChange,
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

	const displayTests = Array.isArray(abTests) ? abTests : abTests?.content || [];
	const count = totalAbTests || displayTests.length;

	return (
		<div className="space-y-3">
			{/* Header Strip */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="space-y-0.5">
					<div className="flex items-center gap-2">
						<IconFlask className="size-4 text-amber-500" />
						<h2 className="text-base sm:text-lg font-heading font-semibold text-foreground">
							A/B Traffic Split Experiments
						</h2>
						<Badge
							variant="secondary"
							className="font-mono text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-500 border border-amber-500/20"
						>
							{count}
						</Badge>
					</div>
					<p className="text-xs text-muted-foreground">
						Multi-variant edge routing experiments distributing traffic without client latency.
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<Link to={ROUTES.AB_TESTING}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 text-xs gap-1.5 font-medium cursor-pointer shadow-2xs"
						>
							<span>View all experiments</span>
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
							placeholder="Search backend directly by experiment name, shortcode, or destination URL..."
							className="pl-9 pr-8 h-9 text-xs bg-background/80 w-full font-mono border-border/70"
						/>
						{isFetching && (
							<div
								className="absolute right-3 top-1/2 -translate-y-1/2 size-2 rounded-full bg-amber-500 animate-ping"
								title="Querying backend..."
							/>
						)}
					</div>

					<div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground font-mono">
						<span>
							Showing {displayTests.length} of {count} experiments {searchQuery ? "(Search Match)" : ""}
						</span>
					</div>
				</div>

				<Table>
					<TableHeader className="bg-muted/40">
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-[300px] text-xs font-semibold">Experiment & Shortlink</TableHead>
							<TableHead className="text-xs font-semibold text-center">Status</TableHead>
							<TableHead className="text-xs font-semibold">Variant Traffic Distribution</TableHead>
							<TableHead className="text-xs font-semibold">Cookie Window</TableHead>
							<TableHead className="text-xs font-semibold">Created Date</TableHead>
							<TableHead className="text-xs font-semibold text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{isLoading ? (
							Array.from({ length: 3 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell colSpan={6} className="py-4">
										<Skeleton className="h-6 w-full" />
									</TableCell>
								</TableRow>
							))
						) : displayTests.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-32 text-center text-xs text-muted-foreground"
								>
									<div className="flex flex-col items-center justify-center gap-2">
										<IconFlask className="size-6 text-muted-foreground/40" />
										<span>
											{searchQuery
												? `No A/B split experiments found matching "${searchQuery}".`
												: "No A/B split experiments configured yet."}
										</span>
										{!searchQuery && (
											<Link to={ROUTES.AB_TESTING}>
												<Button size="sm" variant="outline" className="h-7 text-xs gap-1 mt-1 cursor-pointer">
													<IconPlus className="size-3" />
													<span>Create First Experiment</span>
												</Button>
											</Link>
										)}
									</div>
								</TableCell>
							</TableRow>
						) : (

							displayTests.slice(0, 5).map((test) => {
								const status = test.status || "ACTIVE";
								const variants = test.variants || [];
								const cookieDays = Math.round((test.cookieTtlSeconds || 2592000) / 86400);

								return (
									<TableRow key={test.id} className="hover:bg-muted/15 transition-colors">
										{/* Experiment & Shortlink */}
										<TableCell className="py-3 font-medium">
											<div className="space-y-0.5 min-w-0">
												<Link
													to={`/ab-testing/${test.id || test.shortCode}`}
													className="font-heading text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 hover:underline"
												>
													<IconFlask className="size-3.5 text-amber-500 shrink-0" />
													<span className="truncate max-w-[220px]">{test.name || "A/B Experiment"}</span>
												</Link>
												<div className="flex items-center gap-1.5">
													<Link
														to={`/redirect-links/${test.shortCode}`}
														className="font-mono text-[11px] text-primary hover:underline font-bold"
													>
														/r/{test.shortCode}
													</Link>
													<button
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

										{/* Status */}
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
															? "text-amber-500 border-amber-500/30"
															: "bg-muted text-muted-foreground"
												}`}
											>
												{status}
											</Badge>
										</TableCell>

										{/* Variant Distribution */}
										<TableCell className="py-3">
											<div className="flex items-center gap-1.5 flex-wrap">
												{variants.length > 0 ? (
													variants.map((v) => (
														<Badge
															key={v.id || v.key}
															variant="outline"
															className={`text-[10px] font-mono px-1.5 py-0 ${
																v.isControl
																	? "border-primary/40 text-primary bg-primary/5"
																	: "border-border text-foreground"
															}`}
															title={v.destinationUrl}
														>
															Var {v.key}: {v.weight}%
														</Badge>
													))
												) : (
													<span className="text-xs text-muted-foreground font-mono">
														50% / 50% split
													</span>
												)}
											</div>
										</TableCell>

										{/* Cookie Window */}
										<TableCell className="py-3 text-xs text-muted-foreground font-mono">
											<span>{cookieDays}d stickiness</span>
										</TableCell>

										{/* Created Date */}
										<TableCell className="py-3 text-xs text-muted-foreground font-mono">
											<div className="flex items-center gap-1.5">
												<IconCalendar className="size-3 opacity-60" />
												<span>
													{test.createdAt
														? new Date(test.createdAt).toLocaleDateString()
														: "Recent"}
												</span>
											</div>
										</TableCell>

										{/* Actions */}
										<TableCell className="py-3 text-right">
											<Link to={`/ab-testing/${test.id || test.shortCode}`}>
												<Button
													size="sm"
													variant="ghost"
													className="h-7 px-2.5 text-xs gap-1 cursor-pointer hover:text-primary"
												>
													<span>Inspect</span>
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

export default DashboardAbTestsTable;

