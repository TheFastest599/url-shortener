import { IconBolt, IconBroadcast } from "@tabler/icons-react";

export function AuthSideArt({
	headline = "High-Velocity Link Routing & Stream Ingestion",
}) {
	return (
		<div className="relative hidden h-full flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white lg:flex">
			{/* Ambient Matrix Glows & Gradients */}
			<div className="pointer-events-none absolute -right-20 -top-20 size-[500px] rounded-full bg-amber-500/10 blur-[100px]" />
			<div className="pointer-events-none absolute -bottom-20 -left-20 size-[500px] rounded-full bg-primary/10 blur-[100px]" />

			{/* Background Matrix Binary Code Stream Texture */}
			<div className="pointer-events-none absolute inset-0 select-none opacity-15 font-mono text-xs leading-5 text-amber-400 overflow-hidden p-6 rotate-12 scale-125 select-none">
				{Array.from({ length: 24 }).map((_, i) => (
					<div key={i} className="truncate tracking-widest">
						01001110 10010100 11101001 00010001 10011101 01110001 01010110 11100100 01000111
					</div>
				))}
			</div>

			{/* Top subtle badge */}
			<div className="relative z-10 flex items-center justify-end">
				<span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-400">
					Sub-5ms Engine
				</span>
			</div>

			{/* Center Live Telemetry & Architecture highlights */}
			<div className="relative z-10 my-auto max-w-lg space-y-6">
				<div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-md">
					<div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
					<span>Reactive Spring WebFlux + Redis 7.2 Cache</span>
				</div>

				<h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl leading-tight">
					{headline}
				</h2>

				<div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs text-zinc-400">
					<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
						<div className="flex items-center gap-2 text-amber-400">
							<IconBolt className="size-4" />
							<span className="font-bold">&lt; 3.4ms</span>
						</div>
						<p className="mt-1 text-[11px] text-zinc-400">Redis Redirect Latency</p>
					</div>
					<div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-sm">
						<div className="flex items-center gap-2 text-primary">
							<IconBroadcast className="size-4" />
							<span className="font-bold">100k+ req/s</span>
						</div>
						<p className="mt-1 text-[11px] text-zinc-400">Kafka Event Pipeline</p>
					</div>
				</div>
			</div>

			{/* Bottom architecture spec strip */}
			<div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 font-mono">
				<span>Spring Boot 3 · Spring Cloud Gateway</span>
				<span>PostgreSQL 16 · Kafka KRaft</span>
			</div>
		</div>
	);
}
