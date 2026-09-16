/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import {
	IconLink,
	IconChartBar,
	IconQrcode,
	IconBolt,
	IconShieldCheck,
	IconTag,
	IconArrowUpRight,
	IconFolder,
	IconFlask,
	IconCookie,
	IconGitFork,
	IconLayersLinked,
	IconGauge,
	IconUsers,
} from "@tabler/icons-react";

/**
 * Hallmark · 3 Core Platform Pillars: URL Engine, Campaigns, and A/B Testing.
 * Human-centric, benefit-driven product presentation for growth teams.
 */
export function FeaturesSection() {
	return (
		<section className="py-20 sm:py-28 border-t border-border/50 bg-muted/20 relative">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="max-w-3xl mx-auto text-center space-y-3 mb-14 sm:mb-18">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
						<IconBolt className="size-3.5" />
						<span>The Three Platform Pillars</span>
					</div>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Engineered for speed, campaigns, and conversion.
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
						HiClickMe unites high-speed shortlinks, structured marketing campaign folders, and server-side A/B split testing into one unified workspace.
					</p>
				</div>

				{/* 3 Pillar Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
					{/* Pillar 1: High-Velocity URL Engine & Dynamic QR */}
					<div className="group relative rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:scale-105 transition-transform">
								<IconLink className="size-5" />
							</div>
							<span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-primary">
								Pillar 01 · Branded Links & QR
							</span>
							<h3 className="font-heading text-lg font-bold text-foreground mt-1">
								High-Velocity Short Links & QR
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								Clean, memorable links that users trust to click, paired with dynamic vector QR codes that you can update anytime without reprinting.
							</p>
						</div>

						{/* Visual Preview Pill */}
						<div className="mt-6 pt-5 border-t border-border/50 space-y-2.5 text-xs">
							<div className="flex items-center justify-between text-muted-foreground">
								<span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
									Destination
								</span>
								<span className="truncate max-w-[170px] font-mono text-[10px] text-muted-foreground/70">
									brand.com/store/summer-2026
								</span>
							</div>

							<div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-2.5 py-1.5 text-primary font-mono text-xs font-semibold">
								<span className="flex items-center gap-1">
									<IconLink className="size-3" /> sho.rt/summer-drop
								</span>
								<span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
									&lt; 5ms
								</span>
							</div>

							<div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
								<span className="flex items-center gap-1">
									<IconQrcode className="size-3.5 text-primary" /> Dynamic SVG QR
								</span>
								<span className="font-mono text-[10px] text-foreground font-medium">
									Instant Redirection
								</span>
							</div>
						</div>
					</div>

					{/* Pillar 2: Marketing Campaigns & Multi-Touch UTM Tracking */}
					<div className="group relative rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs hover:border-amber-500/40 hover:shadow-md transition-all flex flex-col justify-between">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-5 group-hover:scale-105 transition-transform">
								<IconFolder className="size-5" />
							</div>
							<span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
								Pillar 02 · Campaign Folders
							</span>
							<h3 className="font-heading text-lg font-bold text-foreground mt-1">
								Campaigns & Multi-Touch UTM
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								No more chaotic spreadsheets. Group your launch links into folders, auto-tag UTM parameters, and see exactly which channel drives revenue.
							</p>
						</div>

						{/* Visual Preview Pill */}
						<div className="mt-6 pt-5 border-t border-border/50 space-y-2 text-xs">
							<div className="flex items-center justify-between">
								<span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
									<IconFolder className="size-3 text-amber-500" /> campaigns/q4-launch
								</span>
								<span className="text-[10px] font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border">
									6 URLs
								</span>
							</div>

							{/* Multi-Channel Distribution Bar */}
							<div className="space-y-1">
								<div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
									<div className="bg-primary w-[48%] h-full" title="Newsletter 48%" />
									<div className="bg-amber-500 w-[32%] h-full" title="Twitter 32%" />
									<div className="bg-emerald-500 w-[20%] h-full" title="Ads 20%" />
								</div>
								<div className="flex justify-between text-[10px] text-muted-foreground">
									<span>Newsletter 48%</span>
									<span>Social 32%</span>
									<span>Ads 20%</span>
								</div>
							</div>

							<div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground pt-0.5 truncate">
								<span className="text-primary font-medium">utm_campaign</span>=q4_launch
								<span className="text-border">·</span>
								<span className="text-primary font-medium">utm_source</span>=multi
							</div>
						</div>
					</div>

					{/* Pillar 3: Multivariate A/B Testing & Sticky Sessions */}
					<div className="group relative rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
								<IconFlask className="size-5" />
							</div>
							<span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
								Pillar 03 · Split Testing
							</span>
							<h3 className="font-heading text-lg font-bold text-foreground mt-1">
								Server-Side A/B Split Testing
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								Test headlines, offers, and pricing pages with scientific confidence. Returning visitors always see their assigned variant, preventing customer confusion.
							</p>
						</div>

						{/* Visual Preview Pill */}
						<div className="mt-6 pt-5 border-t border-border/50 space-y-2 text-xs">
							{/* Variant Split Progress */}
							<div className="flex items-center justify-between text-[11px]">
								<span className="font-semibold text-foreground flex items-center gap-1">
									<IconGitFork className="size-3 text-emerald-500" /> 50 / 50 Traffic Split
								</span>
								<span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
									+46.7% Lift
								</span>
							</div>

							<div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
								<div className="bg-muted-foreground/40 w-[50%] h-full" title="Variant A: 50%" />
								<div className="bg-emerald-500 w-[50%] h-full" title="Variant B: 50%" />
							</div>

							<div className="flex justify-between text-[10px] font-mono">
								<span className="text-muted-foreground">Var A: 12.4% conv</span>
								<span className="text-emerald-600 dark:text-emerald-400 font-bold">Var B: 18.2% conv ★</span>
							</div>

							<div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
								<span className="flex items-center gap-1 font-mono">
									<IconCookie className="size-3 text-amber-500" /> ab_pricing=B
								</span>
								<span>30-Day Sticky Session</span>
							</div>
						</div>
					</div>
				</div>

				{/* 6 Practical Human-Centric Benefits */}
				<div className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
					<div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card/70 border border-border/70 text-xs">
						<IconGauge className="size-4 text-primary mb-1" />
						<span className="font-semibold text-foreground">Sub-10ms Redirects</span>
						<span className="text-[10px] text-muted-foreground">Zero Waiting Lag</span>
					</div>

					<div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card/70 border border-border/70 text-xs">
						<IconFolder className="size-4 text-amber-500 mb-1" />
						<span className="font-semibold text-foreground">Campaign Folders</span>
						<span className="text-[10px] text-muted-foreground">Organized Initiatives</span>
					</div>

					<div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card/70 border border-border/70 text-xs">
						<IconFlask className="size-4 text-emerald-500 mb-1" />
						<span className="font-semibold text-foreground">A/B Testing</span>
						<span className="text-[10px] text-muted-foreground">Zero Page Flicker</span>
					</div>

					<div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card/70 border border-border/70 text-xs">
						<IconCookie className="size-4 text-amber-500 mb-1" />
						<span className="font-semibold text-foreground">Sticky Sessions</span>
						<span className="text-[10px] text-muted-foreground">30-Day Consistency</span>
					</div>

					<div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card/70 border border-border/70 text-xs">
						<IconQrcode className="size-4 text-primary mb-1" />
						<span className="font-semibold text-foreground">Dynamic QR</span>
						<span className="text-[10px] text-muted-foreground">Never Reprints Needed</span>
					</div>

					<div className="flex flex-col items-center justify-center p-3 rounded-xl bg-card/70 border border-border/70 text-xs">
						<IconShieldCheck className="size-4 text-emerald-500 mb-1" />
						<span className="font-semibold text-foreground">Bot Filtering</span>
						<span className="text-[10px] text-muted-foreground">Real Human Clicks</span>
					</div>
				</div>
			</div>
		</section>
	);
}

export default FeaturesSection;
