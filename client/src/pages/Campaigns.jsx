import * as React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useUrlsQuery } from "@/queries";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	IconAdjustments,
	IconPlus,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconChartBar,
	IconTag,
	IconBrandTwitter,
	IconShare,
	IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function CampaignsPage() {
	const { urls = [], onOpenCreateModal } = useOutletContext() || {};
	const [searchQuery, setSearchQuery] = React.useState("");
	const [copiedId, setCopiedId] = React.useState(null);
	const [isUtmBuilderOpen, setIsUtmBuilderOpen] = React.useState(false);

	// UTM Builder state
	const [targetUrl, setTargetUrl] = React.useState("https://mysite.com/product");
	const [utmSource, setUtmSource] = React.useState("twitter");
	const [utmMedium, setUtmMedium] = React.useState("social");
	const [utmCampaign, setUtmCampaign] = React.useState("summer_launch");

	// Parse UTM parameters from destination URLs
	const campaignLinks = React.useMemo(() => {
		return urls
			.map((url) => {
				try {
					const u = new URL(url.destinationUrl);
					const source = u.searchParams.get("utm_source");
					const medium = u.searchParams.get("utm_medium");
					const campaign = u.searchParams.get("utm_campaign");

					return {
						...url,
						hasUtm: !!(source || medium || campaign),
						utmSource: source || "direct",
						utmMedium: medium || "none",
						utmCampaign: campaign || "unassigned",
					};
				} catch {
					return {
						...url,
						hasUtm: false,
						utmSource: "direct",
						utmMedium: "none",
						utmCampaign: "unassigned",
					};
				}
			})
			.filter((l) => l.hasUtm);
	}, [urls]);

	// Filter by search
	const filteredCampaigns = React.useMemo(() => {
		if (!searchQuery.trim()) return campaignLinks;
		const q = searchQuery.toLowerCase().trim();
		return campaignLinks.filter(
			(c) =>
				c.utmCampaign.toLowerCase().includes(q) ||
				c.utmSource.toLowerCase().includes(q) ||
				c.utmMedium.toLowerCase().includes(q) ||
				c.shortCode.toLowerCase().includes(q)
		);
	}, [campaignLinks, searchQuery]);

	// Unique campaign names count
	const uniqueCampaigns = new Set(campaignLinks.map((c) => c.utmCampaign)).size;

	const handleCopy = (text, id) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		toast.success("Copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const generatedUtmUrl = React.useMemo(() => {
		try {
			const base = targetUrl.trim().split("?")[0] || "https://example.com";
			const params = new URLSearchParams();
			if (utmSource.trim()) params.set("utm_source", utmSource.trim());
			if (utmMedium.trim()) params.set("utm_medium", utmMedium.trim());
			if (utmCampaign.trim()) params.set("utm_campaign", utmCampaign.trim());
			const qs = params.toString();
			return qs ? `${base}?${qs}` : base;
		} catch {
			return targetUrl;
		}
	}, [targetUrl, utmSource, utmMedium, utmCampaign]);

	return (
		<div className="space-y-6 max-w-7xl mx-auto">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
				<div>
					<h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
						<IconAdjustments className="size-7 text-primary" />
						<span>Campaigns & UTM Tracking</span>
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						Attribute inbound traffic channels, monitor campaign performance, and build UTM tags.
					</p>
				</div>

				<div className="flex items-center gap-2.5 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsUtmBuilderOpen(true)}
						className="gap-1.5 text-xs h-9 font-medium cursor-pointer shadow-2xs"
					>
						<IconTag className="size-4" />
						<span>UTM Builder</span>
					</Button>
					<Button
						size="sm"
						onClick={() => onOpenCreateModal?.()}
						className="gap-1.5 text-xs h-9 font-semibold cursor-pointer shadow-xs"
					>
						<IconPlus className="size-4" />
						<span>Create Short Link</span>
					</Button>
				</div>
			</div>

			{/* Overview KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Active Marketing Campaigns</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-foreground mt-1">
								{uniqueCampaigns}
							</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Distinct campaign tags active
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
							<IconTag className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Tagged Campaign Links</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-emerald-500 mt-1">
								{campaignLinks.length}
							</div>
							<div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
								{urls.length > 0 ? Math.round((campaignLinks.length / urls.length) * 100) : 0}% of all short URLs
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
							<IconAdjustments className="size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-4 sm:p-5 flex items-center justify-between">
						<div>
							<div className="text-xs font-medium text-muted-foreground">Total Campaign Clicks</div>
							<div className="text-2xl sm:text-3xl font-bold font-heading text-blue-500 mt-1">
								{campaignLinks.reduce((acc, curr) => acc + (curr.clickCount || 0), 0)}
							</div>
							<div className="text-[11px] text-muted-foreground mt-0.5">
								Recorded across tagged channels
							</div>
						</div>
						<div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
							<IconShare className="size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search & Campaign Links Table */}
			<div className="space-y-3">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div className="relative flex-1 min-w-0 sm:max-w-md">
						<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by campaign name, source, or slug..."
							className="pl-9 h-9 text-xs bg-card"
						/>
					</div>
				</div>

				<Card className="border-border/70 bg-card overflow-hidden shadow-xs">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs border-collapse">
							<thead>
								<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
									<th className="py-3 px-4">Campaign Name</th>
									<th className="py-3 px-4">Source / Medium</th>
									<th className="py-3 px-4">Shortcode</th>
									<th className="py-3 px-4 text-center">Clicks</th>
									<th className="py-3 px-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/50">
								{filteredCampaigns.length > 0 ? (
									filteredCampaigns.map((link) => {
										const id = link.id || link.shortCode;
										return (
											<tr key={id} className="hover:bg-muted/30 transition-colors">
												<td className="py-3.5 px-4 font-semibold text-foreground">
													<div className="flex items-center gap-1.5">
														<IconTag className="size-3.5 text-primary" />
														<span>{link.utmCampaign}</span>
													</div>
												</td>
												<td className="py-3.5 px-4">
													<div className="flex items-center gap-1.5">
														<Badge variant="outline" className="text-[10px] font-mono">
															{link.utmSource}
														</Badge>
														<span className="text-muted-foreground">/</span>
														<Badge variant="secondary" className="text-[10px] font-mono">
															{link.utmMedium}
														</Badge>
													</div>
												</td>
												<td className="py-3.5 px-4 font-mono">
													/r/{link.shortCode}
												</td>
												<td className="py-3.5 px-4 text-center font-mono">
													<Badge variant="secondary">{link.clickCount ?? 0}</Badge>
												</td>
												<td className="py-3.5 px-4 text-right">
													<div className="flex items-center justify-end gap-1.5">
														<Link
															to={`/analytics/${link.shortCode}`}
															className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-primary transition-colors"
															title="View telemetry"
														>
															<IconChartBar className="size-3.5" />
														</Link>
														<button
															onClick={() => handleCopy(`http://localhost:8080/r/${link.shortCode}`, id)}
															className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
															title="Copy short link"
														>
															{copiedId === id ? (
																<IconCheck className="size-3.5 text-emerald-500" />
															) : (
																<IconCopy className="size-3.5" />
															)}
														</button>
													</div>
												</td>
											</tr>
										);
									})
								) : (
									<tr>
										<td colSpan={5} className="py-12 text-center text-muted-foreground">
											<IconTag className="size-8 mx-auto text-muted-foreground/50 mb-2" />
											<p className="font-semibold text-foreground">No UTM Campaigns Detected</p>
											<p className="text-xs max-w-sm mx-auto mt-1">
												Add <code className="font-mono text-primary">?utm_source=...</code> parameters to your destination URLs to monitor campaign channels.
											</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</Card>
			</div>

			{/* UTM URL Builder Modal */}
			<Dialog open={isUtmBuilderOpen} onOpenChange={setIsUtmBuilderOpen}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<IconTag className="size-5 text-primary" />
							<span>UTM Campaign URL Builder</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							Build campaign-tagged URLs to attribute clicks to specific channels in your analytics.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3.5 py-2">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">Destination Target URL</label>
							<Input
								value={targetUrl}
								onChange={(e) => setTargetUrl(e.target.value)}
								placeholder="https://mysite.com/product"
								className="text-xs"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="space-y-1">
								<label className="text-xs font-semibold text-foreground">utm_source</label>
								<Input
									value={utmSource}
									onChange={(e) => setUtmSource(e.target.value)}
									placeholder="twitter, google"
									className="text-xs"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold text-foreground">utm_medium</label>
								<Input
									value={utmMedium}
									onChange={(e) => setUtmMedium(e.target.value)}
									placeholder="social, email"
									className="text-xs"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold text-foreground">utm_campaign</label>
								<Input
									value={utmCampaign}
									onChange={(e) => setUtmCampaign(e.target.value)}
									placeholder="summer_sale"
									className="text-xs"
								/>
							</div>
						</div>

						<div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
							<div className="text-[11px] font-semibold text-muted-foreground">Generated Target URL:</div>
							<div className="font-mono text-xs text-foreground break-all bg-card p-2 rounded-md border border-border">
								{generatedUtmUrl}
							</div>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleCopy(generatedUtmUrl, "modal")}
							className="text-xs gap-1.5"
						>
							<IconCopy className="size-3.5" />
							<span>Copy Target URL</span>
						</Button>
						<Button
							size="sm"
							onClick={() => {
								setIsUtmBuilderOpen(false);
								onOpenCreateModal?.(generatedUtmUrl);
							}}
							className="text-xs font-semibold"
						>
							Shorten This URL
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default CampaignsPage;
