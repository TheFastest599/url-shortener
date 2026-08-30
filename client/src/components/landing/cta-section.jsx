import { Button } from "@/components/ui/button";
import { IconArrowRight, IconCode, IconSparkles, IconCheck } from "@tabler/icons-react";

export function CtaSection() {
	return (
		<section className="py-20 border-t border-border/40 bg-gradient-to-b from-transparent to-muted/30">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="relative overflow-hidden rounded-4xl border border-primary/30 bg-primary/5 p-8 sm:p-12 lg:p-16 text-center shadow-xl backdrop-blur-md">
					{/* Ambient glow */}
					<div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />
					<div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-emerald-500/10 blur-3xl" />

					<div className="mx-auto max-w-3xl">
						<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3.5 py-1 text-xs font-medium text-primary shadow-xs">
							<IconSparkles className="size-3.5" />
							<span>Enterprise-Ready URL Shortener Platform</span>
						</div>

						<h2 className="font-heading mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
							Deploy High-Velocity Short Links Today.
						</h2>
						<p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
							Whether you need branded campaign links with UTM tracking or high-throughput redirection for millions of requests, urlShortener delivers instant performance.
						</p>

						{/* Action Buttons */}
						<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
							<Button
								size="lg"
								className="gap-2 cursor-pointer shadow-md text-base"
								onClick={() => {
									window.location.href = "#signup";
								}}
							>
								<span>Create Free Account</span>
								<IconArrowRight className="size-4" />
							</Button>

							<Button
								variant="outline"
								size="lg"
								className="gap-2 cursor-pointer text-base bg-background"
								onClick={() => {
									window.location.href = "#api-docs";
								}}
							>
								<IconCode className="size-4 text-primary" />
								<span>Explore REST & gRPC API</span>
							</Button>
						</div>

						{/* Feature Pills */}
						<div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
							<div className="flex items-center gap-1.5">
								<IconCheck className="size-4 text-primary" />
								<span>Sub-5ms Median Redirect</span>
							</div>
							<div className="flex items-center gap-1.5">
								<IconCheck className="size-4 text-primary" />
								<span>Real-Time GeoIP2 Analytics</span>
							</div>
							<div className="flex items-center gap-1.5">
								<IconCheck className="size-4 text-primary" />
								<span>Open Source Microservices</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
