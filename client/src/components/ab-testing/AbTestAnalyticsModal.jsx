import * as React from "react";
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
import { useAbTestAnalyticsQuery } from "@/queries/abTestingQueries";
import {
	IconChartBar,
	IconFlask,
	IconMouse,
	IconUsers,
	IconRobot,
	IconScale,
	IconExternalLink,
	IconDeviceDesktop,
	IconWorld,
} from "@tabler/icons-react";

export function AbTestAnalyticsModal({
	open,
	onOpenChange,
	shortCode,
	experiment,
}) {
	const [days, setDays] = React.useState(30);
	const [includeBots, setIncludeBots] = React.useState(false);

	const identifier = experiment?.id || shortCode;

	const { data: analytics, isLoading } = useAbTestAnalyticsQuery(
		identifier,
		{ days, includeBots },
		{ enabled: !!identifier && open }
	);

	const totalClicks = analytics?.totalClicks ?? 0;
	const uniqueVisitors = analytics?.uniqueVisitors ?? 0;
	const botClicks = analytics?.botClicks ?? 0;

	const variantSplit = React.useMemo(() => {
		if (Array.isArray(analytics?.variantBreakdown)) {
			const map = {};
			analytics.variantBreakdown.forEach((vb) => {
				const key = vb.name || vb.key || vb.variantKey;
				if (key) {
					map[key] = {
						clicks: vb.count ?? vb.clicks ?? vb.totalClicks ?? 0,
						percentage: vb.percentage ?? 0,
						destinationUrl: vb.destinationUrl,
					};
				}
			});
			return map;
		}
		return analytics?.variantSplit || {};
	}, [analytics]);

	const devices = analytics?.devices || analytics?.topDevices || [];
	const referrers = analytics?.referrers || analytics?.topReferrers || [];

	const variantKeys = Object.keys(variantSplit);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center justify-between gap-2 pr-6">
						<DialogTitle className="flex items-center gap-2">
							<IconFlask className="size-5 text-primary" />
							<span>A/B Experiment Telemetry: /r/{shortCode}</span>
						</DialogTitle>
					</div>
					<DialogDescription className="text-xs">
						Deep telemetry comparing click engagement, unique reach, and conversion ratios across active variants.
					</DialogDescription>
				</DialogHeader>

				{/* Controls */}
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
						<div className="grid grid-cols-3 gap-2.5">
							{[1, 2, 3].map((n) => (
								<Skeleton key={n} className="h-20 w-full rounded-xl" />
							))}
						</div>
						<Skeleton className="h-40 w-full rounded-xl" />
					</div>
				) : (
					<div className="space-y-5 py-2">
						{/* Summary KPIs */}
						<div className="grid grid-cols-3 gap-2.5">
							<div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs space-y-1">
								<div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
									<IconMouse className="size-3.5 text-primary" />
									<span>Total Clicks</span>
								</div>
								<div className="text-xl font-bold font-heading text-foreground">
									{totalClicks.toLocaleString()}
								</div>
								<div className="text-[10px] text-muted-foreground">Experiment total</div>
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
									<span>Bot Traffic</span>
								</div>
								<div className="text-xl font-bold font-heading text-foreground">
									{botClicks.toLocaleString()}
								</div>
								<div className="text-[10px] text-muted-foreground">
									{totalClicks > 0 ? Math.round((botClicks / totalClicks) * 100) : 0}% automated
								</div>
							</div>
						</div>

						{/* Variant Split Comparison Table */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
									<IconScale className="size-4 text-primary" />
									<span>Variant Performance Comparison</span>
								</h4>
								<span className="text-[11px] text-muted-foreground">
									Observed traffic routing
								</span>
							</div>

							<div className="rounded-xl border border-border/70 bg-card overflow-hidden">
								{variantKeys.length > 0 ? (
									<table className="w-full text-left text-xs border-collapse">
										<thead>
											<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
												<th className="py-2.5 px-3">Variant</th>
												<th className="py-2.5 px-3">Destination URL</th>
												<th className="py-2.5 px-3 text-right">Observed Clicks</th>
												<th className="py-2.5 px-3 text-right">Traffic Share</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/50">
											{variantKeys.map((key) => {
												const vData = variantSplit[key] || {};
												const clicks = typeof vData === "object" ? vData.clicks ?? 0 : vData;
												const destUrl = vData.destinationUrl || experiment?.variants?.find((x) => x.key === key)?.destinationUrl || "-";
												const sharePercent = totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;

												return (
													<tr key={key} className="hover:bg-muted/30 transition-colors">
														<td className="py-3 px-3 font-semibold text-foreground">
															<Badge variant="outline" className="text-xs font-mono">
																Variant {key}
															</Badge>
														</td>
														<td className="py-3 px-3 max-w-[220px] truncate text-muted-foreground font-mono" title={destUrl}>
															{destUrl}
														</td>
														<td className="py-3 px-3 text-right font-mono font-bold text-foreground">
															{clicks.toLocaleString()}
														</td>
														<td className="py-3 px-3 text-right min-w-[120px]">
															<div className="flex items-center justify-end gap-2">
																<Progress value={sharePercent} className="h-1.5 w-14" />
																<span className="text-[11px] font-mono text-muted-foreground">
																	{sharePercent}%
																</span>
															</div>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								) : (
									<div className="py-8 text-center text-xs text-muted-foreground space-y-1">
										<IconFlask className="size-6 mx-auto opacity-40" />
										<p>No traffic recorded for this experiment in this time window.</p>
									</div>
								)}
							</div>
						</div>

						{/* Breakdown: Devices & Top Referrers */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{/* Devices */}
							<div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
								<h5 className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
									<IconDeviceDesktop className="size-3.5 text-primary" />
									<span>Top Devices</span>
								</h5>
								<div className="space-y-1.5 text-xs">
									{devices.length > 0 ? (
										devices.slice(0, 4).map((d) => (
											<div key={d.device || d.name} className="flex justify-between items-center text-muted-foreground">
												<span className="capitalize">{d.device || d.name}</span>
												<span className="font-mono font-semibold text-foreground">{d.count}</span>
											</div>
										))
									) : (
										<div className="text-muted-foreground text-[11px] py-2">No device data yet</div>
									)}
								</div>
							</div>

							{/* Referrers */}
							<div className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2">
								<h5 className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
									<IconWorld className="size-3.5 text-primary" />
									<span>Top Referrers</span>
								</h5>
								<div className="space-y-1.5 text-xs">
									{referrers.length > 0 ? (
										referrers.slice(0, 4).map((r) => (
											<div key={r.referrer || r.name} className="flex justify-between items-center text-muted-foreground">
												<span className="truncate max-w-[150px]">{r.referrer || r.name || "Direct / None"}</span>
												<span className="font-mono font-semibold text-foreground">{r.count}</span>
											</div>
										))
									) : (
										<div className="text-muted-foreground text-[11px] py-2">No referrer data yet</div>
									)}
								</div>
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

export default AbTestAnalyticsModal;
