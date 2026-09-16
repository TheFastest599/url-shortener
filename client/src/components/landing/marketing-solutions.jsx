/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import * as React from "react";
import {
	IconRocket,
	IconQrcode,
	IconFlask,
	IconCheck,
	IconArrowRight,
	IconTag,
	IconFolder,
	IconDeviceMobile,
	IconShare,
	IconChartBar,
	IconUsers,
	IconLayersLinked,
} from "@tabler/icons-react";

/**
 * Hallmark · Human-Centric Marketing Solutions
 * Real-world workflows for marketers, creators, and growth teams.
 */
export function MarketingSolutions() {
	const [activePlaybook, setActivePlaybook] = React.useState("campaign");

	const playbooks = {
		url: {
			badge: "Branded Links & Dynamic QR",
			title: "Turn long, forgotten URLs into high-trust branded assets.",
			subtitle:
				"First impressions matter. Cryptic strings of numbers look like spam. Branded short links build immediate credibility, increase click-through rates, and bridge digital with physical via dynamic QR.",
			painPoint: "Messy, unbranded links that users hesitate to click, plus wasted printing budgets when physical QR codes break.",
			solution: "Memorable branded slugs, custom aliases, and scannable QR codes whose destinations you can change anytime.",
			useCases: [
				{
					title: "Social Bios & Creator Profiles",
					desc: "One clean memorable link for your Instagram, TikTok, and YouTube descriptions that never looks clunky.",
				},
				{
					title: "Packaging, Menus & Event Badges",
					desc: "Print QR codes on packaging or brochures with total confidence—update where they point in seconds without reprinting.",
				},
				{
					title: "Podcast Ads & Keynote Slides",
					desc: "Short, verbal-friendly links like sho.rt/summit that attendees can type directly into their phones.",
				},
			],
			preview: {
				tag: "Live Link Preview",
				headline: "Packaging & Event QR",
				slug: "sho.rt/summit-pass",
				destination: "https://summit.brand.com/2026/vip-lounge",
				statLabel: "Audience Engagement",
				statValue: "1,420 Scans",
				statSub: "72% mobile camera scans · 0 broken links",
			},
		},
		campaign: {
			badge: "Multi-Touch Campaign Intelligence",
			title: "Stop losing your marketing links in messy spreadsheets.",
			subtitle:
				"When launching a multi-channel promotion across newsletter, social, affiliates, and search ads, you need every link organized in one place with crystal-clear attribution.",
			painPoint: "50 disconnected links scattered across spreadsheets, messy UTM naming mistakes, and zero clarity on which channel is actually driving results.",
			solution: "Group links under unified campaign folders with automated UTM builders and aggregated channel leaderboards.",
			useCases: [
				{
					title: "Product Launches & Seasonal Sales",
					desc: "Create a single campaign folder for your launch and see email vs social vs ads performance side-by-side.",
				},
				{
					title: "Affiliate & Influencer Partnerships",
					desc: "Give each partner a dedicated shortlink and measure exactly how many clicks and conversions each creator brings.",
				},
				{
					title: "Email & Newsletter Drops",
					desc: "Auto-tag links with utm_medium=email and utm_source=newsletter to keep your analytics clean and error-free.",
				},
			],
			preview: {
				tag: "Campaign Folder View",
				headline: "Q4 Product Launch Campaign",
				slug: "4 Tracked Channel Links",
				destination: "campaigns / q4-growth-launch",
				statLabel: "Top Performing Channel",
				statValue: "Email Newsletter (48%)",
				statSub: "1,834 Clicks · Twitter 32% · Search Ads 20%",
			},
		},
		"ab-test": {
			badge: "Server-Side A/B Conversion Testing",
			title: "Test headlines, pricing, and offers with scientific confidence.",
			subtitle:
				"Don't guess what converts your audience. Split traffic between two or more landing pages directly from your shortlink, with zero page flicker and 30-day visitor consistency.",
			painPoint: "Expensive third-party testing tools that slow down page loads, cause jarring visual flicker, or show visitors different prices on different days.",
			solution: "Server-side traffic distribution with weighted percentage controls and sticky session cookies.",
			useCases: [
				{
					title: "Pricing Page & Tier Optimization",
					desc: "Test whether an upfront annual discount outperforms a monthly default without confusing returning visitors.",
				},
				{
					title: "Landing Page Hero Copy & CTAs",
					desc: "Send half your traffic to a direct benefit headline and half to a social-proof headline to see which drives signups.",
				},
				{
					title: "Promotional Discounts vs Free Trials",
					desc: "Directly measure whether '14-day free trial' or '20% off annual' yields higher customer lifetime value.",
				},
			],
			preview: {
				tag: "Active Split Experiment",
				headline: "Pricing Tier A/B Test",
				slug: "sho.rt/pricing-test (50/50 Split)",
				destination: "Variant A vs Variant B",
				statLabel: "Leading Challenger",
				statValue: "Variant B (+46.7% Lift)",
				statSub: "18.2% conversion rate · 30-day sticky session",
			},
		},
	};

	const current = playbooks[activePlaybook];

	return (
		<section className="py-20 sm:py-28 border-t border-border/50 bg-background relative">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="max-w-3xl mx-auto text-center space-y-3 mb-14 sm:mb-18">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
						<IconUsers className="size-3.5" />
						<span>Marketing & Growth Playbooks</span>
					</div>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Built for how marketing teams actually work.
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
						No complicated code. No spreadsheet headaches. Just the essential tools you need to promote, attribute, and convert.
					</p>
				</div>

				{/* 3 Playbook Switcher Tabs */}
				<div className="flex justify-center mb-12">
					<div className="inline-flex p-1.5 rounded-2xl bg-muted/40 border border-border/80 shadow-2xs max-w-full overflow-x-auto gap-1">
						<button
							type="button"
							onClick={() => setActivePlaybook("campaign")}
							className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 ${
								activePlaybook === "campaign"
									? "bg-background text-foreground shadow-xs border border-border/80"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<IconFolder className="size-4 text-amber-500" />
							<span>Campaign Marketers</span>
						</button>

						<button
							type="button"
							onClick={() => setActivePlaybook("ab-test")}
							className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 ${
								activePlaybook === "ab-test"
									? "bg-background text-foreground shadow-xs border border-border/80"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<IconFlask className="size-4 text-emerald-500" />
							<span>Growth & Conversion Teams</span>
						</button>

						<button
							type="button"
							onClick={() => setActivePlaybook("url")}
							className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all shrink-0 ${
								activePlaybook === "url"
									? "bg-background text-foreground shadow-xs border border-border/80"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<IconRocket className="size-4 text-primary" />
							<span>Brand Builders & Creators</span>
						</button>
					</div>
				</div>

				{/* Selected Playbook Showcase Card */}
				<div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-lg">
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
						{/* Left: Value Story & Use Cases */}
						<div className="lg:col-span-7 space-y-6">
							<div>
								<span className="text-xs font-semibold uppercase tracking-wider text-primary">
									{current.badge}
								</span>
								<h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-2 leading-tight">
									{current.title}
								</h3>
								<p className="text-sm text-muted-foreground mt-3 leading-relaxed">
									{current.subtitle}
								</p>
							</div>

							{/* Before vs After Callout */}
							<div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-2 text-xs">
								<div className="flex items-start gap-2">
									<span className="text-destructive font-bold uppercase tracking-wider text-[10px] shrink-0 mt-0.5">
										The Old Way:
									</span>
									<span className="text-muted-foreground leading-relaxed">
										{current.painPoint}
									</span>
								</div>
								<div className="flex items-start gap-2 pt-1 border-t border-border/40">
									<span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mt-0.5">
										With HiClickMe:
									</span>
									<span className="text-foreground font-medium leading-relaxed">
										{current.solution}
									</span>
								</div>
							</div>

							{/* 3 Concrete Real-World Use Cases */}
							<div className="space-y-3 pt-1">
								<span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
									Real-World Scenarios
								</span>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									{current.useCases.map((uc, i) => (
										<div
											key={i}
											className="p-3.5 rounded-xl border border-border/70 bg-background/60 space-y-1.5"
										>
											<h4 className="text-xs font-bold text-foreground leading-snug">
												{uc.title}
											</h4>
											<p className="text-[11px] text-muted-foreground leading-relaxed">
												{uc.desc}
											</p>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Right: Tactile Marketing Asset Mockup */}
						<div className="lg:col-span-5 rounded-2xl border border-border/80 bg-muted/20 p-6 space-y-4 shadow-xs">
							<div className="flex items-center justify-between pb-3 border-b border-border/60 text-xs">
								<span className="font-semibold text-foreground flex items-center gap-1.5">
									<span className="size-2 rounded-full bg-emerald-500" />
									{current.preview.tag}
								</span>
								<span className="text-[10px] font-mono text-muted-foreground">READY TO SHARE</span>
							</div>

							<div className="p-4 rounded-xl bg-background border border-border/80 space-y-2">
								<span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">
									{current.preview.headline}
								</span>
								<div className="font-mono text-xs sm:text-sm font-bold text-foreground">
									{current.preview.slug}
								</div>
								<div className="text-xs text-muted-foreground font-mono truncate">
									{current.preview.destination}
								</div>
							</div>

							<div className="p-4 rounded-xl bg-background border border-border/80 space-y-1">
								<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
									{current.preview.statLabel}
								</span>
								<span className="text-xl font-extrabold font-mono text-foreground block">
									{current.preview.statValue}
								</span>
								<span className="text-xs text-muted-foreground">
									{current.preview.statSub}
								</span>
							</div>

							<div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
								<span className="flex items-center gap-1">
									<IconCheck className="size-3.5 text-emerald-500" /> Zero tracking cookies
								</span>
								<span className="flex items-center gap-1">
									<IconCheck className="size-3.5 text-emerald-500" /> Clean redirection
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default MarketingSolutions;
