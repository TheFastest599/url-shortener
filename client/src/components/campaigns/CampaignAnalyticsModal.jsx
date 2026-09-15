import * as React from "react";
import { Link } from "react-router-dom";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useCampaignAnalyticsQuery } from "@/queries/campaignQueries";
import {
	IconChartBar,
	IconFolder,
	IconMouse,
	IconUsers,
	IconRobot,
	IconLink,
	IconArrowUpRight,
} from "@tabler/icons-react";

export function CampaignAnalyticsModal({ campaign, open, onOpenChange }) {
	const [days, setDays] = React.useState(30);
	const [includeBots, setIncludeBots] = React.useState(false);

	const { data: analytics, isLoading } = useCampaignAnalyticsQuery(
		campaign?.id,
		{ days, includeBots },
		{ enabled: !!campaign?.id && open }
	);

	const totalClicks = analytics?.totalClicks ?? 0;
	const uniqueVisitors = analytics?.uniqueVisitors ?? 0;
	const botClicks = analytics?.botClicks ?? 0;
	const humanClicks = analytics?.humanClicks ?? 0;
	const activeLinksCount = analytics?.activeLinksCount ?? 0;
	const linkBreakdown = analytics?.linkBreakdown ?? [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between gap-2 pr-6">
						<DialogTitle className="flex items-center gap-2">
							<IconChartBar className="size-5 text-primary" />
							<span>Campaign Analytics: "{campaign?.name}"</span>
						</DialogTitle>
					</div>
					<DialogDescription className="text-xs">
						Cross-link aggregated traffic and attribution metrics across all short links in this campaign.
					</DialogDescription>
				</DialogHeader>

				{/* Controls: Period filter & bots toggle */}
				<div className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-border/40 text-xs">
					<div className="flex items-center gap-1.5">
						<span className="text-muted-foreground font-medium">Window:</span>
						{[7, 30, 90].map((d) => (
							<button
								key={d}
								type="button"
								onClick={() => setDays(d)}
								className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
									days === d
										? "bg-primary text-primary-foreground font-semibold"
										: "bg-muted/50 text-muted-foreground hover:text-foreground"
								}`}
							>
								{d}d
							</button>
						))}
					</div>

					<label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground select-none">
						<input
							type="checkbox"
							checked={includeBots}
							onChange={(e) => setIncludeBots(e.target.checked)}
							className="rounded border-border text-primary size-3.5"
						/>
						<span>Include Bot Traffic</span>
					</label>
				</div>

				{isLoading ? (
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
							{[1, 2, 3, 4].map((n) => (
								<Skeleton key={n} className="h-20 w-full rounded-xl" />
							))}
						</div>
						<Skeleton className="h-44 w-full rounded-xl" />
					</div>
				) : (
					<div className="space-y-5 py-2">
						{/* 4 Summary KPIs */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
							<div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
								<div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
									<IconMouse className="size-3.5 text-primary" />
									<span>Total Clicks</span>
								</div>
								<div className="text-xl font-bold font-heading text-foreground">
									{totalClicks.toLocaleString()}
								</div>
								<div className="text-[10px] text-muted-foreground">All links combined</div>
							</div>

							<div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
								<div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
									<IconUsers className="size-3.5 text-emerald-500" />
									<span>Unique Visitors</span>
								</div>
								<div className="text-xl font-bold font-heading text-emerald-500">
									{uniqueVisitors.toLocaleString()}
								</div>
								<div className="text-[10px] text-muted-foreground">Distinct clients</div>
							</div>

							<div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
								<div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
									<IconRobot className="size-3.5 text-amber-500" />
									<span>Bot / Automated</span>
								</div>
								<div className="text-xl font-bold font-heading text-foreground">
									{botClicks.toLocaleString()}
								</div>
								<div className="text-[10px] text-muted-foreground">
									{totalClicks > 0 ? Math.round((botClicks / totalClicks) * 100) : 0}% of traffic
								</div>
							</div>

							<div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
								<div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
									<IconLink className="size-3.5 text-blue-500" />
									<span>Active Links</span>
								</div>
								<div className="text-xl font-bold font-heading text-blue-500">
									{activeLinksCount}
								</div>
								<div className="text-[10px] text-muted-foreground">Contributing links</div>
							</div>
						</div>

						{/* Per-Link Breakdown Table */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
									Link Attribution Breakdown
								</h4>
								<span className="text-[11px] text-muted-foreground">
									{linkBreakdown.length} links recorded
								</span>
							</div>

							<div className="rounded-xl border border-border/70 bg-card overflow-hidden">
								{linkBreakdown.length > 0 ? (
									<table className="w-full text-left text-xs border-collapse">
										<thead>
											<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
												<th className="py-2.5 px-3">Short Link</th>
												<th className="py-2.5 px-3">Destination</th>
												<th className="py-2.5 px-3 text-right">Clicks</th>
												<th className="py-2.5 px-3 text-right">Share</th>
												<th className="py-2.5 px-3 text-center">Action</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/50">
											{linkBreakdown.map((item, idx) => {
												const code = item.name?.replace(/^\/r\//, "") || item.shortCode || item.urlId || `link-${idx}`;
												const clicks = item.count ?? item.clicks ?? item.totalClicks ?? 0;
												const sharePercent =
													item.percentage !== undefined
														? Math.round(item.percentage)
														: totalClicks > 0
														? Math.round((clicks / totalClicks) * 100)
														: 0;

												return (
													<tr
														key={code}
														className="hover:bg-muted/30 transition-colors"
													>
														<td className="py-2.5 px-3 font-mono font-semibold text-primary">
															/r/{code}
														</td>
														<td className="py-2.5 px-3 max-w-[200px] truncate text-muted-foreground" title={item.destinationUrl}>
															{item.destinationUrl || "Direct"}
														</td>
														<td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
															{clicks.toLocaleString()}
														</td>
														<td className="py-2.5 px-3 text-right min-w-[90px]">
															<div className="flex items-center justify-end gap-2">
																<Progress value={sharePercent} className="h-1.5 w-12" />
																<span className="text-[11px] font-mono text-muted-foreground">
																	{sharePercent}%
																</span>
															</div>
														</td>
														<td className="py-2.5 px-3 text-center">
															<Link
																to={`/analytics/${code}`}
																className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
															>
																<span>Inspect</span>
																<IconArrowUpRight className="size-3" />
															</Link>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								) : (
									<div className="py-8 text-center text-xs text-muted-foreground space-y-1">
										<IconFolder className="size-6 mx-auto opacity-40" />
										<p>No link telemetry logged for this campaign yet.</p>
										<p className="text-[11px]">Clicks on assigned links will automatically populate this table.</p>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
						className="text-xs cursor-pointer"
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default CampaignAnalyticsModal;
