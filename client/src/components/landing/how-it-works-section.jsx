/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import {
	IconLink,
	IconFolder,
	IconFlask,
	IconBolt,
} from "@tabler/icons-react";

/**
 * Hallmark · 3-Step Lifecycle: Shorten, Campaign, Split Test
 * Clear, cohesive user journey connecting all three platform pillars.
 */
export function HowItWorksSection() {
	const steps = [
		{
			step: "01",
			badge: "URL Infrastructure",
			title: "Shorten & Brand",
			description:
				"Paste long URLs, assign memorable custom slugs, and automatically generate dynamic SVG QR codes backed by sub-10ms Redis caching.",
			icon: IconLink,
			color: "text-primary bg-primary/10",
		},
		{
			step: "02",
			badge: "Campaign Intelligence",
			title: "Group into Campaigns",
			description:
				"Organize short links into structured marketing folders. Standardize UTM parameters to monitor real-time cross-channel attribution.",
			icon: IconFolder,
			color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
		},
		{
			step: "03",
			badge: "Conversion Optimization",
			title: "Split Test & Scale",
			description:
				"Route visitors across multivariate variants with in-memory weighted splits and 30-day sticky sessions to scientifically pick winning funnels.",
			icon: IconFlask,
			color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
		},
	];

	return (
		<section className="py-20 sm:py-28 border-t border-border/50 bg-muted/10 relative">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
						<IconBolt className="size-3.5" />
						<span>Unified Workflow</span>
					</div>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Three steps to link mastery
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
						From a single branded short URL to cross-channel campaigns and server-side conversion split testing.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
					{steps.map((item) => {
						const Icon = item.icon;
						return (
							<div
								key={item.step}
								className="relative flex flex-col items-center text-center p-7 rounded-2xl border border-border/80 bg-card shadow-xs hover:border-primary/30 transition-all justify-between"
							>
								<div className="w-full flex flex-col items-center">
									<div className={`flex size-14 items-center justify-center rounded-2xl ${item.color} mb-5 shadow-2xs font-bold text-sm`}>
										<Icon className="size-7" />
									</div>

									<div className="flex items-center gap-2 mb-1.5">
										<span className="text-xs font-mono font-bold text-muted-foreground">
											Step {item.step}
										</span>
										<span className="text-border">·</span>
										<span className="text-[11px] font-semibold text-primary">
											{item.badge}
										</span>
									</div>

									<h3 className="font-heading text-lg font-bold text-foreground mb-2">
										{item.title}
									</h3>
									<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
										{item.description}
									</p>
								</div>

								{/* Bottom Status Dot */}
								<div className="mt-6 pt-4 border-t border-border/40 w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
									<span className="size-1.5 rounded-full bg-emerald-500" />
									<span>Production ready</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export default HowItWorksSection;
