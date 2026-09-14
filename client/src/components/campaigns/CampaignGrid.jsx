import * as React from "react";
import { CampaignCard } from "./CampaignCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconFolder, IconPlus } from "@tabler/icons-react";

export function CampaignGrid({
	campaigns = [],
	isLoading = false,
	onViewUrls,
	onViewAnalytics,
	onEdit,
	onDelete,
	onCreateNew,
}) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{[1, 2, 3].map((n) => (
					<Card key={n} className="p-4 space-y-3 border-border/70 bg-card">
						<div className="flex justify-between items-center">
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-4 w-16" />
						</div>
						<Skeleton className="h-8 w-full" />
						<div className="pt-2 border-t border-border/40 flex justify-between">
							<Skeleton className="h-7 w-20" />
							<Skeleton className="h-7 w-8" />
						</div>
					</Card>
				))}
			</div>
		);
	}

	if (campaigns.length === 0) {
		return (
			<Card className="border-dashed border-border/80 bg-muted/10 p-8 sm:p-12 text-center">
				<div className="max-w-md mx-auto space-y-3">
					<IconFolder className="size-10 mx-auto text-muted-foreground/50" />
					<h3 className="font-heading font-bold text-base text-foreground">
						No Campaigns Found
					</h3>
					<p className="text-xs text-muted-foreground">
						Create marketing campaigns to group related promotional links, monitor cross-link attribution, and measure aggregate click volume.
					</p>
					<Button
						size="sm"
						onClick={onCreateNew}
						className="gap-1.5 text-xs font-semibold cursor-pointer"
					>
						<IconPlus className="size-3.5" />
						<span>Create Your First Campaign</span>
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{campaigns.map((c) => (
				<CampaignCard
					key={c.id}
					campaign={c}
					onViewUrls={onViewUrls}
					onViewAnalytics={onViewAnalytics}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}

export default CampaignGrid;
