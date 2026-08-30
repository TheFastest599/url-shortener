import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
	IconLink,
	IconCopy,
	IconCheck,
	IconQrcode,
	IconSparkles,
	IconArrowRight,
	IconChartBar,
	IconBolt,
	IconAdjustments,
	IconExternalLink,
	IconShieldCheck,
	IconFlame,
} from "@tabler/icons-react";

export function HeroSection() {
	const [urlInput, setUrlInput] = useState(
		"https://github.com/EnterpriseCorp/nextgen-cloud-infrastructure-deep-dive-2026?ref=newsletter"
	);
	const [customSlug, setCustomSlug] = useState("cloud-summit");
	const [showUtm, setShowUtm] = useState(false);
	const [utmSource, setUtmSource] = useState("twitter");
	const [utmMedium, setUtmMedium] = useState("social");
	const [utmCampaign, setUtmCampaign] = useState("summer_launch");

	const [isShortening, setIsShortening] = useState(false);
	const [shortenedResult, setShortenedResult] = useState({
		shortUrl: "https://urlshortener.io/r/cloud-summit",
		originalUrl:
			"https://github.com/EnterpriseCorp/nextgen-cloud-infrastructure-deep-dive-2026?ref=newsletter&utm_source=twitter&utm_medium=social&utm_campaign=summer_launch",
		clicks: 1420,
		createdAt: "Just now",
	});
	const [copied, setCopied] = useState(false);
	const [showQr, setShowQr] = useState(false);

	const handleShorten = (e) => {
		e?.preventDefault();
		if (!urlInput.trim()) {
			toast.error("Please enter a valid target URL");
			return;
		}

		setIsShortening(true);
		setTimeout(() => {
			const slug = customSlug.trim() || Math.random().toString(36).substring(2, 8);
			const fullTarget = showUtm && (utmSource || utmMedium || utmCampaign)
				? `${urlInput.split("?")[0]}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`
				: urlInput;

			setShortenedResult({
				shortUrl: `https://urlshortener.io/r/${slug}`,
				originalUrl: fullTarget,
				clicks: 1,
				createdAt: "Just now",
			});
			setIsShortening(false);
			toast.success("Short link created with sub-5ms Redis cache TTL!");
		}, 350);
	};

	const handleCopy = () => {
		if (!shortenedResult) return;
		navigator.clipboard.writeText(shortenedResult.shortUrl);
		setCopied(true);
		toast.success("Short URL copied to clipboard!");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleSimulateClick = () => {
		setShortenedResult((prev) => ({
			...prev,
			clicks: prev.clicks + 1,
		}));
		toast.info("Simulated 302 Redirection: +1 event sent to Kafka (url-clicks)");
	};

	return (
		<section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
			{/* Subtle ambient gradient mesh */}
			<div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
				<div className="size-[500px] rounded-full bg-primary/10 blur-3xl" />
				<div className="size-[350px] -translate-x-32 translate-y-24 rounded-full bg-emerald-500/5 blur-3xl" />
			</div>

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Top Pill / Badge */}
				<div className="flex justify-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary shadow-xs transition-colors">
						<IconSparkles className="size-3.5" />
						<span>High-Throughput Reactive URL Engine</span>
						<span className="text-muted-foreground">·</span>
						<span className="font-mono">&lt; 5ms Latency</span>
					</div>
				</div>

				{/* Main Headline & Value Proposition */}
				<div className="mx-auto mt-6 max-w-4xl text-center">
					<h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
						Enterprise URL Infrastructure.{" "}
						<span className="text-primary block sm:inline">
							Sub-5ms Redirection
						</span>{" "}
						& Real-Time Stream Analytics.
					</h1>
					<p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
						Shorten, brand, and track millions of links with Spring WebFlux, Reactive Redis, and Kafka event streaming. Built for performance, security, and deep geographic intelligence.
					</p>
				</div>

				{/* CTA Buttons */}
				<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
					<Button
						size="lg"
						className="gap-2 shadow-md cursor-pointer text-base"
						onClick={() => {
							window.location.href = "#signup";
						}}
					>
						<span>Deploy Links Free</span>
						<IconArrowRight className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="lg"
						className="gap-2 cursor-pointer text-base"
						onClick={() => {
							window.location.href = "#architecture";
						}}
					>
						<IconBolt className="size-4 text-primary" />
						<span>Explore Architecture</span>
					</Button>
				</div>

				{/* Interactive Live URL Shortener Widget */}
				<div className="mx-auto mt-12 max-w-3xl">
					<div className="rounded-3xl border border-border/80 bg-card/95 p-4 sm:p-6 shadow-xl backdrop-blur-xl transition-all">
						{/* Widget Header */}
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
							<div className="flex items-center gap-2">
								<div className="size-2.5 rounded-full bg-primary animate-pulse" />
								<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Live Shortening Simulator
								</span>
							</div>
							<div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
								<span className="rounded-md bg-muted px-2 py-0.5">Base62 Bijective</span>
								<span className="rounded-md bg-muted px-2 py-0.5">Redis Cached</span>
							</div>
						</div>

						{/* Form Inputs */}
						<form onSubmit={handleShorten} className="mt-4 space-y-3">
							<div className="flex flex-col sm:flex-row gap-2">
								<div className="relative flex-1">
									<IconLink className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
									<Input
										value={urlInput}
										onChange={(e) => setUrlInput(e.target.value)}
										placeholder="Paste long destination URL (e.g. https://example.com/deep/page)..."
										className="pl-9 h-11 text-sm bg-background border-border"
									/>
								</div>
								<Button
									type="submit"
									disabled={isShortening}
									className="h-11 px-6 gap-2 cursor-pointer shrink-0"
								>
									{isShortening ? (
										<span>Shortening...</span>
									) : (
										<>
											<IconSparkles className="size-4" />
											<span>Shorten URL</span>
										</>
									)}
								</Button>
							</div>

							{/* Custom Slug & UTM Controls Bar */}
							<div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground font-medium">Custom Alias:</span>
									<div className="flex items-center rounded-xl bg-background border border-border px-2.5 py-1">
										<span className="text-muted-foreground font-mono text-[11px]">/r/</span>
										<input
											type="text"
											value={customSlug}
											onChange={(e) => setCustomSlug(e.target.value)}
											placeholder="alias (optional)"
											className="bg-transparent text-xs font-mono outline-none text-foreground w-28 ml-1"
										/>
									</div>
								</div>

								<Button
									type="button"
									variant="ghost"
									size="xs"
									onClick={() => setShowUtm(!showUtm)}
									className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
								>
									<IconAdjustments className="size-3.5 text-primary" />
									<span>{showUtm ? "Hide UTM Tags" : "Add UTM Parameters"}</span>
								</Button>
							</div>

							{/* Expandable UTM Builder */}
							{showUtm && (
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-2xl bg-muted/40 p-3 border border-border/40 text-xs animate-in fade-in-50 duration-200">
									<div>
										<label className="text-[11px] font-medium text-muted-foreground mb-1 block">
											UTM Source
										</label>
										<Input
											value={utmSource}
											onChange={(e) => setUtmSource(e.target.value)}
											placeholder="twitter, google, email"
											className="h-8 text-xs bg-background"
										/>
									</div>
									<div>
										<label className="text-[11px] font-medium text-muted-foreground mb-1 block">
											UTM Medium
										</label>
										<Input
											value={utmMedium}
											onChange={(e) => setUtmMedium(e.target.value)}
											placeholder="social, cpc, banner"
											className="h-8 text-xs bg-background"
										/>
									</div>
									<div>
										<label className="text-[11px] font-medium text-muted-foreground mb-1 block">
											UTM Campaign
										</label>
										<Input
											value={utmCampaign}
											onChange={(e) => setUtmCampaign(e.target.value)}
											placeholder="spring_launch"
											className="h-8 text-xs bg-background"
										/>
									</div>
								</div>
							)}
						</form>

						{/* Result Display Card */}
						{shortenedResult && (
							<div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
									<div className="space-y-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
												Generated Short Link
											</span>
											<Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary">
												HTTP 302
											</Badge>
										</div>
										<p className="font-mono text-base font-bold text-foreground truncate select-all">
											{shortenedResult.shortUrl}
										</p>
										<p className="text-xs text-muted-foreground truncate max-w-md">
											Destination: {shortenedResult.originalUrl}
										</p>
									</div>

									{/* Action buttons */}
									<div className="flex items-center gap-2 shrink-0">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setShowQr(!showQr)}
											className="gap-1.5 cursor-pointer"
											title="Toggle QR Code"
										>
											<IconQrcode className="size-4" />
											<span className="hidden sm:inline">QR</span>
										</Button>

										<Button
											variant="secondary"
											size="sm"
											onClick={handleCopy}
											className="gap-1.5 cursor-pointer font-medium"
										>
											{copied ? (
												<>
													<IconCheck className="size-4 text-primary" />
													<span>Copied!</span>
												</>
											) : (
												<>
													<IconCopy className="size-4" />
													<span>Copy</span>
												</>
											)}
										</Button>

										<Button
											variant="default"
											size="sm"
											onClick={handleSimulateClick}
											className="gap-1.5 cursor-pointer shadow-xs"
											title="Simulate a click to trigger reactive redirect & Kafka logging"
										>
											<IconFlame className="size-4" />
											<span>Simulate ({shortenedResult.clicks})</span>
										</Button>
									</div>
								</div>

								{/* QR Code Container */}
								{showQr && (
									<div className="mt-4 pt-4 border-t border-primary/20 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in-50 duration-200">
										<div className="size-24 rounded-xl bg-white p-2 flex items-center justify-center shadow-md">
											{/* Clean SVG QR mockup representation */}
											<svg viewBox="0 0 100 100" className="size-full fill-black">
												<rect x="0" y="0" width="30" height="30" />
												<rect x="5" y="5" width="20" height="20" fill="white" />
												<rect x="9" y="9" width="12" height="12" />
												
												<rect x="70" y="0" width="30" height="30" />
												<rect x="75" y="5" width="20" height="20" fill="white" />
												<rect x="79" y="9" width="12" height="12" />
												
												<rect x="0" y="70" width="30" height="30" />
												<rect x="5" y="75" width="20" height="20" fill="white" />
												<rect x="9" y="79" width="12" height="12" />
												
												<rect x="40" y="10" width="20" height="10" />
												<rect x="40" y="30" width="10" height="20" />
												<rect x="60" y="40" width="20" height="10" />
												<rect x="40" y="70" width="20" height="20" />
												<rect x="70" y="70" width="15" height="15" />
											</svg>
										</div>
										<div className="text-center sm:text-left space-y-1">
											<p className="text-xs font-semibold text-foreground">
												Instant Dynamic QR Code
											</p>
											<p className="text-[11px] text-muted-foreground">
												Print or embed directly in campaigns. Always routes to your latest redirect configuration.
											</p>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Tech Stacks Strip */}
				<div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
					<span className="font-semibold text-foreground/80">Powered By:</span>
					<span className="rounded-full border border-border bg-muted/30 px-3 py-1 font-mono">
						Spring Boot 3.3
					</span>
					<span className="rounded-full border border-border bg-muted/30 px-3 py-1 font-mono">
						Reactive WebFlux
					</span>
					<span className="rounded-full border border-border bg-muted/30 px-3 py-1 font-mono">
						Apache Kafka KRaft
					</span>
					<span className="rounded-full border border-border bg-muted/30 px-3 py-1 font-mono">
						Redis 7.2
					</span>
					<span className="rounded-full border border-border bg-muted/30 px-3 py-1 font-mono">
						PostgreSQL 16
					</span>
					<span className="rounded-full border border-border bg-muted/30 px-3 py-1 font-mono">
						MaxMind GeoIP2
					</span>
				</div>
			</div>
		</section>
	);
}
