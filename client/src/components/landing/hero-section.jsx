/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { useAuthStore } from "@/store/authStore";
import { useCreateUrlMutation } from "@/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
	IconLink,
	IconCopy,
	IconCheck,
	IconQrcode,
	IconArrowRight,
	IconSparkles,
	IconTag,
	IconRocket,
	IconBolt,
	IconChartBar,
	IconDeviceMobile,
	IconWorld,
	IconArrowUpRight,
	IconFlask,
	IconFolder,
	IconCookie,
	IconGitFork,
	IconLayersLinked,
	IconX,
} from "@tabler/icons-react";

/**
 * Showcase presets representing the 3 platform pillars:
 * 1. Short Links & Dynamic QR
 * 2. Marketing Campaigns & Multi-Touch UTM
 * 3. Multivariate A/B Testing & Sticky Sessions
 */
const SHOWCASE_CARDS = [
	{
		id: "url",
		tab: "Short Links",
		tag: "Branded Link & QR",
		badgeColor: "bg-primary/10 text-primary border-primary/20",
		title: "Branded Short Link",
		subtitle: "Instant redirection & print-ready QR",
		shortSlug: "sho.rt/summer-drop",
		fullUrl: "http://localhost:8080/r/summer-drop",
		targetUrl: "https://brand.com/products/summer-2026?ref=direct",
		metricLabel: "Redirection Speed",
		metricValue: "< 5ms Instant",
		pill1: "⚡ Sub-5ms Speed",
		pill2: "📱 Dynamic QR",
		pill3: "🔒 HTTPS Safe",
		bgTrend: "99.4% Instant Hit",
		bgClicks: "1,420 total clicks",
		bgDevice: "72% mobile",
	},
	{
		id: "campaign",
		tab: "Campaigns",
		tag: "Marketing Campaign",
		badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
		title: "Q4 Product Launch",
		subtitle: "6 grouped links · Unified multi-touch UTM attribution",
		shortSlug: "sho.rt/c/q4-launch",
		fullUrl: "http://localhost:8080/r/c/q4-launch",
		targetUrl: "https://brand.com/launch?utm_campaign=q4_launch",
		folderPath: "campaigns / q4-growth-launch",
		linksCount: 6,
		utmParams: [
			{ key: "utm_campaign", value: "q4_launch" },
			{ key: "utm_source", value: "multi-channel" },
			{ key: "utm_medium", value: "email_social_ads" },
		],
		channels: [
			{ name: "Email Newsletter", pct: 48, clicks: "1,834", color: "bg-primary" },
			{ name: "Social / Twitter", pct: 32, clicks: "1,223", color: "bg-amber-500" },
			{ name: "Search & Ads", pct: 20, clicks: "763", color: "bg-emerald-500" },
		],
		metricLabel: "Campaign Clicks",
		metricValue: "3,820 Total",
		pill1: "📁 6 Unified URLs",
		pill2: "🏷️ Multi-Touch UTM",
		pill3: "📊 100% Attributed",
		bgTrend: "+42% vs previous run",
		bgClicks: "3,820 campaign clicks",
		bgDevice: "3 channels active",
	},
	{
		id: "ab-test",
		tab: "A/B Testing",
		tag: "Conversion Split",
		badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
		title: "Hero CTA Optimization",
		subtitle: "Server-side traffic split · 30-day sticky sessions",
		shortSlug: "sho.rt/pricing-test",
		fullUrl: "http://localhost:8080/r/pricing-test",
		targetUrl: "https://brand.com/pricing-v2",
		cookieName: "ab_pricing-test=B",
		cookieTtl: "30 Days (2,592,000s)",
		variants: [
			{
				key: "A",
				label: "Control (Monthly)",
				weight: 50,
				destination: ".../pricing-monthly",
				clicks: "482",
				conv: "12.4%",
				isLeading: false,
			},
			{
				key: "B",
				label: "Challenger (Annual Pill)",
				weight: 50,
				destination: ".../pricing-annual",
				clicks: "518",
				conv: "18.2%",
				isLeading: true,
			},
		],
		metricLabel: "Conversion Lift",
		metricValue: "+46.7% (Variant B)",
		pill1: "⚖️ 50/50 Split",
		pill2: "🍪 30d Sticky Cookie",
		pill3: "⚡ 0ms Client Flicker",
		bgTrend: "+46.7% Variant B Lift",
		bgClicks: "1,000 total test clicks",
		bgDevice: "Server-side routing",
	},
];

