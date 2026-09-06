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
} from "@tabler/icons-react";

/**
 * Showcase presets representing real use cases.
 * Switched instantly via clicks with zero animation jitter.
 */
const SHOWCASE_CARDS = [
	{
		id: "launch",
		tab: "Product Launch",
		tag: "Campaign",
		badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
		title: "Summer Release 2026",
		shortSlug: "sho.rt/launch-2026",
		fullUrl: "http://localhost:8080/r/launch-2026",
		targetUrl: "https://brand.com/products/launch-2026?ref=press",
		qrCodeSlug: "launch-2026",
		metricLabel: "Top Locations",
		metricValue: "842 Clicks",
		pill1: "🇺🇸 54%",
		pill2: "🇩🇪 22%",
		pill3: "🇬🇧 14%",
		bgTrend: "+34% this week",
		bgClicks: "1,420 total clicks",
		bgDevice: "72% mobile",
	},
	{
		id: "creator",
		tab: "Creator Bio",
		tag: "Social Bio",
		badgeColor: "bg-primary/10 text-primary border-primary/20",
		title: "Main Channel & Portfolio",
		shortSlug: "sho.rt/creator-bio",
		fullUrl: "http://localhost:8080/r/creator-bio",
		targetUrl: "https://youtube.com/@creativecraft?sub_confirmation=1",
		qrCodeSlug: "creator-bio",
		metricLabel: "Traffic Channels",
		metricValue: "2,190 Clicks",
		pill1: "YouTube 68%",
		pill2: "IG 21%",
		pill3: "X 11%",
		bgTrend: "+58% this week",
		bgClicks: "2,190 total clicks",
		bgDevice: "91% mobile",
	},
	{
		id: "event",
		tab: "Event Pass",
		tag: "Dynamic QR",
		badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
		title: "Tech Summit Badge Pass",
		shortSlug: "sho.rt/summit-pass",
		fullUrl: "http://localhost:8080/r/summit-pass",
		targetUrl: "https://summit.example.com/tickets/vip-access?badge=true",
		qrCodeSlug: "summit-pass",
		metricLabel: "Badge Check-ins",
		metricValue: "620 Scans",
		pill1: "📍 In-Person 94%",
		pill2: "⚡ Sub-second scan",
		pill3: "Verified",
		bgTrend: "100% attendance sync",
		bgClicks: "620 badge scans",
		bgDevice: "100% camera scan",
	},
];

/**
 * Hallmark · Clean Studio Hero Section (Motion-Cut / No Animations)
 * Features live interactive shortener on left, instant tactile card preview on right,
 * and zero fake metrics or star ratings.
 */
