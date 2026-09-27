import * as React from "react";
import { AbTestCard } from "./AbTestCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconFlask, IconPlus } from "@tabler/icons-react";

export function AbTestGrid({
	experiments = [],
	experimentsData = {},
	isLoading = false,
	onToggleStatus,
	onEdit,
	onPromoteWinner,
	onViewTelemetry,
	onDelete,
	onCreateNew,
}) {
	if (isLoading) {
		return (
			<div className="space-y-4">
				{[1, 2].map((n) => (
					<Card key={n} className="p-5 space-y-4 border-border/70 bg-card">
						<div className="flex justify-between items-center">
							<Skeleton className="h-6 w-48" />
							<div className="flex gap-2">
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-8 w-20" />
							</div>
						</div>
						<Skeleton className="h-4 w-full rounded-full" />
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
							{[1, 2].map((m) => (
								<Skeleton key={m} className="h-28 w-full rounded-xl" />
							))}
						</div>
					</Card>
				))}
			</div>
		);
	}

	if (experiments.length === 0) {
		return (
			<Card className="border-dashed border-border/80 bg-muted/10 p-8 sm:p-12 text-center">
				<div className="max-w-md mx-auto space-y-3">
					<IconFlask className="size-10 mx-auto text-muted-foreground/50" />
					<h3 className="font-heading font-bold text-base text-foreground">
						No Active A/B Experiments
					</h3>
					<p className="text-xs text-muted-foreground">
						Convert any short link into a traffic split test to compare conversion rates across landing pages, pricing tiers, or messaging variants.
					</p>
					<Button
						size="sm"
						onClick={onCreateNew}
						className="gap-1.5 text-xs font-semibold cursor-pointer"
					>
						<IconPlus className="size-3.5" />
						<span>Create Your First A/B Test</span>
					</Button>
				</div>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			{experiments.map((item) => {
				const shortCode = item.shortCode;
				const expItem = experimentsData[shortCode] || {};
				const exp = expItem.exp || item;
				const variantStats = expItem.variantStats || [];

				return (
					<AbTestCard
						key={shortCode}
						shortCode={shortCode}
						experiment={exp}
						variantStats={variantStats}
						onToggleStatus={onToggleStatus}
						onEdit={onEdit}
						onPromoteWinner={onPromoteWinner}
						onViewTelemetry={onViewTelemetry}
						onDelete={onDelete}
					/>
				);
			})}
		</div>
	);
}

export default AbTestGrid;
