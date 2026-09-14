import * as React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	IconLink,
	IconCopy,
	IconCheck,
	IconQrcode,
	IconChartBar,
	IconAdjustments,
	IconExternalLink,
	IconTrash,
	IconChevronLeft,
	IconChevronRight,
	IconFolder,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function LinksTable({
	urls = [],
	totalItems = 0,
	totalPages = 1,
	currentPage = 1,
	pageSize = 10,
	onPageChange,
	isLoading = false,
	campaignMap = {},
	highlightCode = null,
	onOpenQrModal,
	onDeleteClick,
}) {
	const [copiedId, setCopiedId] = React.useState(null);

	const handleCopy = (shortCode, id) => {
		const fullUrl = `${window.location.origin}/r/${shortCode}`;
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

	const startIndex = (currentPage - 1) * pageSize;

	return (
		<Card className="border-border/70 bg-card overflow-hidden shadow-xs">
			<div className="overflow-x-auto">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
							<th className="py-3 px-4">Shortcode & Target</th>
							<th className="py-3 px-4 hidden md:table-cell">Host Domain</th>
							<th className="py-3 px-4 hidden sm:table-cell">Created</th>
							<th className="py-3 px-4 text-center">Status</th>
							<th className="py-3 px-4 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/50">
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={i}>
									<td colSpan={5} className="py-4 px-4">
										<Skeleton className="h-6 w-full" />
									</td>
								</tr>
							))
						) : urls.length > 0 ? (
							urls.map((url) => {
								const id = url.id || url.shortCode;
								const fullUrl = `${window.location.origin}/r/${url.shortCode}`;
								const hostname = extractHostname(url.destinationUrl);
								const isHighlighted = highlightCode === url.shortCode;

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
												{url.isAbTest && (
													<Link to={ROUTES.AB_TESTING}>
														<Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer">
															A/B Test
														</Badge>
													</Link>
												)}
												{url.campaignId && campaignMap[url.campaignId] && (
													<Link to={`/campaigns/${url.campaignId}`} title={`Jump to campaign: ${campaignMap[url.campaignId].name}`}>
														<Badge variant="secondary" className="text-[10px] gap-1 font-medium max-w-[130px] truncate hidden md:inline-flex hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
															<IconFolder className="size-3 text-primary shrink-0" />
															<span className="truncate">{campaignMap[url.campaignId].name}</span>
														</Badge>
													</Link>
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

										{/* Actions */}
										<td className="py-3.5 px-4 text-right whitespace-nowrap">
											<div className="flex items-center justify-end gap-1 sm:gap-1.5">
												<Link
													to={`/redirect-links/${url.shortCode}`}
													className="inline-flex size-7 sm:size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
													title="Configure link settings"
												>
													<IconAdjustments className="size-3.5 sm:size-4" />
												</Link>

												<Link
													to={`/analytics/${url.shortCode}`}
													className="inline-flex size-7 sm:size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
													title="View deep telemetry"
												>
													<IconChartBar className="size-3.5 sm:size-4" />
												</Link>

												<button
													onClick={() => onOpenQrModal?.(fullUrl)}
													className="inline-flex size-7 sm:size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
													title="Generate QR code"
												>
													<IconQrcode className="size-3.5 sm:size-4" />
												</button>

												<a
													href={fullUrl}
													target="_blank"
													rel="noreferrer"
													className="inline-flex size-7 sm:size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
													title="Test redirection"
												>
													<IconExternalLink className="size-3.5 sm:size-4" />
												</a>

												<button
													onClick={() => onDeleteClick(url)}
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
								<td colSpan={5} className="py-12 text-center">
									<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
										<IconLink className="size-6" />
									</div>
									<h3 className="font-heading text-sm font-semibold text-foreground">
										No Short Links Found
									</h3>
									<p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
										Create your first short URL to begin generating clicks and tracking analytics.
									</p>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Footer */}
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
							onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
												onClick={() => onPageChange(p)}
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
							onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
							className="h-8 gap-1 text-xs px-2.5 cursor-pointer disabled:cursor-not-allowed"
						>
							<span>Next</span>
							<IconChevronRight className="size-3.5" />
						</Button>
					</div>
				</div>
			)}
		</Card>
	);
}

export default LinksTable;