export function HeroSection() {
	const navigate = useNavigate();
	const { logged, isLogged, user } = useAuthStore();
	const isAuthenticated = !!(logged || isLogged || user);

	// Consolidated single state object to minimize re-renders and memory allocations
	const [form, setForm] = React.useState({
		urlInput: "",
		customSlug: "",
		showCustomAlias: false,
		showUtm: false,
		utmSource: "",
		utmMedium: "",
		utmCampaign: "",
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
		showCustomAlias,
		showUtm,
		utmSource,
		utmMedium,
		utmCampaign,
		isShortening,
		shortenedResult,
		copied,
		showQr,
		activeCardIndex,
	} = form;

	const currentCard = SHOWCASE_CARDS[activeCardIndex] || SHOWCASE_CARDS[0];

	const createUrlMutation = useCreateUrlMutation({
		onSuccess: (data) => {
			const slug = data?.shortCode || customSlug.trim();
			const fullShortUrl = `http://localhost:8080/r/${slug}`;
			update({
				isShortening: false,
				shortenedResult: {
					shortCode: slug,
					shortUrl: fullShortUrl,
					destinationUrl: data?.destinationUrl || urlInput.trim(),
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
		if (showUtm && (utmSource.trim() || utmMedium.trim() || utmCampaign.trim())) {
			try {
				const parsed = new URL(target);
				if (utmSource.trim()) parsed.searchParams.set("utm_source", utmSource.trim());
				if (utmMedium.trim()) parsed.searchParams.set("utm_medium", utmMedium.trim());
				if (utmCampaign.trim()) parsed.searchParams.set("utm_campaign", utmCampaign.trim());
				finalUrl = parsed.toString();
			} catch {
				finalUrl = target;
			}
		}

		const slug = customSlug.trim() || undefined;

		if (!isAuthenticated) {
			toast.info("Please sign in or create an account to shorten and track links.");
			navigate(ROUTES.LOGIN, { state: { targetUrl: finalUrl } });
			return;
		}

		update({ isShortening: true });
		createUrlMutation.mutate({
			destinationUrl: finalUrl,
			customAlias: slug,
		});
	};

	const handleCopy = (text) => {
		const targetText = text || shortenedResult?.shortUrl || currentCard.fullUrl;
		if (!targetText) return;
		navigator.clipboard.writeText(targetText);
		update({ copied: true });
		toast.success("Link copied to clipboard");
		setTimeout(() => update({ copied: false }), 2000);
	};

	// Memoize QR URL to prevent unnecessary image downloads on unrelated re-renders
	const qrTarget = shortenedResult?.shortUrl || currentCard.fullUrl;
	const qrImageUrl = React.useMemo(() => {
		return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
			qrTarget,
		)}&margin=10`;
	}, [qrTarget]);

	return (
		<section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28">
			{/* Static ambient background glow */}
			<div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 -z-10 size-[800px] rounded-full bg-primary/6 blur-[120px]" />

			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* 2-Column Asymmetric Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
					{/* Left Column: Headline, Copy, and Interactive Shortener */}
					<div className="lg:col-span-7 space-y-6 text-left">
						{/* Status Pill */}
						<div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground/80 shadow-2xs">
							<span className="size-2 rounded-full bg-emerald-500" />
							<span>Free to use · Instant link shortening & dynamic QR</span>
						</div>

						{/* Display Headline with Inline Tactile Icon Badges */}
						<h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
							Shorten{" "}
							<span className="inline-flex items-center justify-center size-9 sm:size-11 rounded-2xl bg-primary/10 text-primary align-middle mx-1 border border-primary/20 shadow-2xs">
								<IconLink className="size-5 sm:size-6" />
							</span>{" "}
							Links
							<br />
							That Build Trust,
							<br />
							Go{" "}
							<span className="inline-flex items-center justify-center size-9 sm:size-11 rounded-2xl bg-amber-500/10 text-amber-500 align-middle mx-1 border border-amber-500/20 shadow-2xs">
								<IconRocket className="size-5 sm:size-6" />
							</span>{" "}
							Further.
						</h1>

						{/* Subtitle with bolded value propositions */}
						<p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
							Turn unwieldy URLs into{" "}
							<strong className="text-foreground font-semibold">clean branded links</strong>,
							generate{" "}
							<strong className="text-foreground font-semibold">print-ready QR codes</strong>,
							and track{" "}
							<strong className="text-foreground font-semibold">real-time clicks</strong> without
							tedious spreadsheets.
						</p>

						{/* The Quick Shortener Input Card */}
						<div className="pt-2 max-w-xl">
							<div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-md backdrop-blur-xs">
								<form onSubmit={handleShorten} className="space-y-3">
									{/* Main Input + Action Button */}
									<div className="flex flex-col sm:flex-row gap-2">
										<div className="relative flex-1">
											<IconLink className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
											<Input
												type="text"
												value={urlInput}
												onChange={(e) => update({ urlInput: e.target.value })}
												placeholder="Paste your link here (e.g. https://mybrand.com/launch)..."
												className="pl-10 h-11 text-sm bg-background border-border/70 focus-visible:ring-1 focus-visible:ring-primary font-normal"
											/>
										</div>
										<Button
											type="submit"
											disabled={isShortening}
											className="h-11 px-5 font-semibold cursor-pointer shrink-0 shadow-xs"
										>
											{isShortening ? "Shortening..." : "Shorten"}
											{!isShortening && <IconArrowRight className="size-4 ml-1.5" />}
										</Button>
									</div>

									{/* Quick Expanders: Custom Slug & UTM */}
									<div className="flex items-center justify-between pt-0.5 text-xs">
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => update({ showCustomAlias: !showCustomAlias })}
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer border text-xs ${
													showCustomAlias
														? "bg-primary/10 border-primary/30 text-primary font-medium"
														: "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
												}`}
											>
												<IconBolt className="size-3" />
												<span>Custom slug</span>
											</button>

											<button
												type="button"
												onClick={() => update({ showUtm: !showUtm })}
												className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer border text-xs ${
													showUtm
														? "bg-primary/10 border-primary/30 text-primary font-medium"
														: "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
												}`}
											>
												<IconTag className="size-3" />
												<span>Campaign tags</span>
											</button>
										</div>

										<span className="text-[11px] text-muted-foreground hidden sm:inline">
											Instant 1-click generation
										</span>
									</div>

									{/* Custom Slug Input */}
									{showCustomAlias && (
										<div className="pt-1">
											<div className="flex items-center rounded-lg border border-border/70 bg-background px-3 h-9 text-xs">
												<span className="text-muted-foreground font-mono select-none">
													localhost:8080/r/
												</span>
												<input
													type="text"
													value={customSlug}
													onChange={(e) => update({ customSlug: e.target.value })}
													placeholder="custom-slug (optional)"
													className="bg-transparent text-xs font-mono outline-none text-foreground flex-1 ml-1"
												/>
											</div>
										</div>
									)}

									{/* UTM Builder */}
									{showUtm && (
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
											<div>
												<label className="text-[10px] font-medium text-muted-foreground mb-1 block">
													utm_source
												</label>
												<Input
													value={utmSource}
													onChange={(e) => update({ utmSource: e.target.value })}
													placeholder="twitter, newsletter"
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
													placeholder="social, email"
													className="h-8 text-xs bg-background"
												/>
											</div>
											<div>
												<label className="text-[10px] font-medium text-muted-foreground mb-1 block">
													utm_campaign
												</label>
												<Input
													value={utmCampaign}
													onChange={(e) => update({ utmCampaign: e.target.value })}
													placeholder="launch2026"
													className="h-8 text-xs bg-background"
												/>
											</div>
										</div>
									)}
								</form>

								{/* If Shortened: Active Result Card */}
								{shortenedResult && (
									<div className="mt-4 pt-3 border-t border-border/60 space-y-3">
										<div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
											<div className="min-w-0">
												<span className="text-[10px] uppercase font-semibold text-primary block">
													Your Short Link
												</span>
												<span className="font-mono text-xs sm:text-sm font-bold text-foreground truncate block">
													{shortenedResult.shortUrl}
												</span>
											</div>
											<div className="flex items-center gap-1.5 shrink-0">
												<Button
													size="sm"
													onClick={() => handleCopy(shortenedResult.shortUrl)}
													className="h-8 px-3 text-xs gap-1 cursor-pointer"
												>
													{copied ? <IconCheck className="size-3.5" /> : <IconCopy className="size-3.5" />}
													<span>{copied ? "Copied" : "Copy"}</span>
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() => update({ showQr: !showQr })}
													className="h-8 px-2.5 text-xs cursor-pointer bg-background"
												>
													<IconQrcode className="size-3.5" />
												</Button>
											</div>
										</div>

										{showQr && (
											<div className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border/70">
												<img
													src={qrImageUrl}
													alt="QR Code"
													className="size-16 rounded-md border border-border"
												/>
												<div className="text-xs">
													<p className="font-semibold text-foreground">Scannable QR Code</p>
													<p className="text-muted-foreground text-[11px]">
														Ready to download for print, slides, or menus.
													</p>
												</div>
											</div>
										)}
									</div>
								)}
							</div>

							{/* Guest Prompt helper */}
							{!isAuthenticated && (
								<p className="mt-2.5 text-xs text-muted-foreground">
									Want to track analytics and manage links?{" "}
									<Link
										to={ROUTES.SIGNUP}
										className="text-primary hover:underline font-semibold"
									>
										Create free account →
									</Link>
								</p>
							)}
						</div>
					</div>

					{/* Right Column: Layered Static Preview Cards (Instant Click Switcher) */}
					<div className="lg:col-span-5 relative flex flex-col items-center lg:items-end">
						{/* Clean Tab Selector */}
						<div className="flex items-center justify-center gap-1.5 mb-4 p-1 rounded-xl bg-muted/50 border border-border/60">
							{SHOWCASE_CARDS.map((card, idx) => (
								<button
									key={card.id}
									type="button"
									onClick={() => update({ activeCardIndex: idx })}
									className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
										activeCardIndex === idx
											? "bg-background text-foreground shadow-xs border border-border/70 font-semibold"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{card.tab}
								</button>
							))}
						</div>

						<div className="relative w-full max-w-[440px]">
							{/* Background Tilted Analytics Card (Layer 1 - Static) */}
							<div className="absolute -top-6 -left-4 sm:-left-6 w-full rounded-2xl border border-border/60 bg-muted/50 p-5 shadow-md -rotate-2 scale-95 pointer-events-none opacity-80 dark:opacity-60 hidden sm:block">
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
										<IconDeviceMobile className="size-3.5" /> {currentCard.bgDevice}
									</span>
								</div>
							</div>

							{/* Front Main Showcase Card (Layer 2 - Static & Instant) */}
							<div className="relative rounded-3xl border border-border/80 bg-card p-6 shadow-xl backdrop-blur-md">
								{/* Card Top Header */}
								<div className="flex items-center justify-between pb-4 border-b border-border/50">
									<div className="flex items-center gap-2.5">
										<div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
											<IconSparkles className="size-4.5" />
										</div>
										<div>
											<p className="text-xs font-bold text-foreground leading-none">
												{currentCard.title}
											</p>
											<p className="text-[10px] text-muted-foreground mt-0.5">
												Dynamic QR & Real-time Telemetry
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

								{/* Link Details Body */}
								<div className="mt-4 space-y-3">
									{/* Destination URL preview */}
									<div className="space-y-1">
										<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
											Target Destination
										</span>
										<p className="text-xs font-mono text-muted-foreground truncate bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50">
											{currentCard.targetUrl}
										</p>
									</div>

									{/* Short URL with live Copy Button */}
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
												className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/80 hover:text-primary transition-colors cursor-pointer bg-background/80 px-2 py-1 rounded-md border border-border/60 shadow-2xs"
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
									<div className="pt-2 flex items-center gap-4 bg-muted/20 p-3 rounded-xl border border-border/50">
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
													<IconWorld className="size-3 text-primary" /> {currentCard.metricLabel}
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
												Dynamic QR updates automatically
											</p>
										</div>
									</div>
								</div>

								{/* Bottom Link Action */}
								<div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
									<span className="text-muted-foreground text-[11px]">
										Ready to share anywhere
									</span>
									<Link
										to={ROUTES.DASHBOARD}
										className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs"
									>
										<span>View live stats</span>
										<IconArrowUpRight className="size-3.5" />
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Full-width Clean Capabilities Strip (Zero Fake Ratings) */}
				<div className="mt-16 sm:mt-20 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
					{/* Honest Platform Highlights */}
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="size-2 rounded-full bg-emerald-500" />
						<span className="font-medium text-foreground">
							Purpose-built for modern campaigns
						</span>
						<span className="text-border">·</span>
						<span>Zero tracking cookies</span>
						<span className="text-border">·</span>
						<span>Clean redirection</span>
					</div>

					{/* Use-Case Badges */}
					<div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
						<span className="rounded-full bg-muted/40 border border-border/60 px-3 py-1">
							Social Bios
						</span>
						<span className="rounded-full bg-muted/40 border border-border/60 px-3 py-1">
							Product Launches
						</span>
						<span className="rounded-full bg-muted/40 border border-border/60 px-3 py-1">
							Packaging & Menus
						</span>
						<span className="rounded-full bg-muted/40 border border-border/60 px-3 py-1">
							Email Newsletters
						</span>
						<span className="rounded-full bg-muted/40 border border-border/60 px-3 py-1">
							Event Badges
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}

export default HeroSection;
