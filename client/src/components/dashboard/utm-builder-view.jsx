import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	IconAdjustments,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconSparkles,
	IconTag,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function UtmBuilderView({ onOpenCreateModal }) {
	const [baseUrl, setBaseUrl] = React.useState("https://mysite.com/launch");
	const [source, setSource] = React.useState("newsletter");
	const [medium, setMedium] = React.useState("email");
	const [campaign, setCampaign] = React.useState("fall_promo_2026");
	const [term, setTerm] = React.useState("url_shortener");
	const [content, setContent] = React.useState("header_cta");
	const [copied, setCopied] = React.useState(false);

	const buildFullUrl = () => {
		try {
			let url = baseUrl.trim();
			if (!url.startsWith("http://") && !url.startsWith("https://")) {
				url = "https://" + url;
			}
			const parsed = new URL(url);
			if (source.trim()) parsed.searchParams.set("utm_source", source.trim());
			if (medium.trim()) parsed.searchParams.set("utm_medium", medium.trim());
			if (campaign.trim()) parsed.searchParams.set("utm_campaign", campaign.trim());
			if (term.trim()) parsed.searchParams.set("utm_term", term.trim());
			if (content.trim()) parsed.searchParams.set("utm_content", content.trim());
			return parsed.toString();
		} catch {
			return baseUrl;
		}
	};

	const fullGeneratedUrl = buildFullUrl();

	const handleCopy = () => {
		navigator.clipboard.writeText(fullGeneratedUrl);
		setCopied(true);
		toast.success("Tagged URL copied to clipboard");
		setTimeout(() => setCopied(false), 2000);
	};

	const presets = [
		{ name: "Google CPC Ads", source: "google", medium: "cpc", campaign: "search_brand" },
		{ name: "Weekly Newsletter", source: "newsletter", medium: "email", campaign: "weekly_digest" },
		{ name: "Twitter / X Post", source: "twitter", medium: "social", campaign: "feature_release" },
		{ name: "LinkedIn Article", source: "linkedin", medium: "social", campaign: "b2b_thought_leadership" },
	];

	const applyPreset = (preset) => {
		setSource(preset.source);
		setMedium(preset.medium);
		setCampaign(preset.campaign);
		toast.info(`Applied ${preset.name} preset`);
	};

	return (
		<div className="space-y-6">
			{/* Header Card */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h2 className="text-xl font-heading font-bold text-foreground">
						Campaign & UTM Builder
					</h2>
					<p className="text-xs sm:text-sm text-muted-foreground">
						Attach standard Google Analytics tracking tags to your destination URLs
					</p>
				</div>
				<Button
					onClick={() => onOpenCreateModal && onOpenCreateModal(fullGeneratedUrl)}
					size="sm"
					className="gap-1.5 text-xs font-medium cursor-pointer shadow-xs self-start sm:self-auto"
				>
					<IconSparkles className="size-3.5" />
					<span>Shorten This Tagged Link</span>
				</Button>
			</div>

			{/* Presets Row */}
			<div className="flex flex-wrap items-center gap-2">
				<span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
					<IconTag className="size-3.5" />
					<span>Quick Presets:</span>
				</span>
				{presets.map((p, idx) => (
					<button
						key={idx}
						onClick={() => applyPreset(p)}
						className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
					>
						<span>{p.name}</span>
					</button>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Input Form Card */}
				<Card className="border-border/70 bg-card shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-heading font-semibold flex items-center gap-2">
							<IconAdjustments className="size-4 text-primary" />
							<span>Campaign Tagging Parameters</span>
						</CardTitle>
						<CardDescription className="text-xs">
							Fill in the UTM parameters below to dynamically assemble the tagged destination URL
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-foreground">
								Target Base URL
							</label>
							<Input
								type="text"
								value={baseUrl}
								onChange={(e) => setBaseUrl(e.target.value)}
								placeholder="https://mysite.com/landing"
								className="h-9 text-xs sm:text-sm bg-muted/30"
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="text-xs font-medium text-foreground">
									Campaign Source (<span className="font-mono text-[11px] text-primary">utm_source</span>)
								</label>
								<Input
									type="text"
									value={source}
									onChange={(e) => setSource(e.target.value)}
									placeholder="e.g. google, newsletter, twitter"
									className="h-8.5 text-xs bg-muted/30"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-medium text-foreground">
									Campaign Medium (<span className="font-mono text-[11px] text-primary">utm_medium</span>)
								</label>
								<Input
									type="text"
									value={medium}
									onChange={(e) => setMedium(e.target.value)}
									placeholder="e.g. cpc, email, social"
									className="h-8.5 text-xs bg-muted/30"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-medium text-foreground">
									Campaign Name (<span className="font-mono text-[11px] text-primary">utm_campaign</span>)
								</label>
								<Input
									type="text"
									value={campaign}
									onChange={(e) => setCampaign(e.target.value)}
									placeholder="e.g. black_friday_2026"
									className="h-8.5 text-xs bg-muted/30"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-medium text-foreground">
									Campaign Term (<span className="font-mono text-[11px] text-primary">utm_term</span>)
								</label>
								<Input
									type="text"
									value={term}
									onChange={(e) => setTerm(e.target.value)}
									placeholder="e.g. running_shoes, keyword"
									className="h-8.5 text-xs bg-muted/30"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-xs font-medium text-foreground">
									Campaign Content (<span className="font-mono text-[11px] text-primary">utm_content</span>)
								</label>
								<Input
									type="text"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									placeholder="e.g. banner_top, textlink"
									className="h-8.5 text-xs bg-muted/30"
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Live Output Preview Card */}
				<Card className="border-border/70 bg-card shadow-xs flex flex-col justify-between">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-heading font-semibold flex items-center justify-between">
							<span>Generated Tagged Destination</span>
							<Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
								Valid URL
							</Badge>
						</CardTitle>
						<CardDescription className="text-xs">
							Ready to be passed into the Base62 URL shortener
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-xl border border-border bg-muted/30 p-3 font-mono text-xs text-foreground break-all select-all leading-relaxed max-h-40 overflow-y-auto">
							{fullGeneratedUrl}
						</div>

						<div className="space-y-2 pt-2">
							<div className="text-[11px] font-medium text-muted-foreground">Parameter Breakdown:</div>
							<div className="flex flex-wrap gap-1.5">
								{source && <Badge variant="secondary" className="text-[10px] font-mono">source={source}</Badge>}
								{medium && <Badge variant="secondary" className="text-[10px] font-mono">medium={medium}</Badge>}
								{campaign && <Badge variant="secondary" className="text-[10px] font-mono">campaign={campaign}</Badge>}
								{content && <Badge variant="secondary" className="text-[10px] font-mono">content={content}</Badge>}
							</div>
						</div>
					</CardContent>

					<div className="p-4 border-t border-border flex items-center justify-between gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => window.open(fullGeneratedUrl, "_blank")}
							className="gap-1.5 text-xs cursor-pointer"
						>
							<IconExternalLink className="size-3.5" />
							<span>Test in Browser</span>
						</Button>

						<Button
							variant="default"
							size="sm"
							onClick={handleCopy}
							className="gap-1.5 text-xs cursor-pointer shadow-xs"
						>
							{copied ? <IconCheck className="size-3.5 text-emerald-500" /> : <IconCopy className="size-3.5" />}
							<span>{copied ? "Copied" : "Copy Tagged Link"}</span>
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
}