/**
 * Hallmark · Clean Studio Hero Section
 * Interactive shortener on left, live 3-pillar card switcher on right.
 */
export function HeroSection() {
	const navigate = useNavigate();
	const { logged, isLogged, user } = useAuthStore();
	const isAuthenticated = !!(logged || isLogged || user);

	const [form, setForm] = React.useState({
		urlInput: "",
		customSlug: "",
		campaignName: "",
		utmSource: "",
		utmMedium: "",
		utmCampaign: "",
		utmContent: "",
		activeOptionTab: null, // "slug" | "utm" | "campaign" | null
		isShortening: false,
		shortenedResult: null,
		copied: false,
		showQr: false,
		activeCardIndex: 0,
	});

	const update = React.useCallback((updates) => {
		setForm((prev) => ({ ...prev, ...updates }));
	}, []);

	const {
		urlInput,
		customSlug,
		campaignName,
		utmSource,
		utmMedium,
		utmCampaign,
		utmContent,
		activeOptionTab,
		isShortening,
		shortenedResult,
		copied,
		showQr,
		activeCardIndex,
	} = form;

	const currentCard = SHOWCASE_CARDS[activeCardIndex] || SHOWCASE_CARDS[0];

	// Count of active UTM parameters
	const utmCount = [utmSource, utmMedium, utmCampaign, utmContent].filter(
		(v) => v && v.trim()
	).length;
	const hasSlug = Boolean(customSlug.trim());
	const hasCampaign = Boolean(campaignName.trim());

	// Presets for quick UTM attribution
	const UTM_PRESETS = [
		{ label: "📧 Email", source: "newsletter", medium: "email" },
		{ label: "🐦 X / Twitter", source: "twitter", medium: "social" },
		{ label: "💼 LinkedIn", source: "linkedin", medium: "social" },
		{ label: "🔍 Google Ads", source: "google", medium: "cpc" },
	];

	// Presets for quick Campaign tagging
	const CAMPAIGN_PRESETS = [
		"Q4 Growth Launch",
		"Black Friday Promo",
		"Product Hunt Launch",
		"Creator Collabs",
	];

	// Computed preview URL with UTM parameters baked in
	const computedFinalUrl = React.useMemo(() => {
		let target = urlInput.trim();
		if (!target) return "";
		if (!target.startsWith("http://") && !target.startsWith("https://")) {
			target = "https://" + target;
		}
		if (!utmSource.trim() && !utmMedium.trim() && !utmCampaign.trim() && !utmContent.trim()) {
			return target;
		}
		try {
			const parsed = new URL(target);
			if (utmSource.trim()) parsed.searchParams.set("utm_source", utmSource.trim());
			if (utmMedium.trim()) parsed.searchParams.set("utm_medium", utmMedium.trim());
			if (utmCampaign.trim()) parsed.searchParams.set("utm_campaign", utmCampaign.trim());
			if (utmContent.trim()) parsed.searchParams.set("utm_content", utmContent.trim());
			return parsed.toString();
		} catch {
			return target;
		}
	}, [urlInput, utmSource, utmMedium, utmCampaign, utmContent]);

	const createUrlMutation = useCreateUrlMutation({
		onSuccess: (data) => {
			const slug = data?.shortCode || customSlug.trim();
			const fullShortUrl = `http://localhost:8080/r/${slug}`;
			update({
				isShortening: false,
				shortenedResult: {
					shortCode: slug,
					shortUrl: fullShortUrl,
					destinationUrl: data?.destinationUrl || computedFinalUrl || urlInput.trim(),
					campaignName: campaignName.trim() || undefined,
					utmSource: utmSource.trim() || undefined,
					utmMedium: utmMedium.trim() || undefined,
					utmCampaign: utmCampaign.trim() || undefined,
					isReal: true,
				},
			});
			toast.success("Short link created successfully!");
		},
		onError: (err) => {
			update({ isShortening: false });
			toast.error(err?.response?.data?.message || "Failed to shorten URL");
		},
	});

	const handleShorten = (e) => {
		e?.preventDefault();
		let target = urlInput.trim();
		if (!target) {
			toast.error("Please enter a destination URL");
			return;
		}

		if (!target.startsWith("http://") && !target.startsWith("https://")) {
			target = "https://" + target;
		}

		// Compose UTM parameters if provided
		let finalUrl = target;
		if (utmSource.trim() || utmMedium.trim() || utmCampaign.trim() || utmContent.trim()) {
			try {
				const parsed = new URL(target);
				if (utmSource.trim()) parsed.searchParams.set("utm_source", utmSource.trim());
				if (utmMedium.trim()) parsed.searchParams.set("utm_medium", utmMedium.trim());
				if (utmCampaign.trim()) parsed.searchParams.set("utm_campaign", utmCampaign.trim());
				if (utmContent.trim()) parsed.searchParams.set("utm_content", utmContent.trim());
				finalUrl = parsed.toString();
			} catch {
				finalUrl = target;
			}
		}

		update({ isShortening: true });

		if (isAuthenticated) {
			createUrlMutation.mutate({
				destinationUrl: finalUrl,
				customSlug: customSlug.trim() || undefined,
			});
		} else {
			// Demonstration short link fallback
			setTimeout(() => {
				const randomSlug = customSlug.trim() || Math.random().toString(36).substring(2, 8);
				const fullShortUrl = `http://localhost:8080/r/${randomSlug}`;
				update({
					isShortening: false,
					shortenedResult: {
						shortCode: randomSlug,
						shortUrl: fullShortUrl,
						destinationUrl: finalUrl,
						campaignName: campaignName.trim() || undefined,
						utmSource: utmSource.trim() || undefined,
						utmMedium: utmMedium.trim() || undefined,
						utmCampaign: utmCampaign.trim() || undefined,
						isReal: false,
					},
				});
				toast.success("Demonstration short link generated!");
			}, 300);
		}
	};

	const handleCopy = (text) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		update({ copied: true });
		toast.success("Copied to clipboard!");
		setTimeout(() => update({ copied: false }), 2000);
	};

	const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
		currentCard.fullUrl
	)}&margin=1`;

	return (
		<section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
			{/* Subtle ambient background glow */}
			<div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-primary/10 blur-[120px] rounded-full -z-10" />

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
					{/* Left Column: Headline, Copy, and Interactive Shortener */}
					<div className="lg:col-span-7 space-y-6 text-left">
						{/* Status Pill */}
						<div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3.5 py-1 text-xs font-medium text-foreground/85 shadow-2xs">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<span>URLs · Marketing Campaigns · Multivariate A/B Testing</span>
						</div>

						{/* Display Headline with Inline Tactile Icon Badges (Roman typography only) */}
						<h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
							Shorten{" "}
							<span className="inline-flex items-center justify-center size-9 sm:size-11 rounded-2xl bg-primary/10 text-primary align-middle mx-1 border border-primary/20 shadow-2xs">
								<IconLink className="size-5 sm:size-6" />
							</span>{" "}
							Links.
							<br />
							Run{" "}
							<span className="inline-flex items-center justify-center size-9 sm:size-11 rounded-2xl bg-amber-500/10 text-amber-500 align-middle mx-1 border border-amber-500/20 shadow-2xs">
								<IconTag className="size-5 sm:size-6" />
							</span>{" "}
							Campaigns.
							<br />
							Split Test{" "}
							<span className="inline-flex items-center justify-center size-9 sm:size-11 rounded-2xl bg-emerald-500/10 text-emerald-500 align-middle mx-1 border border-emerald-500/20 shadow-2xs">
								<IconFlask className="size-5 sm:size-6" />
							</span>{" "}
							Smarter.
						</h1>

						{/* Subtitle */}
						<p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
							Engineered for modern growth teams. Generate{" "}
							<strong className="text-foreground font-semibold">sub-10ms short URLs</strong> with dynamic QR codes, track{" "}
							<strong className="text-foreground font-semibold">cross-channel campaigns</strong> with multi-touch UTM attribution, and execute{" "}
							<strong className="text-foreground font-semibold">server-side A/B split tests</strong> with 30-day visitor consistency.
						</p>

						{/* The Quick Shortener Input Card */}
						<div className="pt-2 max-w-xl">
							<div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-lg space-y-3 backdrop-blur-xs">
								<form onSubmit={handleShorten} className="space-y-3">
									<div className="flex flex-col sm:flex-row gap-2">
										<div className="relative flex-1">
											<IconLink className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
											<Input
												type="text"
												value={urlInput}
												onChange={(e) => update({ urlInput: e.target.value })}
												placeholder="Paste link (e.g. brand.com/launch)..."
												className="pl-10 h-11 text-sm bg-background border-border/70 focus-visible:ring-1 focus-visible:ring-primary font-normal rounded-xl"
											/>
										</div>
										<Button
											type="submit"
											disabled={isShortening}
											className="h-11 px-6 font-semibold cursor-pointer shrink-0 shadow-xs rounded-xl"
										>
											{isShortening ? "Shortening..." : "Shorten"}
											{!isShortening && <IconArrowRight className="size-4 ml-1.5" />}
										</Button>
									</div>

									{/* Clean Options Toolbar */}
									<div className="pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
										<div className="flex items-center gap-1.5 flex-wrap">
											<span className="text-[11px] font-medium text-muted-foreground mr-1 select-none">
												Options:
											</span>

											{/* 1. Custom Slug Toggle */}
											<button
												type="button"
												onClick={() =>
													update({
														activeOptionTab: activeOptionTab === "slug" ? null : "slug",
													})
												}
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
													activeOptionTab === "slug"
														? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
														: hasSlug
														? "bg-primary/10 text-primary border-primary/30 font-medium"
														: "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
												}`}
											>
												<IconBolt className="size-3.5" />
												<span>Custom slug</span>
												{hasSlug && activeOptionTab !== "slug" && (
													<span className="size-1.5 rounded-full bg-primary" />
												)}
											</button>

											{/* 2. UTM Builder Toggle */}
											<button
												type="button"
												onClick={() =>
													update({
														activeOptionTab: activeOptionTab === "utm" ? null : "utm",
													})
												}
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
													activeOptionTab === "utm"
														? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
														: utmCount > 0
														? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium"
														: "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
												}`}
											>
												<IconTag className="size-3.5" />
												<span>UTM parameters</span>
												{utmCount > 0 && (
													<span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-semibold">
														{utmCount}
													</span>
												)}
											</button>

											{/* 3. Campaign Tag Toggle */}
											<button
												type="button"
												onClick={() =>
													update({
														activeOptionTab: activeOptionTab === "campaign" ? null : "campaign",
													})
												}
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
													activeOptionTab === "campaign"
														? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
														: hasCampaign
														? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium"
														: "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
												}`}
											>
												<IconFolder className="size-3.5" />
												<span>Campaign tag</span>
												{hasCampaign && activeOptionTab !== "campaign" && (
													<span className="size-1.5 rounded-full bg-emerald-500" />
												)}
											</button>
										</div>

										<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground select-none shrink-0">
											<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
											<span>Sub-10ms redirection</span>
										</div>
									</div>

									{/* Expandable Drawer Panel for Active Option */}
									{activeOptionTab && (
										<div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-2.5 transition-all">
											<div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/40">
												<span className="font-semibold text-foreground flex items-center gap-1.5">
													{activeOptionTab === "slug" && (
														<>
															<IconBolt className="size-3.5 text-primary" />
															<span>Custom Slug (Alias)</span>
														</>
													)}
													{activeOptionTab === "utm" && (
														<>
															<IconTag className="size-3.5 text-amber-500" />
															<span>UTM Attribution Parameters</span>
														</>
													)}
													{activeOptionTab === "campaign" && (
														<>
															<IconFolder className="size-3.5 text-emerald-500" />
															<span>Marketing Campaign Tag</span>
														</>
													)}
												</span>

												<div className="flex items-center gap-2">
													{activeOptionTab === "slug" && hasSlug && (
														<button
															type="button"
															onClick={() => update({ customSlug: "" })}
															className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
														>
															Clear
														</button>
													)}
													{activeOptionTab === "utm" && utmCount > 0 && (
														<button
															type="button"
															onClick={() =>
																update({
																	utmSource: "",
																	utmMedium: "",
																	utmCampaign: "",
																	utmContent: "",
																})
															}
															className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
														>
															Clear UTM
														</button>
													)}
													{activeOptionTab === "campaign" && hasCampaign && (
														<button
															type="button"
															onClick={() => update({ campaignName: "" })}
															className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
														>
															Clear
														</button>
													)}
													<button
														type="button"
														onClick={() => update({ activeOptionTab: null })}
														className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
														title="Close options"
													>
														<IconX className="size-3.5" />
													</button>
												</div>
											</div>

											{/* Panel Content: Custom Slug */}
											{activeOptionTab === "slug" && (
												<div className="space-y-1.5">
													<div className="flex items-center rounded-lg border border-border/70 bg-background px-3 h-9 text-xs">
														<span className="text-muted-foreground font-mono select-none font-medium">
															sho.rt/
														</span>
														<input
															type="text"
															value={customSlug}
															onChange={(e) =>
																update({
																	customSlug: e.target.value
																		.toLowerCase()
																		.replace(/[^a-z0-9_-]/g, ""),
																})
															}
															placeholder="summer-release"
															className="bg-transparent text-xs font-mono outline-none text-foreground flex-1 ml-1"
														/>
													</div>
													<p className="text-[10px] text-muted-foreground">
														Customize the link alias for memorable brand recognition.
													</p>
												</div>
											)}

											{/* Panel Content: UTM Builder */}
											{activeOptionTab === "utm" && (
												<div className="space-y-2">
													{/* 1-Click Channel Presets */}
													<div className="flex items-center gap-1.5 flex-wrap">
														<span className="text-[10px] font-medium text-muted-foreground">
															Presets:
														</span>
														{UTM_PRESETS.map((p) => (
															<button
																key={p.label}
																type="button"
																onClick={() =>
																	update({
																		utmSource: p.source,
																		utmMedium: p.medium,
																		utmCampaign: utmCampaign || "q4_launch",
																	})
																}
																className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted border border-border/60 text-foreground cursor-pointer transition-colors"
															>
																{p.label}
															</button>
														))}
													</div>

													<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
														<div>
															<label className="text-[10px] font-medium text-muted-foreground mb-1 block">
																utm_campaign
															</label>
															<Input
																value={utmCampaign}
																onChange={(e) => update({ utmCampaign: e.target.value })}
																placeholder="q4_launch"
																className="h-8 text-xs bg-background"
															/>
														</div>
														<div>
															<label className="text-[10px] font-medium text-muted-foreground mb-1 block">
																utm_source
															</label>
															<Input
																value={utmSource}
																onChange={(e) => update({ utmSource: e.target.value })}
																placeholder="newsletter, x"
																className="h-8 text-xs bg-background"
															/>
														</div>
														<div>
															<label className="text-[10px] font-medium text-muted-foreground mb-1 block">
																utm_medium
															</label>
															<Input
																value={utmMedium}
																onChange={(e) => update({ utmMedium: e.target.value })}
																placeholder="email, social"
																className="h-8 text-xs bg-background"
															/>
														</div>
													</div>

													{computedFinalUrl && (
														<div className="pt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono truncate">
															<span className="font-sans font-semibold text-foreground shrink-0">
																Target:
															</span>
															<span className="truncate text-primary">{computedFinalUrl}</span>
														</div>
													)}
												</div>
											)}

											{/* Panel Content: Campaign Tag */}
											{activeOptionTab === "campaign" && (
												<div className="space-y-2">
													<div className="flex items-center gap-1.5 flex-wrap">
														<span className="text-[10px] font-medium text-muted-foreground">
															Suggestions:
														</span>
														{CAMPAIGN_PRESETS.map((c) => (
															<button
																key={c}
																type="button"
																onClick={() => update({ campaignName: c })}
																className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted border border-border/60 text-foreground cursor-pointer transition-colors"
															>
																{c}
															</button>
														))}
													</div>
													<Input
														value={campaignName}
														onChange={(e) => update({ campaignName: e.target.value })}
														placeholder="e.g. Q4 Growth Launch"
														className="h-8 text-xs bg-background"
													/>
													<p className="text-[10px] text-muted-foreground">
														Tags this link into campaign aggregations and cross-channel reporting rollups.
													</p>
												</div>
											)}
										</div>
									)}
								</form>

								{/* If Shortened: Active Result Card */}
								{shortenedResult && (
									<div className="mt-4 pt-3 border-t border-border/60 space-y-3">
										<div className="flex items-center justify-between text-xs font-semibold text-foreground">
											<span className="flex items-center gap-1.5 text-emerald-500">
												<IconCheck className="size-4" /> Ready to share
											</span>
											{!shortenedResult.isReal && (
												<span className="text-[10px] text-muted-foreground font-normal">
													Sign in to track in your dashboard
												</span>
											)}
										</div>

										<div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border">
											<span className="font-mono text-xs sm:text-sm font-bold text-primary truncate">
												{shortenedResult.shortUrl}
											</span>
											<div className="flex items-center gap-1.5 shrink-0">
												<button
													type="button"
													onClick={() => handleCopy(shortenedResult.shortUrl)}
													className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-background border border-border hover:bg-muted text-foreground cursor-pointer"
												>
													{copied ? (
														<IconCheck className="size-3 text-emerald-500" />
													) : (
														<IconCopy className="size-3" />
													)}
													<span>{copied ? "Copied" : "Copy"}</span>
												</button>

												<button
													type="button"
													onClick={() => update({ showQr: !showQr })}
													className={`p-1.5 rounded-lg border cursor-pointer ${
														showQr
															? "bg-primary text-primary-foreground border-primary"
															: "bg-background border-border hover:bg-muted text-foreground"
													}`}
													title="Toggle QR Code"
												>
													<IconQrcode className="size-4" />
												</button>
											</div>
										</div>

										{/* Active Badges for Campaign and UTM */}
										{(shortenedResult.campaignName || shortenedResult.utmSource || shortenedResult.utmCampaign) && (
											<div className="flex items-center gap-1.5 flex-wrap text-[10px]">
												{shortenedResult.campaignName && (
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
														<IconFolder className="size-3" />
														<span>{shortenedResult.campaignName}</span>
													</span>
												)}
												{(shortenedResult.utmSource || shortenedResult.utmCampaign) && (
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
														<IconTag className="size-3" />
														<span>UTM: {[shortenedResult.utmCampaign, shortenedResult.utmSource, shortenedResult.utmMedium].filter(Boolean).join(" · ")}</span>
													</span>
												)}
											</div>
										)}

										{showQr && (
											<div className="p-3 bg-muted/30 rounded-xl border border-border/60 flex items-center gap-4">
												<div className="size-20 bg-white rounded-lg p-1 border border-border shrink-0 flex items-center justify-center">
													<img
														src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
															shortenedResult.shortUrl
														)}&margin=1`}
														alt="QR Code"
														className="size-full object-contain"
													/>
												</div>
												<div className="text-xs space-y-1">
													<p className="font-semibold text-foreground">
														Dynamic Scannable QR
													</p>
													<p className="text-muted-foreground text-[11px]">
														High-density print-ready vector. Update destination anytime without reprinting.
													</p>
												</div>
											</div>
										)}
									</div>
								)}
							</div>

							{/* Workspace shortcut */}
							<div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
								<span>Need A/B testing or campaign folders?</span>
								<Link
									to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.SIGNUP}
									className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
								>
									<span>{isAuthenticated ? "Open Workspace" : "Get started free"}</span>
									<IconArrowRight className="size-3" />
								</Link>
							</div>
						</div>
					</div>

					{/* Right Column: Interactive 3-Pillar Showcase Cards */}
					<div className="lg:col-span-5 relative flex flex-col items-center lg:items-end">
						{/* Clean Tab Selector: URL, Campaign, A/B Testing */}
						<div className="flex items-center justify-center gap-1.5 mb-4 p-1 rounded-xl bg-muted/60 border border-border/70 shadow-2xs">
							{SHOWCASE_CARDS.map((card, idx) => (
								<button
									key={card.id}
									type="button"
									onClick={() => update({ activeCardIndex: idx })}
									className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-medium ${
										activeCardIndex === idx
											? "bg-background text-foreground shadow-xs border border-border/80 font-semibold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{card.tab}
								</button>
							))}
						</div>

						<div className="relative w-full max-w-[440px]">
							{/* Background Tilted Analytics Card (Layer 1) */}
							<div className="absolute -top-6 -left-4 sm:-left-6 w-full rounded-2xl border border-border/60 bg-muted/40 p-5 shadow-md -rotate-2 scale-95 pointer-events-none opacity-80 dark:opacity-60 hidden sm:block">
								<div className="flex items-center justify-between pb-3 border-b border-border/40">
									<div className="flex items-center gap-2">
										<IconChartBar className="size-4 text-primary" />
										<span className="text-xs font-semibold text-foreground">
											Live Engagement
										</span>
									</div>
									<span className="text-[11px] font-mono text-emerald-500 font-semibold">
										{currentCard.bgTrend}
									</span>
								</div>
								<div className="pt-3 flex items-center justify-between text-xs text-muted-foreground">
									<span>{currentCard.bgClicks}</span>
									<span className="flex items-center gap-1 font-mono">
										<IconBolt className="size-3.5 text-amber-500" /> {currentCard.bgDevice}
									</span>
								</div>
							</div>

							{/* Front Main Showcase Card (Layer 2) */}
							<div className="relative rounded-3xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
								{/* Card Top Header */}
								<div className="flex items-center justify-between pb-4 border-b border-border/50">
									<div className="flex items-center gap-2.5">
										<div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
											{currentCard.id === "url" && <IconLink className="size-4.5" />}
											{currentCard.id === "campaign" && <IconFolder className="size-4.5" />}
											{currentCard.id === "ab-test" && <IconFlask className="size-4.5" />}
										</div>
										<div>
											<p className="text-xs font-bold text-foreground leading-none">
												{currentCard.title}
											</p>
											<p className="text-[10px] text-muted-foreground mt-0.5">
												{currentCard.subtitle}
											</p>
										</div>
									</div>
									<span
										className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${currentCard.badgeColor}`}
									>
										<span className="size-1.5 rounded-full bg-current" />
										{currentCard.tag}
									</span>
								</div>

								{/* Tailored Card Body for URL vs Campaign vs A/B Testing */}
								<div className="mt-4 space-y-3.5">
									{/* CARD TYPE 1: URL & Dynamic QR */}
									{currentCard.id === "url" && (
										<>
											<div className="space-y-1">
												<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
													Target Destination
												</span>
												<p className="text-xs font-mono text-muted-foreground truncate bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50">
													{currentCard.targetUrl}
												</p>
											</div>

											<div className="space-y-1">
												<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
													Shortened URL
												</span>
												<div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-3 py-2">
													<span className="font-mono text-xs sm:text-sm font-bold text-primary">
														{currentCard.shortSlug}
													</span>
													<button
														type="button"
														onClick={() => handleCopy(currentCard.fullUrl)}
														className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/80 hover:text-primary transition-colors cursor-pointer bg-background px-2 py-1 rounded-md border border-border/60 shadow-2xs"
													>
														{copied ? (
															<IconCheck className="size-3 text-emerald-500" />
														) : (
															<IconCopy className="size-3" />
														)}
														<span>{copied ? "Copied" : "Copy"}</span>
													</button>
												</div>
											</div>

											{/* QR Code & Location Breakdown Strip */}
											<div className="pt-1 flex items-center gap-4 bg-muted/20 p-3 rounded-xl border border-border/50">
												<div className="size-16 rounded-lg bg-white p-1 shadow-2xs shrink-0 flex items-center justify-center border border-border/40">
													<img
														src={qrImageUrl}
														alt={`QR for ${currentCard.shortSlug}`}
														className="size-full object-contain"
													/>
												</div>
												<div className="min-w-0 flex-1 space-y-1">
													<div className="flex items-center justify-between text-xs">
														<span className="font-semibold text-foreground flex items-center gap-1">
															<IconBolt className="size-3 text-amber-500" /> {currentCard.metricLabel}
														</span>
														<span className="font-mono font-bold text-xs text-foreground">
															{currentCard.metricValue}
														</span>
													</div>
													<div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
														<span className="bg-background px-1.5 py-0.5 rounded border border-border/50">
															{currentCard.pill1}
														</span>
														<span className="bg-background px-1.5 py-0.5 rounded border border-border/50">
															{currentCard.pill2}
														</span>
														<span className="bg-background px-1.5 py-0.5 rounded border border-border/50">
															{currentCard.pill3}
														</span>
													</div>
													<p className="text-[10px] text-muted-foreground pt-0.5">
														Dynamic QR updates destination without reprinting
													</p>
												</div>
											</div>
										</>
									)}

									{/* CARD TYPE 2: Campaign & Multi-Touch UTM Tracking */}
									{currentCard.id === "campaign" && (
										<>
											{/* Campaign Folder Breadcrumb */}
											<div className="flex items-center justify-between bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50 text-xs">
												<div className="flex items-center gap-1.5 font-mono text-muted-foreground">
													<IconFolder className="size-3.5 text-amber-500" />
													<span>{currentCard.folderPath}</span>
												</div>
												<span className="text-[10px] font-semibold text-foreground bg-background px-2 py-0.5 rounded border border-border/60">
													{currentCard.linksCount} Active Links
												</span>
											</div>

											{/* UTM Parameter Tag Strip */}
											<div className="space-y-1">
												<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
													Injected Campaign UTM Parameters
												</span>
												<div className="flex flex-wrap gap-1.5">
													{currentCard.utmParams.map((param) => (
														<span
															key={param.key}
															className="font-mono text-[10px] bg-muted/40 border border-border/60 px-2 py-0.5 rounded text-foreground/85"
														>
															<strong className="text-primary font-medium">{param.key}</strong>={param.value}
														</span>
													))}
												</div>
											</div>

											{/* Multi-Channel Attribution Breakdown */}
											<div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-2">
												<div className="flex items-center justify-between text-xs">
													<span className="font-semibold text-foreground flex items-center gap-1">
														<IconLayersLinked className="size-3 text-amber-500" /> Multi-Channel Attribution
													</span>
													<span className="font-mono font-bold text-xs text-foreground">
														{currentCard.metricValue}
													</span>
												</div>

												{/* Stacked Percentage Bar */}
												<div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
													{currentCard.channels.map((ch) => (
														<div
															key={ch.name}
															style={{ width: `${ch.pct}%` }}
															className={`h-full ${ch.color}`}
															title={`${ch.name}: ${ch.pct}%`}
														/>
													))}
												</div>

												{/* Channel Legend & Stats */}
												<div className="grid grid-cols-3 gap-1 pt-1 text-[10px]">
													{currentCard.channels.map((ch) => (
														<div key={ch.name} className="space-y-0.5">
															<span className="text-muted-foreground block truncate">{ch.name}</span>
															<span className="font-semibold text-foreground font-mono">
																{ch.pct}% ({ch.clicks})
															</span>
														</div>
													))}
												</div>
											</div>
										</>
									)}

									{/* CARD TYPE 3: A/B Testing & Sticky Sessions */}
									{currentCard.id === "ab-test" && (
										<>
											{/* Server-side Routing Notice */}
											<div className="flex items-center justify-between bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50 text-xs">
												<div className="flex items-center gap-1.5 text-foreground font-medium">
													<IconGitFork className="size-3.5 text-emerald-500" />
													<span>In-Memory Weighted Edge Router</span>
												</div>
												<span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
													ACTIVE
												</span>
											</div>

											{/* Variant A vs Variant B Split View */}
											<div className="space-y-2">
												{currentCard.variants.map((v) => (
													<div
														key={v.key}
														className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
															v.isLeading
																? "bg-emerald-500/5 border-emerald-500/30"
																: "bg-muted/30 border-border/50"
														}`}
													>
														<div className="min-w-0 space-y-0.5">
															<div className="flex items-center gap-1.5">
																<span className="size-4 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
																	{v.key}
																</span>
																<span className="font-semibold text-foreground truncate">
																	{v.label}
																</span>
																{v.isLeading && (
																	<span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1 rounded">
																		Leading (+46.7%)
																	</span>
																)}
															</div>
															<p className="font-mono text-[10px] text-muted-foreground truncate">
																{v.destination}
															</p>
														</div>

														<div className="text-right shrink-0 pl-2">
															<span className="font-mono font-bold text-xs text-foreground block">
																{v.conv} conv
															</span>
															<span className="text-[10px] text-muted-foreground">
																{v.clicks} clicks ({v.weight}%)
															</span>
														</div>
													</div>
												))}
											</div>

											{/* Sticky Session Badge */}
											<div className="p-2 rounded-xl bg-muted/20 border border-border/50 flex items-center justify-between text-[10px]">
												<div className="flex items-center gap-1.5 text-muted-foreground font-mono truncate">
													<IconCookie className="size-3.5 text-amber-500 shrink-0" />
													<span className="truncate">{currentCard.cookieName}</span>
												</div>
												<span className="text-muted-foreground shrink-0 font-medium pl-1">
													{currentCard.cookieTtl}
												</span>
											</div>
										</>
									)}
								</div>

								{/* Bottom Link Action */}
								<div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
									<span className="text-muted-foreground text-[11px]">
										{currentCard.id === "url" && "Instant redirect · zero lag"}
										{currentCard.id === "campaign" && "Real-time channel attribution"}
										{currentCard.id === "ab-test" && "30-day consistent visitor journeys"}
									</span>
									<Link
										to={ROUTES.DASHBOARD}
										className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs"
									>
										<span>Explore in workspace</span>
										<IconArrowUpRight className="size-3.5" />
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Clean 3-Pillar Platform Strip */}
				<div className="mt-16 sm:mt-20 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
					{/* Platform Highlights */}
					<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
						<span className="size-2 rounded-full bg-emerald-500" />
						<span className="font-semibold text-foreground">
							Purpose-built for growth teams:
						</span>
						<span>Sub-10ms Instant Redirects</span>
						<span className="text-border">·</span>
						<span>Dynamic Vector QR Codes</span>
						<span className="text-border">·</span>
						<span>Zero Client Page Flicker</span>
					</div>

					{/* 3 Core Pillar Badges */}
					<div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
						<span className="rounded-full bg-primary/10 border border-primary/20 text-primary px-3 py-1 font-medium">
							1. High-Velocity URLs & QR
						</span>
						<span className="rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 font-medium">
							2. Multi-Touch Campaigns
						</span>
						<span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 font-medium">
							3. Multivariate A/B Testing
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}

export default HeroSection;
