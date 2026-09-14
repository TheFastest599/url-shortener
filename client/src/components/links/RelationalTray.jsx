import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Badge } from "@/components/ui/badge";
import {
	IconFolder,
	IconFlask,
	IconSparkles,
	IconArrowRight,
	IconExternalLink,
} from "@tabler/icons-react";

export function RelationalTray({ url, campaign }) {
	let utmParams = [];
	try {
		const parsed = new URL(url.destinationUrl);
		["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
			const v = parsed.searchParams.get(k);
			if (v) utmParams.push({ key: k.replace("utm_", ""), val: v });
		});
	} catch {
		/* ignore malformed URL */
	}

	const campaignName = campaign?.name || url.campaignName;
	const campaignId = campaign?.id || url.campaignId;

	return (
		<div className="p-4 bg-muted/20 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
			{/* 1. Campaign Attribution Node */}
			<div className="space-y-1.5 p-3 rounded-xl bg-card border border-border/60">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground flex items-center gap-1.5">
						<IconFolder className="size-3.5 text-primary" />
						<span>Campaign Attribution</span>
					</span>
					{campaignId ? (
						<Link
							to={`/campaigns/${campaignId}`}
							className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
						>
							<span>Drilldown</span>
							<IconArrowRight className="size-2.5" />
						</Link>
					) : (
						<Badge variant="outline" className="text-[9px] text-muted-foreground">
							None
						</Badge>
					)}
				</div>
				{campaignName ? (
					<div className="space-y-1 pt-1">
						<div className="font-medium text-foreground text-xs">{campaignName}</div>
						<p className="text-[11px] text-muted-foreground line-clamp-2">
							{campaign?.description || "Active marketing campaign channel."}
						</p>
						<div className="text-[10px] text-muted-foreground font-mono">
							Target: {campaign?.targetUrl || "Dynamic"}
						</div>
					</div>
				) : (
					<p className="text-[11px] text-muted-foreground pt-1">
						Standalone shortlink not assigned to any marketing campaign.
					</p>
				)}
			</div>

			{/* 2. Routing Engine & A/B Status */}
			<div className="space-y-1.5 p-3 rounded-xl bg-card border border-border/60">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground flex items-center gap-1.5">
						<IconFlask className="size-3.5 text-amber-500" />
						<span>Routing Engine</span>
					</span>
					{url.isAbTest ? (
						<Link
							to={url.abTestId ? `/ab-testing/${url.abTestId}` : ROUTES.AB_TESTING}
							className="text-[10px] text-amber-500 hover:underline font-medium inline-flex items-center gap-0.5"
						>
							<span>{url.abTestStatus || "View Test"}</span>
							<IconArrowRight className="size-2.5" />
						</Link>
					) : (
						<Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/30">
							Direct
						</Badge>
					)}
				</div>
				<div className="space-y-1 pt-1">
					{url.isAbTest ? (
						<div>
							<div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
								<span>{url.abTestName || "Active Traffic Split"}</span>
								{url.abTestStatus && (
									<Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/30">
										{url.abTestStatus}
									</Badge>
								)}
							</div>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								Redirecting traffic dynamically between variants with statistical tracking.
							</p>
						</div>
					) : (
						<div>
							<div className="text-xs font-semibold text-foreground">
								1:1 Direct Redirection
							</div>
							<p className="text-[11px] text-muted-foreground mt-0.5">
								Zero overhead low-latency gRPC edge routing directly to target URL.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* 3. UTM Metadata & Direct Test */}
			<div className="space-y-1.5 p-3 rounded-xl bg-card border border-border/60">
				<div className="flex items-center justify-between">
					<span className="font-semibold text-foreground flex items-center gap-1.5">
						<IconSparkles className="size-3.5 text-primary" />
						<span>UTM Tags & Direct Test</span>
					</span>
					<a
						href={`${window.location.origin}/r/${url.shortCode}`}
						target="_blank"
						rel="noreferrer"
						className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
					>
						<span>Test Redirect</span>
						<IconExternalLink className="size-2.5" />
					</a>
				</div>
				<div className="pt-1">
					{utmParams.length > 0 ? (
						<div className="flex flex-wrap gap-1">
							{utmParams.map((p) => (
								<span
									key={p.key}
									className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono"
								>
									<span className="text-muted-foreground">{p.key}:</span>
									<span className="font-semibold text-foreground">{p.val}</span>
								</span>
							))}
						</div>
					) : (
						<p className="text-[11px] text-muted-foreground">
							No UTM tags detected on the target URL query string.
						</p>
					)}
					<div className="mt-2 text-[10px] text-muted-foreground font-mono truncate">
						Destination: {url.destinationUrl}
					</div>
				</div>
			</div>
		</div>
	);
}

export default RelationalTray;
