import { Card, CardContent } from "@/components/ui/card";
import { IconFolder, IconTag, IconShare } from "@tabler/icons-react";

export function CampaignStatsCards({ totalCampaigns = 0, totalUtmLinks = 0, totalUrls = 0, totalTaggedClicks = 0 }) {
	const utmPercentage = totalUrls > 0 ? Math.round((totalUtmLinks / totalUrls) * 100) : 0;

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
					<div className="min-w-0">
						<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
							Managed Campaigns
						</div>
						<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-foreground mt-0.5 sm:mt-1">
							{totalCampaigns}
						</div>
						<div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
							Active organizational folders
						</div>
					</div>
					<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary border border-primary/20">
						<IconFolder className="size-3.5 sm:size-4.5 lg:size-5" />
					</div>
				</CardContent>
			</Card>

			<Card className="border-border/70 bg-card shadow-xs">
				<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
					<div className="min-w-0">
						<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
							UTM Tagged Links
						</div>
						<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-chart-2 mt-0.5 sm:mt-1">
							{totalUtmLinks}
						</div>
						<div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 font-medium truncate">
							{utmPercentage}% of short links
						</div>
					</div>
					<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-chart-2/10 text-chart-2 border border-chart-2/20">
						<IconTag className="size-3.5 sm:size-4.5 lg:size-5" />
					</div>
				</CardContent>
			</Card>

			<Card className="border-border/70 bg-card shadow-xs col-span-2 sm:col-span-1">
				<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
					<div className="min-w-0">
						<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
							Attributed Traffic
						</div>
						<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-chart-4 mt-0.5 sm:mt-1">
							{totalTaggedClicks.toLocaleString()}
						</div>
						<div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
							Total clicks across tagged URLs
						</div>
					</div>
					<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-chart-4/10 text-chart-4 border border-chart-4/20">
						<IconShare className="size-3.5 sm:size-4.5 lg:size-5" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default CampaignStatsCards;
