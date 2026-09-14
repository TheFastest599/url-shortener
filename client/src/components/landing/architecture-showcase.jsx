import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	IconServer,
	IconCpu,
	IconBolt,
	IconBroadcast,
	IconDatabase,
	IconLayersSubtract,
	IconArrowRight,
	IconRoute,
	IconShieldLock,
} from "@tabler/icons-react";

export function ArchitectureShowcase() {
	const [activeService, setActiveService] = useState("redirect");

	const services = [
		{
			id: "nginx",
			name: "Nginx Ingress",
			ports: "80 (HTTP) / 443 (HTTPS)",
			tech: "Nginx Alpine",
			role: "SSL Termination, Reverse Proxy, Static Client Distribution",
			icon: IconRoute,
			color: "text-emerald-500 bg-emerald-500/10",
			details:
				"Single entry point for all incoming traffic. Routes `/r/{shortCode}` and `/api/` directly to the Spring API Gateway while serving the compiled React frontend.",
		},
		{
			id: "gateway",
			name: "API Gateway",
			ports: "Port 8080",
			tech: "Spring Cloud Gateway + R2DBC",
			role: "JWT Authentication, Rate Limiting & Header Injection",
			icon: IconShieldLock,
			color: "text-cyan-500 bg-cyan-500/10",
			details:
				"Non-blocking security perimeter. Validates JWT access tokens with zero thread blocking, injects authenticated user headers, and enforces sliding window rate limits.",
		},
		{
			id: "redirect",
			name: "Redirect Engine",
			ports: "Port 8082",
			tech: "Spring WebFlux + Reactive Redis",
			role: "Sub-5ms 302 Redirection & Kafka Publishing",
			icon: IconBolt,
			color: "text-amber-500 bg-amber-500/10",
			details:
				"High-performance reactive microservice dedicated exclusively to link lookup. Fetches target URLs from Redis memory cache in < 3ms and fires asynchronous click events to Kafka.",
		},
		{
			id: "core",
			name: "Core Admin & CRUD",
			ports: "REST 8081 / gRPC 9090",
			tech: "Spring Boot 3 + Hibernate + JPA",
			role: "Base62 Encoding, URL Lifecycle, Redis Eviction",
			icon: IconCpu,
			color: "text-violet-500 bg-violet-500/10",
			details:
				"Handles custom alias assignment, bijective Base62 ID conversions, campaign UTM definitions, and synchronous cache invalidation over gRPC.",
		},
		{
			id: "analytics",
			name: "Analytics Service",
			ports: "REST 8083 / gRPC 9091",
			tech: "Kafka Consumer + MaxMind GeoIP2",
			role: "Stream Ingestion, Bot Filtering, Geo Resolution",
			icon: IconBroadcast,
			color: "text-rose-500 bg-rose-500/10",
			details:
				"Consumes events from `url-clicks` Kafka topic without bottlenecking redirects. Resolves IP addresses to cities and countries with GeoLite2 and writes time-series records to PostgreSQL.",
		},
		{
			id: "dataplane",
			name: "Data & Event Plane",
			ports: "5432 / 6379 / 9092",
			tech: "PostgreSQL 16 · Redis 7.2 · Kafka KRaft",
			role: "Multi-Tenant Storage, In-Memory Cache, Event Bus",
			icon: IconDatabase,
			color: "text-indigo-500 bg-indigo-500/10",
			details:
				"Three distinct database schemas (`auth`, `core`, `analytics`) with Redis distributed memory caching and Kafka KRaft for resilient event-driven microservices orchestration.",
		},
	];

	const currentService = services.find((s) => s.id === activeService) || services[0];
	const ServiceIcon = currentService.icon;

	return (
		<section id="architecture" className="py-20 border-t border-border/40 bg-muted/20">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="mx-auto max-w-2xl text-center">
					<Badge variant="outline" className="mb-3 px-3 py-1 font-mono text-xs border-primary/30 text-primary">
						Distributed Microservice Topology
					</Badge>
					<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Decoupled Microservice Architecture
					</h2>
					<p className="mt-3 text-muted-foreground text-base">
						Explore the event-driven topology that decouples sub-5ms redirection paths from heavy analytical processing.
					</p>
				</div>

				{/* Microservice Flow Diagram / Tabs */}
				<div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
					{/* Left: Interactive Service List */}
					<div className="space-y-2 lg:col-span-1">
						{services.map((svc) => {
							const Icon = svc.icon;
							const isActive = svc.id === activeService;
							return (
								<button
									key={svc.id}
									onClick={() => setActiveService(svc.id)}
									className={`w-full text-left rounded-2xl p-3.5 border transition-all flex items-center justify-between cursor-pointer ${
										isActive
											? "bg-card border-primary shadow-sm"
											: "bg-background/60 border-border/60 hover:bg-card/80"
									}`}
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${svc.color}`}>
											<Icon className="size-4" />
										</div>
										<div className="min-w-0">
											<p className="font-semibold text-sm text-foreground truncate">{svc.name}</p>
											<p className="font-mono text-[11px] text-muted-foreground truncate">{svc.ports}</p>
										</div>
									</div>
									<IconArrowRight
										className={`size-4 transition-transform shrink-0 ${
											isActive ? "text-primary translate-x-0.5" : "text-muted-foreground/50"
										}`}
									/>
								</button>
							);
						})}
					</div>

					{/* Right: Detailed Service Spec Card */}
					<div className="lg:col-span-2 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
							<div className="flex items-center gap-3">
								<div className={`flex size-12 items-center justify-center rounded-2xl ${currentService.color}`}>
									<ServiceIcon className="size-6" />
								</div>
								<div>
									<h3 className="font-heading text-xl font-bold text-foreground">
										{currentService.name}
									</h3>
									<span className="font-mono text-xs text-muted-foreground">
										{currentService.ports}
									</span>
								</div>
							</div>
							<Badge variant="secondary" className="font-mono text-xs px-3 py-1">
								{currentService.tech}
							</Badge>
						</div>

						{/* Service Responsibilities & Description */}
						<div className="mt-6 space-y-4">
							<div>
								<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Primary Responsibility
								</span>
								<p className="font-heading text-base font-semibold text-foreground mt-1">
									{currentService.role}
								</p>
							</div>

							<div className="rounded-2xl bg-muted/40 p-4 border border-border/40 text-sm text-muted-foreground leading-relaxed">
								{currentService.details}
							</div>

							{/* Architecture Flow ASCII Representation */}
							<div className="mt-4 rounded-2xl bg-background border border-border/60 p-4 font-mono text-xs overflow-x-auto text-foreground">
								<p className="text-[11px] text-muted-foreground mb-2 font-sans font-medium uppercase tracking-wider">
									Data Stream Pipeline:
								</p>
								<div className="text-primary font-bold">
									Browser → Nginx (80/443) → Gateway (8080) → Redirect (8082) → Kafka Topic ("url-clicks") → Analytics (8083)
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
