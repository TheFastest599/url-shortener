import * as React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IconFlame, IconSearch, IconArrowRight, IconLink } from "@tabler/icons-react";

export function AnalyticsLeaderboard({
	urls = [],
	searchQuery = "",
	onSearchChange,
}) {
	return (
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="space-y-0.5">
					<CardTitle className="text-base font-bold font-heading text-foreground flex items-center gap-2">
						<IconFlame className="size-4 text-amber-500" />
						<span>Shortlink Traffic Leaderboard</span>
					</CardTitle>
					<CardDescription className="text-xs">
						Inspect performance across all shortlinks in your workspace.
					</CardDescription>
				</div>

				<div className="relative w-full sm:w-64">
					<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Search by code or URL..."
						className="pl-9 h-8.5 text-xs bg-background/80 font-mono"
					/>
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-xs border-collapse">
						<thead>
							<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
								<th className="py-2.5 px-4">Rank & Link</th>
								<th className="py-2.5 px-4">Destination Target</th>
								<th className="py-2.5 px-4 text-center">Type</th>
								<th className="py-2.5 px-4 text-right">Clicks</th>
								<th className="py-2.5 px-4 text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/50">
							{urls.length > 0 ? (
								urls.map((url, idx) => (
									<tr key={url.id || url.shortCode} className="hover:bg-muted/30 transition-colors">
										<td className="py-3 px-4 font-semibold text-foreground">
											<div className="flex items-center gap-2">
												<span className="font-mono text-muted-foreground text-[11px] w-4">
													#{idx + 1}
												</span>
												<Link
													to={`/analytics/${url.shortCode}`}
													className="font-mono text-primary hover:underline font-bold"
												>
													/r/{url.shortCode}
												</Link>
											</div>
										</td>
										<td className="py-3 px-4 max-w-[280px] truncate text-muted-foreground" title={url.destinationUrl}>
											{url.destinationUrl}
										</td>
										<td className="py-3 px-4 text-center">
											{url.isAbTest ? (
												<Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
													A/B Test
												</Badge>
											) : (
												<Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
													Direct
												</Badge>
											)}
										</td>
										<td className="py-3 px-4 text-right font-mono font-bold text-foreground">
											{(url.clickCount || 0).toLocaleString()}
										</td>
										<td className="py-3 px-4 text-right">
											<Link
												to={`/analytics/${url.shortCode}`}
												className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
											>
												<span>Deep Dive</span>
												<IconArrowRight className="size-3" />
											</Link>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={5} className="py-10 text-center text-muted-foreground">
										<IconLink className="size-8 mx-auto text-muted-foreground/40 mb-1.5" />
										<p className="font-medium text-foreground">No matching links found</p>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}

export default AnalyticsLeaderboard;
