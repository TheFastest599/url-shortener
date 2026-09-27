import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IconShare } from "@tabler/icons-react";

export function AnalyticsReferrersCard({ referrers = [], totalClicks = 0 }) {
	return (
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-4 sm:p-5 pb-2">
				<CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
					<IconShare className="size-4 text-primary" />
					<span>Referring Traffic Channels</span>
				</CardTitle>
				<CardDescription className="text-xs">
					Inbound domains routing visitors to your shortlink.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 sm:p-5 pt-2">
				{referrers.length > 0 ? (
					<div className="space-y-3">
						{referrers.slice(0, 6).map((r) => {
							const clicks = r.count || r.clickCount || 0;
							const name = r.referrer || r.name || "Direct / None";
							const percent = totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;

							return (
								<div key={name} className="space-y-1 text-xs">
									<div className="flex justify-between items-center">
										<span className="font-medium text-foreground truncate max-w-[180px]">
											{name}
										</span>
										<div className="font-mono text-muted-foreground">
											<span className="font-semibold text-foreground">{clicks}</span> ({percent}%)
										</div>
									</div>
									<Progress value={percent} className="h-1.5" />
								</div>
							);
						})}
					</div>
				) : (
					<div className="py-8 text-center text-xs text-muted-foreground space-y-1">
						<IconShare className="size-6 mx-auto opacity-30" />
						<p>No external referring domains captured.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default AnalyticsReferrersCard;
