/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import * as React from "react";
import {
	IconChartBar,
	IconDeviceMobile,
	IconWorld,
	IconShieldCheck,
	IconFilter,
	IconClock,
	IconEye,
	IconDeviceDesktop,
	IconCompass,
} from "@tabler/icons-react";

/**
 * Hallmark · Human-Centric Audience Insights Section
 * Visualizing real human engagement across channels, devices, and geographies.
 */
export function AudienceInsightsSection() {
	return (
		<section className="py-20 sm:py-28 border-t border-border/50 bg-muted/20 relative">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="max-w-3xl mx-auto text-center space-y-3 mb-14 sm:mb-18">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
						<IconEye className="size-3.5" />
						<span>Audience Telemetry</span>
					</div>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Know your audience without invading their privacy.
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
						Every shortlink, campaign folder, and A/B variant captures actionable engagement patterns so you know what channels resonate most.
					</p>
				</div>

				{/* 3 Visual Insight Pillars */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
					{/* Card 1: Channel & Referrer Attribution */}
					<div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
								<IconChartBar className="size-5" />
							</div>
							<h3 className="font-heading text-lg font-bold text-foreground">
								Channel & Referrer Attribution
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								See where your traffic actually originates. Filter clicks by specific newsletters, social networks, search engines, or direct messaging apps.
							</p>
						</div>

						{/* Mock Channel Distribution Pill Strip */}
						<div className="space-y-2 p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
							<div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
								<span>Top Referrers</span>
								<span className="font-mono text-foreground font-semibold">3,820 clicks</span>
							</div>

							<div className="space-y-1.5 pt-1">
								<div className="space-y-1">
									<div className="flex justify-between text-[11px]">
										<span className="text-foreground font-medium">Email / Substack</span>
										<span className="font-mono text-muted-foreground">48%</span>
									</div>
									<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
										<div className="bg-primary h-full w-[48%]" />
									</div>
								</div>

								<div className="space-y-1">
									<div className="flex justify-between text-[11px]">
										<span className="text-foreground font-medium">Twitter / X</span>
										<span className="font-mono text-muted-foreground">32%</span>
									</div>
									<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
										<div className="bg-amber-500 h-full w-[32%]" />
									</div>
								</div>

								<div className="space-y-1">
									<div className="flex justify-between text-[11px]">
										<span className="text-foreground font-medium">Direct / WhatsApp</span>
										<span className="font-mono text-muted-foreground">20%</span>
									</div>
									<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
										<div className="bg-emerald-500 h-full w-[20%]" />
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Card 2: Device & Platform Distribution */}
					<div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
								<IconDeviceMobile className="size-5" />
							</div>
							<h3 className="font-heading text-lg font-bold text-foreground">
								Device & Platform Telemetry
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								Understand if your buyers browse on phones, tablets, or work laptops so you can optimize landing page design and checkout flows accordingly.
							</p>
						</div>

						{/* Mock Device Stats */}
						<div className="space-y-3 p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
							<div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
								<span>Device Breakdown</span>
								<span className="font-mono text-foreground font-semibold">100% Detected</span>
							</div>

							<div className="grid grid-cols-2 gap-2 pt-1">
								<div className="p-2.5 rounded-lg bg-background border border-border/60 text-center space-y-1">
									<IconDeviceMobile className="size-4 text-primary mx-auto" />
									<span className="text-xs font-bold text-foreground block font-mono">72%</span>
									<span className="text-[10px] text-muted-foreground block">Mobile / iOS</span>
								</div>

								<div className="p-2.5 rounded-lg bg-background border border-border/60 text-center space-y-1">
									<IconDeviceDesktop className="size-4 text-amber-500 mx-auto" />
									<span className="text-xs font-bold text-foreground block font-mono">28%</span>
									<span className="text-[10px] text-muted-foreground block">Desktop / Mac</span>
								</div>
							</div>

							<p className="text-[10px] text-muted-foreground text-center">
								Detects OS, browser engine, and screen categories automatically.
							</p>
						</div>
					</div>

					{/* Card 3: Bot Filtering & Geo Telemetry */}
					<div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
								<IconShieldCheck className="size-5" />
							</div>
							<h3 className="font-heading text-lg font-bold text-foreground">
								Clean Metrics & Bot Filtering
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								Automated web crawlers, spam bots, and preview scrapers artificially inflate click metrics. HiClickMe isolates bots so your marketing data reflects genuine humans.
							</p>
						</div>

						{/* Mock Geographic & Clean Data Strip */}
						<div className="space-y-2.5 p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
							<div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
								<span>Data Integrity</span>
								<span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
									Active Bot Filter
								</span>
							</div>

							<div className="space-y-1.5 pt-1">
								<div className="flex items-center justify-between text-[11px]">
									<span className="text-muted-foreground flex items-center gap-1">
										<IconWorld className="size-3 text-primary" /> Top Country
									</span>
									<span className="font-semibold text-foreground">United States (54%)</span>
								</div>

								<div className="flex items-center justify-between text-[11px]">
									<span className="text-muted-foreground flex items-center gap-1">
										<IconCompass className="size-3 text-amber-500" /> Second Location
									</span>
									<span className="font-semibold text-foreground">United Kingdom (18%)</span>
								</div>

								<div className="flex items-center justify-between text-[11px]">
									<span className="text-muted-foreground flex items-center gap-1">
										<IconFilter className="size-3 text-emerald-500" /> Scrapers Filtered
									</span>
									<span className="font-mono text-muted-foreground">342 bot hits excluded</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default AudienceInsightsSection;
