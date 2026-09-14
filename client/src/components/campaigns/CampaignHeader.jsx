import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconAdjustments, IconPlus, IconTag } from "@tabler/icons-react";

export function CampaignHeader({ onOpenNewCampaign, onOpenUtmBuilder }) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
			<div>
				<h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
					<IconAdjustments className="size-7 text-primary" />
					<span>Campaigns & Attribution Workbench</span>
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground mt-1">
					Organize links into multi-channel marketing campaigns, track aggregate ROI, and generate standardized UTM tags.
				</p>
			</div>

			<div className="flex items-center gap-2.5 shrink-0">
				<Button
					variant="outline"
					size="sm"
					onClick={onOpenUtmBuilder}
					className="gap-1.5 text-xs h-9 font-medium cursor-pointer shadow-2xs"
				>
					<IconTag className="size-4" />
					<span>UTM Builder</span>
				</Button>

				<Button
					size="sm"
					onClick={onOpenNewCampaign}
					className="gap-1.5 text-xs h-9 font-semibold cursor-pointer shadow-xs"
				>
					<IconPlus className="size-4" />
					<span>New Campaign</span>
				</Button>
			</div>
		</div>
	);
}

export default CampaignHeader;
