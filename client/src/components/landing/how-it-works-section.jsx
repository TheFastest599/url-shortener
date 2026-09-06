import { IconClipboardCheck, IconAdjustments, IconShare } from "@tabler/icons-react";

/**
 * Hallmark · How It Works Section
 * Simple 3-step walkthrough showing immediate value.
 */
export function HowItWorksSection() {
	const steps = [
		{
			step: "01",
			title: "Paste your link",
			description:
				"Drop in any long website URL, product page, or campaign destination. No setup required.",
			icon: IconClipboardCheck,
		},
		{
			step: "02",
			title: "Personalize your slug",
			description:
				"Add a custom keyword or campaign UTM parameters so your link looks clean and memorable.",
			icon: IconAdjustments,
		},
		{
			step: "03",
			title: "Share and watch clicks",
			description:
				"Share on social, email, or print with QR codes. Monitor views, countries, and devices in real time.",
			icon: IconShare,
		},
	];

	return (
		<section className="py-20 border-t border-border/50 bg-background relative">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
					<span className="text-xs font-semibold text-primary uppercase tracking-wider">
						Simple Workflow
					</span>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Three steps to better links
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
						From a long, unwieldy URL to a shareable link with real-time tracking in seconds.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
					{steps.map((item, idx) => {
						const Icon = item.icon;
						return (
							<div
								key={item.step}
								className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-border/70 bg-card/60 shadow-2xs hover:border-primary/30 transition-colors"
							>
								<div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-2xs font-bold text-sm">
									<Icon className="size-6" />
								</div>
								<span className="text-xs font-mono font-semibold text-primary/80 mb-1">
									Step {item.step}
								</span>
								<h3 className="font-heading text-lg font-bold text-foreground mb-2">
									{item.title}
								</h3>
								<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
									{item.description}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export default HowItWorksSection;
