import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { useCampaignsQuery } from "@/queries";
import { IconLink } from "@tabler/icons-react";
import { toast } from "sonner";
import { UtmEditor } from "./UtmEditor";

export function LinkConfigCard({
	url,
	campaigns = [],
	onSave,
	isSaving = false,
}) {
	const [destinationUrl, setDestinationUrl] = React.useState(url?.destinationUrl || "");
	const [campaignId, setCampaignId] = React.useState(url?.campaignId || "");
	const [isActive, setIsActive] = React.useState(url?.isActive !== false);

	const [campaignSearch, setCampaignSearch] = React.useState("");
	const [debouncedCampaignSearch, setDebouncedCampaignSearch] = React.useState("");

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedCampaignSearch(campaignSearch);
		}, 250);
		return () => clearTimeout(timer);
	}, [campaignSearch]);

	const { data: searchResults, isLoading: isSearchingCampaigns } = useCampaignsQuery(
		{
			page: 0,
			size: 20,
			search: debouncedCampaignSearch.trim() || undefined,
			sortBy: "name",
			direction: "ASC",
		}
	);

	const loadedCampaigns = Array.isArray(searchResults)
		? searchResults
		: searchResults?.content || (campaigns.length > 0 ? campaigns : []);

	const campaignItems = React.useMemo(() => {
		const list = loadedCampaigns.map((c) => ({
			value: c.id,
			label: c.name,
			sub: c.description,
			badge: "Campaign",
		}));
		if (url?.campaignId && url?.campaignName && !list.some((i) => i.value === url.campaignId)) {
			list.unshift({
				value: url.campaignId,
				label: url.campaignName,
				sub: "Currently assigned",
				badge: "Campaign",
			});
		}
		return [{ value: "none", label: "None (Standalone link)", badge: "Unassigned" }, ...list];
	}, [loadedCampaigns, url]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!destinationUrl.trim()) {
			toast.error("Destination URL cannot be empty");
			return;
		}

		onSave({
			id: url?.id,
			destinationUrl: destinationUrl.trim(),
			campaignId: campaignId === "none" ? null : campaignId || null,
			isActive,
		});
	};

	const hasChanges =
		destinationUrl !== url?.destinationUrl ||
		(campaignId === "none" ? null : campaignId) !== (url?.campaignId || null) ||
		isActive !== (url?.isActive !== false);

	return (
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-4 sm:p-5 pb-2">
				<CardTitle className="text-base font-bold font-heading text-foreground flex items-center gap-2">
					<IconLink className="size-4 text-primary" />
					<span>Destination & Routing Settings</span>
				</CardTitle>
				<CardDescription className="text-xs">
					Configure where requests to this short slug are forwarded.
				</CardDescription>
			</CardHeader>

			<CardContent className="p-4 sm:p-5 pt-2">
				<form onSubmit={handleSubmit} className="space-y-4 text-xs">
					<div className="space-y-1.5">
						<label className="font-semibold text-foreground">Destination Target URL</label>
						<Input
							value={destinationUrl}
							onChange={(e) => setDestinationUrl(e.target.value)}
							placeholder="https://example.com/target"
							className="font-mono text-xs"
							required
						/>
						<UtmEditor
							url={destinationUrl}
							onChange={setDestinationUrl}
						/>
					</div>

					<div className="space-y-1.5">
						<label className="font-semibold text-foreground">Assigned Campaign</label>
						<SearchCombobox
							items={campaignItems}
							value={campaignId || "none"}
							onValueChange={(val) => setCampaignId(val === "none" ? "" : val)}
							placeholder="Select a campaign folder..."
							emptyMessage="No matching campaigns found."
							onSearchChange={setCampaignSearch}
							isLoading={isSearchingCampaigns}
							remote={true}
						/>
					</div>

					<div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/15">
						<div>
							<div className="font-semibold text-foreground">Traffic Routing Enabled</div>
							<div className="text-[11px] text-muted-foreground">
								When disabled, visitors will receive an HTTP 404/410 inactive page.
							</div>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={isActive}
								onChange={(e) => setIsActive(e.target.checked)}
								className="sr-only peer"
							/>
							<div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
						</label>
					</div>

					<div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
						<Button
							type="submit"
							size="sm"
							disabled={!hasChanges || isSaving}
							className="text-xs font-semibold cursor-pointer"
						>
							{isSaving ? "Saving..." : "Save Link Configuration"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

export default LinkConfigCard;
