import * as React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { IconFlame, IconArrowRight } from "@tabler/icons-react";

export function CampaignSpotlight({ campaigns = [], totalCampaignClicks = 0 }) {
	const topCampaigns = React.useMemo(() => {
		return [...campaigns]
			.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
			.slice(0, 4);
	}, [campaigns]);

	return (
		<div className="space-y-4 pt-2">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<h2 className="text-base sm:text-lg font-heading font-semibold text-foreground flex items-center gap-2">
						<IconFlame className="size-4 text-amber-500" />
						<span>Campaign Performance Spotlight</span>
					</h2>
					<p className="text-xs text-muted-foreground">
						Track which growth initiatives are driving redirect conversion.
					</p>
				</div>

				<Link
					to={ROUTES.CAMPAIGNS}
					className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
				>
					<span>Manage all campaigns</span>
					<IconArrowRight className="size-3.5" />
				</Link>
			</div>

			{topCampaigns.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{topCampaigns.map((c) => {
						const share =
							totalCampaignClicks > 0
								? Math.round(((c.clickCount || 0) / totalCampaignClicks) * 100)
								: 0;

						return (
							<Card
								key={c.id}
								className="border-border/70 bg-card hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between"
							>
								<CardHeader className="p-4 pb-2 space-y-1">
									<div className="flex items-center justify-between">
										<Badge
											variant="secondary"
											className="text-[10px] font-mono px-1.5 py-0"
										>
											{share}% share
										</Badge>
										<Link
											to={`/campaigns/${c.id}`}
											className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
										>
											<span>Drilldown</span>
											<IconArrowRight className="size-2.5" />
										</Link>
									</div>
									<CardTitle className="text-sm font-semibold text-foreground truncate">
										{c.name}
									</CardTitle>
									<CardDescription className="text-xs truncate">
										{c.targetUrl || "Global campaign"}
									</CardDescription>
								</CardHeader>

								<CardContent className="p-4 pt-1 space-y-2">
									<div className="flex items-center justify-between text-xs font-mono">
										<span className="text-muted-foreground">Clicks:</span>
										<span className="font-bold text-foreground">{c.clickCount || 0}</span>
									</div>
									<Progress value={share} className="h-1.5" />
								</CardContent>
							</Card>
						);
					})}
				</div>
			) : (
				<Card className="border-dashed border-border/80 bg-muted/20 p-6 text-center">
					<p className="text-xs text-muted-foreground">
						No campaigns created yet. Click "+ New Campaign" above to group your links into ROI channels.
					</p>
				</Card>
			)}
		</div>
	);
}

export default CampaignSpotlight;
