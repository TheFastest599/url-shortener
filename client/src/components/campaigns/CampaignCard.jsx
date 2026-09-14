import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	IconFolder,
	IconLink,
	IconChartBar,
	IconPencil,
	IconTrash,
} from "@tabler/icons-react";

export function CampaignCard({
	campaign,
	onEdit,
	onDelete,
}) {
	const formatDate = (dateStr) => {
		if (!dateStr) return "Recently";
		try {
			return new Date(dateStr).toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return "Recently";
		}
	};

	return (
		<Card className="border-border/70 bg-card shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all group">
			<CardHeader className="p-4 pb-2 space-y-1.5">
				<div className="flex items-center justify-between gap-2">
					<CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5 truncate">
						<Link
							to={`/campaigns/${campaign.id}`}
							className="flex items-center gap-1.5 hover:text-primary transition-colors truncate"
							title={`View campaign: ${campaign.name}`}
						>
							<IconFolder className="size-4 text-primary shrink-0" />
							<span className="truncate">{campaign.name}</span>
						</Link>
					</CardTitle>
					<span className="text-[11px] text-muted-foreground shrink-0 font-mono">
						{formatDate(campaign.createdAt)}
					</span>
				</div>
				<p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
					{campaign.description || "No description provided for this campaign."}
				</p>
			</CardHeader>

			<CardContent className="p-4 pt-2 border-t border-border/40 flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5">
					<Link to={`/campaigns/${campaign.id}`}>
						<Button
							variant="outline"
							size="sm"
							className="text-xs h-7.5 gap-1.5 cursor-pointer shadow-2xs hover:border-primary/50"
							title="View campaign details & assigned short links"
						>
							<IconLink className="size-3 text-primary" />
							<span>Links</span>
						</Button>
					</Link>

					<Link to={`/campaigns/${campaign.id}`}>
						<Button
							variant="outline"
							size="sm"
							className="text-xs h-7.5 gap-1.5 cursor-pointer shadow-2xs bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
							title="View aggregate campaign analytics"
						>
							<IconChartBar className="size-3" />
							<span>Analytics</span>
						</Button>
					</Link>
				</div>

				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(campaign)}
						className="text-xs h-7.5 w-7.5 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
						title="Edit campaign details"
					>
						<IconPencil className="size-3.5" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDelete(campaign)}
						className="text-xs h-7.5 w-7.5 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
						title="Delete campaign"
					>
						<IconTrash className="size-3.5" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export default CampaignCard;
