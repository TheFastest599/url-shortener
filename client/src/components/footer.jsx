import { IconLink, IconBrandGithub, IconCircleCheck } from "@tabler/icons-react";

export function Footer() {
	return (
		<footer className="border-t border-border/60 bg-background transition-colors">
			<div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-5 gap-8">
					{/* Brand Column (Spans 2 on desktop) */}
					<div className="md:col-span-2 space-y-4">
						<div className="flex items-center gap-2.5">
							<div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
								<IconLink className="size-4" />
							</div>
							<span className="font-heading text-lg font-bold text-foreground">
								url<span className="text-primary font-extrabold">Shortener</span>
							</span>
						</div>

						<p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
							Enterprise-grade, event-driven URL shortening and analytics platform built with Spring Boot 3, Reactive WebFlux, Kafka KRaft, Redis 7, and PostgreSQL.
						</p>

						{/* System Status Badge */}
						<div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<span className="font-medium text-foreground text-[11px]">All Systems Operational</span>
						</div>
					</div>

					{/* Column 1: Microservices */}
					<div className="space-y-3">
						<p className="text-xs font-semibold uppercase tracking-wider text-foreground">
							Microservices
						</p>
						<ul className="space-y-2 text-xs text-muted-foreground">
							<li><a href="#architecture" className="hover:text-foreground transition-colors">API Gateway (8080)</a></li>
							<li><a href="#architecture" className="hover:text-foreground transition-colors">Core Service (8081)</a></li>
							<li><a href="#architecture" className="hover:text-foreground transition-colors">Redirect Engine (8082)</a></li>
							<li><a href="#architecture" className="hover:text-foreground transition-colors">Analytics Service (8083)</a></li>
							<li><a href="#architecture" className="hover:text-foreground transition-colors">Kafka KRaft Topic</a></li>
						</ul>
					</div>

					{/* Column 2: Platform Features */}
					<div className="space-y-3">
						<p className="text-xs font-semibold uppercase tracking-wider text-foreground">
							Platform
						</p>
						<ul className="space-y-2 text-xs text-muted-foreground">
							<li><a href="#features" className="hover:text-foreground transition-colors">Base62 Shortening</a></li>
							<li><a href="#features" className="hover:text-foreground transition-colors">UTM Campaign Builder</a></li>
							<li><a href="#analytics" className="hover:text-foreground transition-colors">GeoIP2 City Analytics</a></li>
							<li><a href="#features" className="hover:text-foreground transition-colors">Dynamic QR Codes</a></li>
							<li><a href="#performance" className="hover:text-foreground transition-colors">Adaptive TTL Caching</a></li>
						</ul>
					</div>

					{/* Column 3: Developers */}
					<div className="space-y-3">
						<p className="text-xs font-semibold uppercase tracking-wider text-foreground">
							Developers
						</p>
						<ul className="space-y-2 text-xs text-muted-foreground">
							<li><a href="#api-docs" className="hover:text-foreground transition-colors">REST API Spec</a></li>
							<li><a href="#architecture" className="hover:text-foreground transition-colors">gRPC Protobuf (9090)</a></li>
							<li><a href="http://localhost:8080/api/v1/health" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Gateway Health</a></li>
							<li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5"><IconBrandGithub className="size-3.5" /><span>GitHub Repository</span></a></li>
						</ul>
					</div>
				</div>

				{/* Bottom Divider & Copyright */}
				<div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
					<p>© {new Date().getFullYear()} urlShortener Platform. All rights reserved.</p>
					<div className="flex items-center gap-4">
						<span className="font-mono text-[11px]">Java 17 · Spring Boot 3 · React 19 · Vite</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
