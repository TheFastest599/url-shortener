import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconFlask, IconPlus, IconRefresh } from "@tabler/icons-react";

export function AbTestHeader({
	onOpenNewTest,
	onRefresh,
	isRefreshing = false,
}) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
			<div>
				<h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
					<IconFlask className="size-7 text-primary" />
					<span>A/B Split Testing & Traffic Routing</span>
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground mt-1">
					Split incoming redirect traffic across multi-variant destinations with session cookie stickiness and automated winner promotion.
				</p>
			</div>

			<div className="flex items-center gap-2.5 shrink-0">
				<Button
					variant="outline"
					size="sm"
					onClick={onRefresh}
					disabled={isRefreshing}
					className="gap-1.5 text-xs h-9 cursor-pointer shadow-2xs"
					title="Refresh experiments"
				>
					<IconRefresh className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
					<span>Refresh</span>
				</Button>

				<Button
					size="sm"
					onClick={onOpenNewTest}
					className="gap-1.5 text-xs h-9 font-semibold cursor-pointer shadow-xs"
				>
					<IconPlus className="size-4" />
					<span>New A/B Test</span>
				</Button>
			</div>
		</div>
	);
}

export default AbTestHeader;
