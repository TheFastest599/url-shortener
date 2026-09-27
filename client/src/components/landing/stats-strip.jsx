import { IconBolt, IconBroadcast, IconShieldCheck, IconCpu } from "@tabler/icons-react";

export function StatsStrip() {
	const stats = [
		{
			value: "< 5ms",
			label: "Median Redirect Latency",
			description: "Spring WebFlux non-blocking execution with Redis in-memory cache lookup",
			icon: IconBolt,
		},
		{
			value: "100k+",
			label: "Events / Sec Ingestion",
			description: "Kafka KRaft clickstream pipeline with zero redirection overhead",
			icon: IconBroadcast,
		},
		{
			value: "99.99%",
			label: "Target Availability",
			description: "Decoupled microservices architecture resilient to database outages",
			icon: IconShieldCheck,
		},
		{
			value: "100%",
			label: "Bijective Base62",
			description: "Collision-free deterministic URL ID mapping algorithm",
			icon: IconCpu,
		},
	];

	return (
		<section id="performance" className="py-16 border-t border-border/40">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{stats.map((stat, idx) => {
						const Icon = stat.icon;
						return (
							<div
								key={idx}
								className="rounded-3xl border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card"
							>
								<div className="flex items-center justify-between">
									<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
										<Icon className="size-5" />
									</div>
								</div>
								<p className="font-heading mt-4 text-3xl font-extrabold text-foreground tracking-tight">
									{stat.value}
								</p>
								<p className="mt-1 text-sm font-semibold text-foreground">
									{stat.label}
								</p>
								<p className="mt-2 text-xs text-muted-foreground leading-relaxed">
									{stat.description}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
