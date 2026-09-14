import * as React from "react";
import { Link } from "react-router-dom";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchCombobox } from "@/components/ui/search-combobox";
import {
	IconLink,
	IconPlus,
	IconChartBar,
	IconExternalLink,
	IconUnlink,
} from "@tabler/icons-react";

export function CampaignLinksModal({
	campaign,
	open,
	onOpenChange,
	campaignUrls = [],
	isLoading = false,
	unassignedUrlItems = [],
	onAssignLink,
	onUnlinkLink,
	onCreateNewLink,
}) {
	const [linkToAssignId, setLinkToAssignId] = React.useState("");

	const handleAssign = () => {
		if (!linkToAssignId) return;
		onAssignLink(linkToAssignId);
		setLinkToAssignId("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<IconLink className="size-5 text-primary" />
						<span>URLs in "{campaign?.name}"</span>
					</DialogTitle>
					<DialogDescription className="text-xs">
						Short links currently assigned to this marketing campaign.
					</DialogDescription>
				</DialogHeader>

				{/* Attach existing link */}
				<div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2 my-1">
					<label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
						Attach Existing Short Link
					</label>
					<div className="flex items-center gap-2">
						<div className="flex-1">
							<SearchCombobox
								items={unassignedUrlItems}
								value={linkToAssignId}
								onValueChange={(val) => setLinkToAssignId(val)}
								placeholder="Search by code, URL, or type..."
								emptyMessage="No unattached URLs found."
							/>
						</div>
						<Button
							size="sm"
							disabled={!linkToAssignId}
							onClick={handleAssign}
							className="text-xs h-9 px-3 gap-1 cursor-pointer shrink-0"
						>
							<IconPlus className="size-3.5" />
							<span>Attach</span>
						</Button>
					</div>
				</div>

				{/* List of URLs */}
				<div className="max-h-72 overflow-y-auto space-y-2 py-2">
					{isLoading ? (
						<div className="py-6 text-center text-xs text-muted-foreground">
							Loading linked URLs...
						</div>
					) : campaignUrls.length > 0 ? (
						campaignUrls.map((url) => (
							<div
								key={url.id || url.shortCode}
								className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3 text-xs"
							>
								<div className="space-y-0.5 min-w-0">
									<Link
										to={`/redirect-links/${url.shortCode}`}
										className="font-mono font-bold text-primary hover:underline"
									>
										/r/{url.shortCode}
									</Link>
									<div
										className="text-muted-foreground truncate max-w-xs"
										title={url.destinationUrl}
									>
										{url.destinationUrl}
									</div>
								</div>
								<div className="flex items-center gap-1.5 shrink-0">
									<Link to={`/analytics/${url.shortCode}`}>
										<Button
											variant="outline"
											size="sm"
											className="h-7 text-xs px-2 cursor-pointer"
											title="View Telemetry"
										>
											<IconChartBar className="size-3" />
										</Button>
									</Link>
									<a
										href={`${window.location.origin}/r/${url.shortCode}`}
										target="_blank"
										rel="noreferrer"
										className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
										title="Test Redirection"
									>
										<IconExternalLink className="size-3.5" />
									</a>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onUnlinkLink(url)}
										className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
										title="Unlink from campaign"
									>
										<IconUnlink className="size-3.5" />
									</Button>
								</div>
							</div>
						))
					) : (
						<div className="py-8 text-center text-xs text-muted-foreground space-y-2">
							<IconLink className="size-6 mx-auto opacity-40" />
							<p>No short links currently assigned to this campaign.</p>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									onOpenChange(false);
									onCreateNewLink?.();
								}}
								className="text-xs cursor-pointer"
							>
								Create Link for this Campaign
							</Button>
						</div>
					)}
				</div>

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

export default CampaignLinksModal;
