import {
	IconBolt,
	IconBroadcast,
	IconWorld,
	IconShieldCheck,
	IconChartDots,
	IconCpu,
	IconFlame,
	IconDeviceAnalytics,
	IconClockHour4,
	IconRefresh,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

export function FeaturesBento() {
	return (
		<section id="features" className="py-20 border-t border-border/40 bg-muted/20">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="mx-auto max-w-2xl text-center">
					<Badge variant="outline" className="mb-3 px-3 py-1 font-mono text-xs border-primary/30 text-primary">
						Core Architecture & Features
					</Badge>
					<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Engineered for Extreme Throughput and Granular Insights
					</h2>
					<p className="mt-4 text-muted-foreground text-base leading-relaxed">
						Every component in urlShortener is decoupled, containerized, and built around reactive streams for ultra-low latency and zero bottlenecks.
					</p>
				</div>

				{/* Bento Grid Layout */}
				<div className="mt-14 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
					{/* Card 1: Sub-5ms Redirection (Spans 2 cols) */}
					<div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/40 md:col-span-2">
						<div className="flex items-center justify-between">
							<div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<IconBolt className="size-6" />
							</div>
							<span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
								&lt; 5ms Redirection
							</span>
						</div>

						<h3 className="font-heading mt-6 text-xl font-bold text-foreground">
							Reactive Non-Blocking Engine
						</h3>
						<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
							Powered by Spring WebFlux and Redis 7.2. Hot URLs are served directly from RAM without hitting relational databases, maintaining sub-millisecond roundtrips even under traffic spikes.
						</p>

						<div className="mt-6 rounded-2xl bg-background border border-border/60 p-4 font-mono text-xs text-muted-foreground space-y-1.5">
							<div className="flex justify-between text-foreground">
								<span>HTTP 302 Redirection Latency</span>
								<span className="text-primary font-bold">3.4 ms</span>
							</div>
							<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
								<div className="h-full bg-primary rounded-full w-[96%]" />
							</div>
							<div className="flex justify-between text-[11px] pt-1">
								<span>Redis Cache Hit Rate: 99.4%</span>
								<span>Adaptive TTL: Active</span>
							</div>
						</div>
					</div>

					{/* Card 2: Kafka Event Streaming (Spans 2 cols) */}
					<div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/40 md:col-span-1 lg:col-span-2">
						<div className="flex items-center justify-between">
							<div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
								<IconBroadcast className="size-6" />
							</div>
							<span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
								Kafka KRaft Topic
							</span>
						</div>

						<h3 className="font-heading mt-6 text-xl font-bold text-foreground">
							Zero-Lag Asynchronous Click Ingestion
						</h3>
						<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
							Click events are emitted directly to an Apache Kafka topic (<code className="text-foreground">url-clicks</code>). Analytics processing never blocks the user redirection flow.
						</p>

						<div className="mt-6 flex items-center justify-between rounded-2xl bg-background border border-border/60 p-4 text-xs font-mono">
							<div className="flex items-center gap-2">
								<div className="size-2 rounded-full bg-emerald-500 animate-ping" />
								<span className="text-foreground">Producer: Reactive WebClient</span>
							</div>
							<span className="text-indigo-400">Partitioned Stream</span>
						</div>
					</div>

					{/* Card 3: Deep GeoIP Analytics */}
					<div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 md:col-span-1 lg:col-span-1">
						<div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
							<IconWorld className="size-5" />
						</div>
						<h3 className="font-heading mt-5 text-lg font-bold text-foreground">
							MaxMind GeoIP2
						</h3>
						<p className="mt-2 text-xs text-muted-foreground leading-relaxed">
							Automatic city, country, region, and ISP resolution for every visitor with bot & crawler filtering.
						</p>
					</div>

					{/* Card 4: Gateway Security & Rate Limiting */}
					<div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 md:col-span-1 lg:col-span-1">
						<div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
							<IconShieldCheck className="size-5" />
						</div>
						<h3 className="font-heading mt-5 text-lg font-bold text-foreground">
							Gateway Security
						</h3>
						<p className="mt-2 text-xs text-muted-foreground leading-relaxed">
							Spring Cloud Gateway with token bucket rate limiting, BCrypt authentication, and JWT authorization.
						</p>
					</div>

					{/* Card 5: gRPC High-Speed Sync */}
					<div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 md:col-span-1 lg:col-span-1">
						<div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
							<IconCpu className="size-5" />
						</div>
						<h3 className="font-heading mt-5 text-lg font-bold text-foreground">
							gRPC Inter-Service
						</h3>
						<p className="mt-2 text-xs text-muted-foreground leading-relaxed">
							Internal protobuf communication on port 9090 between Core, Gateway, and Analytics for zero-overhead validation.
						</p>
					</div>

					{/* Card 6: UTM Attribution */}
					<div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 md:col-span-1 lg:col-span-1">
						<div className="flex size-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
							<IconChartDots className="size-5" />
						</div>
						<h3 className="font-heading mt-5 text-lg font-bold text-foreground">
							UTM Attribution
						</h3>
						<p className="mt-2 text-xs text-muted-foreground leading-relaxed">
							Automated campaign tagging, UTM parameter preservation, and cross-channel conversion reporting.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
