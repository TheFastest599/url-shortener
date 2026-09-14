import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTag, IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";

export function UtmBuilderModal({ open, onOpenChange, onShortenUrl }) {
	const [targetUrl, setTargetUrl] = React.useState("https://mysite.com/product");
	const [utmSource, setUtmSource] = React.useState("twitter");
	const [utmMedium, setUtmMedium] = React.useState("social");
	const [utmCampaign, setUtmCampaign] = React.useState("summer_launch");

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

	const handleCopy = () => {
		navigator.clipboard.writeText(generatedUtmUrl);
		toast.success("Target URL copied to clipboard");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<IconTag className="size-5 text-primary" />
						<span>UTM Campaign URL Builder</span>
					</DialogTitle>
					<DialogDescription className="text-xs">
						Build campaign-tagged URLs to attribute clicks to specific channels and mediums.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3.5 py-2">
					<div className="space-y-1">
						<label className="text-xs font-semibold text-foreground">
							Destination Target URL
						</label>
						<Input
							value={targetUrl}
							onChange={(e) => setTargetUrl(e.target.value)}
							placeholder="https://mysite.com/product"
							className="text-xs"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">
								utm_source
							</label>
							<Input
								value={utmSource}
								onChange={(e) => setUtmSource(e.target.value)}
								placeholder="twitter, google"
								className="text-xs"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">
								utm_medium
							</label>
							<Input
								value={utmMedium}
								onChange={(e) => setUtmMedium(e.target.value)}
								placeholder="social, email"
								className="text-xs"
							/>
						</div>
						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">
								utm_campaign
							</label>
							<Input
								value={utmCampaign}
								onChange={(e) => setUtmCampaign(e.target.value)}
								placeholder="summer_sale"
								className="text-xs"
							/>
						</div>
					</div>

					<div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
						<div className="text-[11px] font-semibold text-muted-foreground">
							Generated Target URL:
						</div>
						<div className="font-mono text-xs text-foreground break-all bg-card p-2 rounded-md border border-border">
							{generatedUtmUrl}
						</div>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopy}
						className="text-xs gap-1.5 cursor-pointer"
					>
						<IconCopy className="size-3.5" />
						<span>Copy Target URL</span>
					</Button>
					<Button
						size="sm"
						onClick={() => {
							onOpenChange(false);
							onShortenUrl(generatedUtmUrl);
						}}
						className="text-xs font-semibold cursor-pointer"
					>
						Shorten This URL
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default UtmBuilderModal;
