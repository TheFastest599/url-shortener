/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import * as React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
	IconLink,
	IconFolder,
	IconFlask,
	IconQrcode,
	IconCopy,
	IconCheck,
	IconArrowRight,
	IconCookie,
	IconGitFork,
	IconLayersLinked,
	IconBolt,
	IconChartBar,
	IconRefresh,
} from "@tabler/icons-react";

/**
 * Hallmark · Interactive Platform Workbench
 * Hands-on demonstration of URL Shortener, Marketing Campaigns, and A/B Split Testing.
 */
export function PlatformDeepDive() {
	const [activeTab, setActiveTab] = React.useState("url"); // "url" | "campaign" | "ab-test"

	// 1. URL Studio Interactive State
	const [urlState, setUrlState] = React.useState({
		inputUrl: "https://acme.org/announcements/2026-product-roadmap",
		customSlug: "roadmap-2026",
		copied: false,
	});

	// 2. Campaign Studio Interactive State
	const [selectedCampaignIndex, setSelectedCampaignIndex] = React.useState(0);
	const CAMPAIGN_PRESETS = [
		{
			id: "q4-launch",
			name: "Q4 Product Launch",
			folder: "campaigns / q4-growth-launch",
			totalClicks: "4,280",
			linksCount: 4,
			channels: [
				{ name: "Email Newsletter", pct: 45, clicks: "1,926", color: "bg-primary" },
				{ name: "Twitter / X Post", pct: 35, clicks: "1,498", color: "bg-amber-500" },
				{ name: "ProductHunt Drop", pct: 20, clicks: "856", color: "bg-emerald-500" },
			],
			links: [
				{ slug: "sho.rt/q4-news", source: "newsletter", medium: "email", clicks: 1926 },
				{ slug: "sho.rt/q4-post", source: "twitter", medium: "social", clicks: 1498 },
				{ slug: "sho.rt/q4-hunt", source: "producthunt", medium: "referral", clicks: 856 },
			],
		},
		{
			id: "black-friday",
			name: "Black Friday Early Access",
			folder: "campaigns / bfcm-early-access",
			totalClicks: "8,940",
			linksCount: 3,
			channels: [
				{ name: "VIP SMS Broadcast", pct: 52, clicks: "4,648", color: "bg-primary" },
				{ name: "Creator Affiliate Links", pct: 33, clicks: "2,950", color: "bg-amber-500" },
				{ name: "Retargeting Ads", pct: 15, clicks: "1,342", color: "bg-emerald-500" },
			],
			links: [
				{ slug: "sho.rt/bf-vip", source: "sms", medium: "mobile", clicks: 4648 },
				{ slug: "sho.rt/bf-creator", source: "affiliate", medium: "influencer", clicks: 2950 },
				{ slug: "sho.rt/bf-ads", source: "meta_ads", medium: "cpc", clicks: 1342 },
			],
		},
	];

	// 3. A/B Testing Split Simulator Interactive State
	const [trafficWeightA, setTrafficWeightA] = React.useState(50);
	const trafficWeightB = 100 - trafficWeightA;
	const [simulatedVisitor, setSimulatedVisitor] = React.useState(null);

	const handleSimulateVisitor = () => {
		const randomVal = Math.floor(Math.random() * 100);
		const assignedVariant = randomVal < trafficWeightA ? "A" : "B";
		setSimulatedVisitor({
			id: "vis_" + Math.random().toString(36).substring(2, 7),
			assignedVariant,
			cookieValue: `ab_pricing-test=${assignedVariant}; Max-Age=2592000`,
			timestamp: new Date().toLocaleTimeString(),
		});
	};

	const handleCopy = (text) => {
		if (!text) return;
		navigator.clipboard.writeText(text);
		setUrlState((prev) => ({ ...prev, copied: true }));
		toast.success("Copied to clipboard!");
		setTimeout(() => setUrlState((prev) => ({ ...prev, copied: false })), 2000);
	};

	const currentCampaign = CAMPAIGN_PRESETS[selectedCampaignIndex];
	const activeShortSlug = `sho.rt/${urlState.customSlug || "demo-link"}`;
	const activeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
		`http://localhost:8080/r/${urlState.customSlug || "demo-link"}`
	)}&margin=1`;

	return (
		<section className="py-20 sm:py-28 border-t border-border/50 bg-background relative">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="max-w-2xl mx-auto text-center space-y-3 mb-12 sm:mb-16">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
						<IconBolt className="size-3.5" />
						<span>Interactive Studio</span>
					</div>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Test the platform in action.
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
						Explore the mechanics of our URL engine, campaign attribution folders, and server-side A/B traffic split router.
					</p>
				</div>

				{/* Workbench Container */}
				<div className="rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden">
					{/* Studio Navigation Bar */}
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border/60 bg-muted/30 p-2 sm:p-3 gap-2">
						<div className="grid grid-cols-3 sm:flex items-center gap-1.5">
							<button
								type="button"
								onClick={() => setActiveTab("url")}
								className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
									activeTab === "url"
										? "bg-background text-foreground shadow-xs border border-border/80"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<IconLink className="size-3.5 text-primary shrink-0" />
								<span>Short Links & QR</span>
							</button>

							<button
								type="button"
								onClick={() => setActiveTab("campaign")}
								className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
									activeTab === "campaign"
										? "bg-background text-foreground shadow-xs border border-border/80"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<IconFolder className="size-3.5 text-amber-500 shrink-0" />
								<span>Campaigns</span>
							</button>

							<button
								type="button"
								onClick={() => setActiveTab("ab-test")}
								className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
									activeTab === "ab-test"
										? "bg-background text-foreground shadow-xs border border-border/80"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<IconFlask className="size-3.5 text-emerald-500 shrink-0" />
								<span>A/B Split Test</span>
							</button>
						</div>

						<span className="text-[11px] font-mono text-muted-foreground text-center sm:text-right px-2">
							{activeTab === "url" && "Instant Branded Links & Dynamic QR"}
							{activeTab === "campaign" && "Multi-Channel Campaign Attribution"}
							{activeTab === "ab-test" && "Server-Side 30-Day Sticky Sessions"}
						</span>
					</div>

					{/* Studio Panel Body */}
					<div className="p-6 sm:p-8">
						{/* TAB 1: SHORT LINKS & QR STUDIO */}
						{activeTab === "url" && (
							<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
								{/* Left: Input Simulation Controls */}
								<div className="lg:col-span-6 space-y-4">
									<div>
										<h3 className="font-heading text-lg font-bold text-foreground">
											URL Shortening & Branded Slugs
										</h3>
										<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
											Try changing the slug or destination below to see how HiClickMe resolves shortlinks with sub-10ms response times.
										</p>
									</div>

									<div className="space-y-3 pt-2">
										<div className="space-y-1">
											<label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
												Destination URL
											</label>
											<Input
												value={urlState.inputUrl}
												onChange={(e) =>
													setUrlState((prev) => ({ ...prev, inputUrl: e.target.value }))
												}
												className="text-xs font-mono h-10 bg-background"
											/>
										</div>

										<div className="space-y-1">
											<label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
												Branded Custom Alias
											</label>
											<div className="flex items-center rounded-lg border border-border bg-background px-3 h-10 text-xs">
												<span className="text-muted-foreground font-mono select-none">
													sho.rt/
												</span>
												<input
													value={urlState.customSlug}
													onChange={(e) =>
														setUrlState((prev) => ({ ...prev, customSlug: e.target.value }))
													}
													className="bg-transparent text-xs font-mono outline-none text-foreground flex-1 ml-1"
												/>
											</div>
										</div>
									</div>

									{/* Trust & Performance Callout */}
									<div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 text-xs space-y-2">
										<div className="flex items-center justify-between">
											<span className="font-semibold text-foreground flex items-center gap-1.5">
												<IconBolt className="size-3.5 text-amber-500" /> Instant Redirection
											</span>
											<span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
												Sub-10ms Speed
											</span>
										</div>
										<p className="text-[11px] text-muted-foreground leading-relaxed">
											Visitors arrive at your destination in the blink of an eye. Branded links build immediate credibility so people feel confident clicking your link.
										</p>
									</div>
								</div>

								{/* Right: Live Simulated Result Card */}
								<div className="lg:col-span-6 rounded-2xl border border-border/80 bg-muted/10 p-5 space-y-4">
									<div className="flex items-center justify-between pb-3 border-b border-border/50 text-xs">
										<span className="font-semibold text-foreground">Generated Asset Preview</span>
										<span className="font-mono text-[10px] text-primary font-bold">READY</span>
									</div>

									{/* Short URL Box with Copy */}
									<div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-background border border-border/80 shadow-2xs">
										<div className="min-w-0">
											<span className="text-[10px] uppercase font-semibold text-primary block">
												Live Short Link
											</span>
											<span className="font-mono text-sm font-bold text-foreground truncate block">
												{activeShortSlug}
											</span>
										</div>
										<button
											type="button"
											onClick={() => handleCopy(`http://localhost:8080/r/${urlState.customSlug}`)}
											className="inline-flex items-center gap-1 text-xs font-semibold text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer"
										>
											{urlState.copied ? (
												<IconCheck className="size-3.5 text-emerald-500" />
											) : (
												<IconCopy className="size-3.5" />
											)}
											<span>{urlState.copied ? "Copied" : "Copy"}</span>
										</button>
									</div>

									{/* Scannable Dynamic QR Preview */}
									<div className="p-3.5 rounded-xl bg-background border border-border/80 flex items-center gap-4">
										<div className="size-20 bg-white rounded-lg p-1 border border-border shrink-0 flex items-center justify-center">
											<img
												src={activeQrUrl}
												alt="Dynamic QR"
												className="size-full object-contain"
											/>
										</div>
										<div className="text-xs space-y-1 min-w-0">
											<p className="font-bold text-foreground">Print-Ready Dynamic QR</p>
											<p className="text-[11px] text-muted-foreground leading-relaxed">
												Encodes the shortlink cleanly. If you ever update the target URL in your dashboard, physical prints continue working seamlessly.
											</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* TAB 2: CAMPAIGN & MULTI-TOUCH UTM HUB */}
						{activeTab === "campaign" && (
							<div className="space-y-6">
								{/* Campaign Switcher Pills */}
								<div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/40">
									<div>
										<h3 className="font-heading text-lg font-bold text-foreground">
											Campaign Organization & Attribution
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											Select a campaign to see how links are grouped and attributed across marketing channels.
										</p>
									</div>

									<div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/60">
										{CAMPAIGN_PRESETS.map((preset, idx) => (
											<button
												key={preset.id}
												type="button"
												onClick={() => setSelectedCampaignIndex(idx)}
												className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
													selectedCampaignIndex === idx
														? "bg-background text-foreground font-semibold shadow-2xs border border-border/80"
														: "text-muted-foreground hover:text-foreground"
												}`}
											>
												{preset.name}
											</button>
										))}
									</div>
								</div>

								{/* Campaign Details Grid */}
								<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
									{/* Folder & Attribution Summary */}
									<div className="lg:col-span-5 space-y-4">
										<div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-3">
											<div className="flex items-center justify-between text-xs">
												<span className="font-mono text-muted-foreground flex items-center gap-1.5">
													<IconFolder className="size-4 text-amber-500" />
													<span>{currentCampaign.folder}</span>
												</span>
												<span className="text-[10px] font-bold bg-background px-2 py-0.5 rounded border border-border text-foreground">
													{currentCampaign.linksCount} Links
												</span>
											</div>

											<div className="pt-2">
												<span className="text-[11px] text-muted-foreground block">
													Aggregate Campaign Volume
												</span>
												<span className="text-2xl font-extrabold font-mono text-foreground">
													{currentCampaign.totalClicks} Clicks
												</span>
											</div>

											{/* Multi-Channel Distribution Bar */}
											<div className="space-y-1.5 pt-1">
												<div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
													{currentCampaign.channels.map((ch) => (
														<div
															key={ch.name}
															style={{ width: `${ch.pct}%` }}
															className={`h-full ${ch.color}`}
															title={`${ch.name}: ${ch.pct}%`}
														/>
													))}
												</div>
												<div className="space-y-1 pt-1">
													{currentCampaign.channels.map((ch) => (
														<div
															key={ch.name}
															className="flex items-center justify-between text-[11px]"
														>
															<span className="text-muted-foreground flex items-center gap-1.5">
																<span className={`size-2 rounded-full ${ch.color}`} />
																{ch.name}
															</span>
															<span className="font-mono font-semibold text-foreground">
																{ch.pct}% ({ch.clicks})
															</span>
														</div>
													))}
												</div>
											</div>
										</div>
									</div>

									{/* Grouped Links List */}
									<div className="lg:col-span-7 space-y-3">
										<span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
											Tracked Campaign URLs
										</span>

										<div className="space-y-2">
											{currentCampaign.links.map((link) => (
												<div
													key={link.slug}
													className="p-3 rounded-xl border border-border/70 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
												>
													<div className="space-y-1 min-w-0">
														<span className="font-mono font-bold text-primary block truncate">
															{link.slug}
														</span>
														<div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
															<span>
																<strong className="text-foreground">source:</strong> {link.source}
															</span>
															<span>·</span>
															<span>
																<strong className="text-foreground">medium:</strong> {link.medium}
															</span>
														</div>
													</div>

													<div className="text-right shrink-0">
														<span className="font-mono font-bold text-sm text-foreground block">
															{link.clicks.toLocaleString()}
														</span>
														<span className="text-[10px] text-muted-foreground">clicks</span>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* TAB 3: A/B TESTING SPLIT SIMULATOR */}
						{activeTab === "ab-test" && (
							<div className="space-y-6">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
									<div>
										<h3 className="font-heading text-lg font-bold text-foreground">
											Server-Side Traffic Split Simulator
										</h3>
										<p className="text-xs text-muted-foreground mt-0.5">
											Adjust the weight slider to simulate how redirect requests are distributed with 30-day sticky sessions.
										</p>
									</div>
									<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
										<IconGitFork className="size-3.5" />
										<span>Zero Client Flicker</span>
									</div>
								</div>

								{/* Interactive Weight Slider */}
								<div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/70 space-y-4">
									<div className="flex items-center justify-between text-xs font-semibold">
										<span className="text-foreground">
											Variant A (Control): {trafficWeightA}%
										</span>
										<span className="text-emerald-600 dark:text-emerald-400">
											Variant B (Challenger): {trafficWeightB}%
										</span>
									</div>

									{/* Range Input Slider */}
									<div className="space-y-1">
										<input
											type="range"
											min="10"
											max="90"
											step="5"
											value={trafficWeightA}
											onChange={(e) => setTrafficWeightA(Number(e.target.value))}
											className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
										/>
										<div className="flex justify-between text-[10px] text-muted-foreground font-mono">
											<span>10% A / 90% B</span>
											<span>50% A / 50% B (Standard)</span>
											<span>90% A / 10% B</span>
										</div>
									</div>

									{/* Simulated Click Action Button */}
									<div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
										<div className="text-xs text-muted-foreground">
											Click simulate to run a synthetic visitor through the edge routing algorithm:
										</div>
										<Button
											type="button"
											onClick={handleSimulateVisitor}
											className="cursor-pointer gap-1.5 text-xs font-semibold h-9 px-4 shrink-0 shadow-2xs"
										>
											<IconRefresh className="size-3.5" />
											<span>Simulate Visitor Hit</span>
										</Button>
									</div>
								</div>

								{/* Simulated Output Log */}
								{simulatedVisitor ? (
									<div className="p-4 rounded-2xl border border-border/80 bg-muted/10 space-y-2 text-xs">
										<div className="flex items-center justify-between">
											<span className="font-semibold text-foreground flex items-center gap-1.5">
												<span className="size-2 rounded-full bg-emerald-500 animate-ping" />
												<span>Visitor {simulatedVisitor.id} Handled</span>
											</span>
											<span className="font-mono text-[10px] text-muted-foreground">
												{simulatedVisitor.timestamp}
											</span>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
											<div className="p-2.5 rounded-xl bg-background border border-border/60">
												<span className="text-[10px] uppercase font-semibold text-muted-foreground block">
													Assigned Variant
												</span>
												<span className="text-sm font-bold text-foreground">
													Variant {simulatedVisitor.assignedVariant} (
													{simulatedVisitor.assignedVariant === "A"
														? "Control"
														: "Challenger"}
													)
												</span>
											</div>

											<div className="p-2.5 rounded-xl bg-background border border-border/60">
												<span className="text-[10px] uppercase font-semibold text-muted-foreground block">
													Sticky Cookie Injected
												</span>
												<span className="font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold truncate block">
													{simulatedVisitor.cookieValue}
												</span>
											</div>
										</div>

										<p className="text-[11px] text-muted-foreground pt-1">
											Repeat visits from this browser within 30 days will deterministically route to{" "}
											<strong className="text-foreground font-semibold">
												Variant {simulatedVisitor.assignedVariant}
											</strong>
											, ensuring clean conversion measurements.
										</p>
									</div>
								) : (
									<div className="p-4 rounded-2xl border border-dashed border-border/70 text-center text-xs text-muted-foreground">
										Click <strong>Simulate Visitor Hit</strong> above to test the edge router logic.
									</div>
								)}
							</div>
						)}
					</div>

					{/* Workbench Bottom Footer */}
					<div className="border-t border-border/50 bg-muted/20 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
						<div className="flex items-center gap-2 text-muted-foreground">
							<span className="size-2 rounded-full bg-emerald-500" />
							<span>All 3 features ready to use in your workspace</span>
						</div>

						<Link
							to={ROUTES.DASHBOARD}
							className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
						>
							<span>Open Workspace Dashboard</span>
							<IconArrowRight className="size-4" />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}

export default PlatformDeepDive;
