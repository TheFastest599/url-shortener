import {
	IconLink,
	IconChartBar,
	IconQrcode,
	IconBolt,
	IconShieldCheck,
	IconTag,
	IconArrowUpRight,
} from "@tabler/icons-react";

/**
 * Hallmark · Modern-Minimal Features Section
 * Clear, benefit-driven product presentation without tech jargon.
 */
export function FeaturesSection() {
	return (
		<section className="py-20 sm:py-28 border-t border-border/50 bg-muted/20 relative">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="max-w-2xl mx-auto text-center space-y-3 mb-14 sm:mb-18">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
						<IconBolt className="size-3.5" />
						<span>Built for Creators & Teams</span>
					</div>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Everything you need to share with confidence.
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
						Turn long, messy links into clean assets that look professional, build trust, and deliver clear insights.
					</p>
				</div>

				{/* Visual Feature Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
					{/* Card 1: Branded & Custom Links */}
					<div className="group relative rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:scale-105 transition-transform">
								<IconLink className="size-5" />
							</div>
							<h3 className="font-heading text-lg font-bold text-foreground">
								Branded & Custom Slugs
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								Replace cryptic strings of numbers with memorable words that users trust to click.
							</p>
						</div>

						{/* Visual Preview Pill */}
						<div className="mt-6 pt-5 border-t border-border/50 space-y-2 text-xs">
							<div className="flex items-center justify-between text-muted-foreground">
								<span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
									Before
								</span>
								<span className="truncate max-w-[170px] font-mono text-[10px] text-muted-foreground/60 line-through">
									example.com/p/892?ref=x92...
								</span>
							</div>
							<div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-2.5 py-1.5 text-primary font-mono text-xs font-semibold">
								<span>sho.rt/launch</span>
								<IconArrowUpRight className="size-3.5 shrink-0 text-primary/70" />
							</div>
						</div>
					</div>

					{/* Card 2: Actionable Click Analytics */}
					<div className="group relative rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
								<IconChartBar className="size-5" />
							</div>
							<h3 className="font-heading text-lg font-bold text-foreground">
								Real-Time Click Insights
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								See exactly how your links perform. Track visitors by country, referring channel, and device type.
							</p>
						</div>

						{/* Visual Preview Metric Pill */}
						<div className="mt-6 pt-5 border-t border-border/50 space-y-1.5 text-xs">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground font-medium text-[11px]">Top Sources</span>
								<span className="text-foreground font-semibold text-xs">Direct · Twitter · Google</span>
							</div>
							<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
								<div className="bg-primary w-[55%] h-full" />
								<div className="bg-emerald-500 w-[30%] h-full" />
								<div className="bg-amber-500 w-[15%] h-full" />
							</div>
							<div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
								<span>55% Social</span>
								<span>30% Direct</span>
								<span>15% Search</span>
							</div>
						</div>
					</div>

					{/* Card 3: Dynamic QR Codes */}
					<div className="group relative rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
						<div>
							<div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-5 group-hover:scale-105 transition-transform">
								<IconQrcode className="size-5" />
							</div>
							<h3 className="font-heading text-lg font-bold text-foreground">
								Print-Ready QR Codes
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
								Every short link automatically includes a scannable QR code for posters, slides, packaging, or menus.
							</p>
						</div>

						{/* Visual Preview Badge */}
						<div className="mt-6 pt-5 border-t border-border/50 flex items-center justify-between">
							<div className="space-y-0.5">
								<span className="text-xs font-semibold text-foreground block">
									Automatic Generation
								</span>
								<span className="text-[11px] text-muted-foreground">
									Ready to download & scan
								</span>
							</div>
							<div className="size-8 rounded-md bg-muted/60 border border-border flex items-center justify-center text-foreground/80">
								<IconQrcode className="size-4.5" />
							</div>
						</div>
					</div>
				</div>

				{/* 3 Secondary Mini-Badges */}
				<div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
					<div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-card/60 border border-border/60 text-xs text-muted-foreground">
						<IconShieldCheck className="size-4 text-emerald-500" />
						<span>Safe & reliable redirection</span>
					</div>
					<div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-card/60 border border-border/60 text-xs text-muted-foreground">
						<IconTag className="size-4 text-primary" />
						<span>Built-in UTM campaign tagging</span>
					</div>
					<div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-card/60 border border-border/60 text-xs text-muted-foreground">
						<IconBolt className="size-4 text-amber-500" />
						<span>Zero delay, instant redirection</span>
					</div>
				</div>
			</div>
		</section>
	);
}

export default FeaturesSection;
