import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	IconChartBar,
	IconUsers,
	IconWorld,
	IconDeviceDesktop,
	IconDeviceMobile,
	IconBrowserCheck,
	IconClock,
	IconRadar2,
} from "@tabler/icons-react";

export function AnalyticsPreview() {
	const [timeRange, setTimeRange] = useState("7d");

	// Time range mock statistics
	const statsData = {
		"24h": {
			clicks: "18,429",
			visitors: "14,120",
			topCountry: "United States (38%)",
			topReferrer: "Twitter / X (44%)",
			bars: [32, 45, 28, 65, 80, 52, 94, 110, 85, 95, 120, 140],
		},
		"7d": {
			clicks: "128,940",
			visitors: "94,310",
			topCountry: "United States (41%)",
			topReferrer: "LinkedIn (39%)",
			bars: [45, 60, 75, 90, 80, 110, 135, 120, 140, 160, 185, 195],
		},
		"30d": {
			clicks: "642,800",
			visitors: "482,100",
			topCountry: "United States (43%)",
			topReferrer: "Direct / QR (35%)",
			bars: [60, 80, 95, 110, 130, 145, 160, 175, 190, 210, 230, 250],
		},
	};

	const currentStats = statsData[timeRange];

	const liveStream = [
		{ city: "San Francisco", country: "US", code: "cloud-summit", ip: "198.51.***.***", time: "2s ago", browser: "Chrome" },
		{ city: "Frankfurt", country: "DE", code: "docs-v2", ip: "185.220.***.***", time: "5s ago", browser: "Firefox" },
		{ city: "Tokyo", country: "JP", code: "cloud-summit", ip: "133.242.***.***", time: "8s ago", browser: "Safari" },
		{ city: "London", country: "GB", code: "api-keys", ip: "51.148.***.***", time: "11s ago", browser: "Edge" },
	];

	return (
		<section id="analytics" className="py-20 border-t border-border/40">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Section Heading */}
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="max-w-2xl">
						<Badge variant="outline" className="mb-3 px-3 py-1 font-mono text-xs border-primary/30 text-primary">
							Real-Time Analytics Dashboard
						</Badge>
						<h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
							Live Clickstream Intelligence & Geographic Attribution
						</h2>
						<p className="mt-3 text-muted-foreground text-base">
							Monitor link engagement across countries, referrers, device types, and operating systems with streaming precision.
						</p>
					</div>

					{/* Time Range Filter Buttons */}
					<div className="flex items-center gap-1.5 rounded-2xl bg-muted/60 p-1 border border-border/60 self-start md:self-auto">
						{[
							{ id: "24h", label: "24 Hours" },
							{ id: "7d", label: "7 Days" },
							{ id: "30d", label: "30 Days" },
						].map((item) => (
							<button
								key={item.id}
								onClick={() => setTimeRange(item.id)}
								className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
									timeRange === item.id
										? "bg-background text-foreground shadow-xs"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{item.label}
							</button>
						))}
					</div>
				</div>

				{/* Dashboard Preview Shell */}
				<div className="mt-10 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl backdrop-blur-md">
					{/* Top KPI Metrics Row */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="rounded-2xl border border-border/60 bg-background/60 p-4">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span>Total Redirections</span>
								<IconChartBar className="size-4 text-primary" />
							</div>
							<p className="font-heading mt-2 text-2xl font-bold text-foreground">
								{currentStats.clicks}
							</p>
							<span className="text-[11px] text-emerald-500 font-medium">+14.2% vs previous period</span>
						</div>

						<div className="rounded-2xl border border-border/60 bg-background/60 p-4">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span>Unique Visitors</span>
								<IconUsers className="size-4 text-cyan-500" />
							</div>
							<p className="font-heading mt-2 text-2xl font-bold text-foreground">
								{currentStats.visitors}
							</p>
							<span className="text-[11px] text-emerald-500 font-medium">99.1% non-bot traffic</span>
						</div>

						<div className="rounded-2xl border border-border/60 bg-background/60 p-4">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span>Top Geographic Origin</span>
								<IconWorld className="size-4 text-amber-500" />
							</div>
							<p className="font-heading mt-2 text-lg font-bold text-foreground truncate">
								{currentStats.topCountry}
							</p>
							<span className="text-[11px] text-muted-foreground">MaxMind GeoIP2</span>
						</div>

						<div className="rounded-2xl border border-border/60 bg-background/60 p-4">
							<div className="flex items-center justify-between text-muted-foreground text-xs">
								<span>Top Referrer</span>
								<IconRadar2 className="size-4 text-indigo-500" />
							</div>
							<p className="font-heading mt-2 text-lg font-bold text-foreground truncate">
								{currentStats.topReferrer}
							</p>
							<span className="text-[11px] text-muted-foreground">UTM campaign tracking</span>
						</div>
					</div>

					{/* Charts & Breakdown Section */}
					<div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Visual Sparkline / Bar Graph (Spans 2 columns) */}
						<div className="lg:col-span-2 rounded-2xl border border-border/60 bg-background/40 p-5">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Clickstream Traffic Velocity
								</span>
								<div className="flex items-center gap-2">
									<div className="size-2 rounded-full bg-primary" />
									<span className="text-xs text-muted-foreground font-mono">Redirect Events</span>
								</div>
							</div>

							{/* Interactive Bar Chart Visualization */}
							<div className="mt-8 flex h-40 items-end gap-2 sm:gap-3 px-2">
								{currentStats.bars.map((val, idx) => (
									<div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
										<div
											style={{ height: `${(val / 260) * 100}%` }}
											className="w-full rounded-t-lg bg-primary/70 group-hover:bg-primary transition-all duration-300 relative"
										>
											<div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-foreground text-background px-1.5 py-0.5 text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none z-10">
												{val * 42}
											</div>
										</div>
										<span className="text-[10px] font-mono text-muted-foreground">
											{idx + 1}
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Geographic Breakdown Box */}
						<div className="rounded-2xl border border-border/60 bg-background/40 p-5 space-y-4">
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
								Top Countries
							</span>
							<div className="space-y-3">
								{[
									{ country: "United States", share: 42, flag: "🇺🇸" },
									{ country: "Germany", share: 21, flag: "🇩🇪" },
									{ country: "Japan", share: 15, flag: "🇯🇵" },
									{ country: "United Kingdom", share: 12, flag: "🇬🇧" },
									{ country: "India", share: 10, flag: "🇮🇳" },
								].map((item) => (
									<div key={item.country} className="space-y-1">
										<div className="flex justify-between text-xs font-medium">
											<span className="flex items-center gap-1.5">
												<span>{item.flag}</span>
												<span>{item.country}</span>
											</span>
											<span className="font-mono text-muted-foreground">{item.share}%</span>
										</div>
										<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
											<div
												className="h-full bg-primary/80 rounded-full transition-all"
												style={{ width: `${item.share}%` }}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Live Streaming Activity Feed */}
					<div className="mt-6 rounded-2xl border border-border/60 bg-background/60 p-4">
						<div className="flex items-center justify-between pb-3 border-b border-border/40">
							<div className="flex items-center gap-2">
								<div className="size-2 rounded-full bg-emerald-500 animate-ping" />
								<span className="text-xs font-semibold uppercase tracking-wider text-foreground">
									Live Event Stream (Kafka Consumer)
								</span>
							</div>
							<span className="text-xs font-mono text-muted-foreground">Kafka: url-clicks</span>
						</div>

						<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
							{liveStream.map((item, idx) => (
								<div
									key={idx}
									className="rounded-xl border border-border/40 bg-card p-3 text-xs flex items-center justify-between"
								>
									<div className="space-y-0.5 min-w-0">
										<div className="flex items-center gap-1 font-semibold text-foreground truncate">
											<span>{item.city},</span>
											<span className="text-muted-foreground">{item.country}</span>
										</div>
										<p className="font-mono text-[11px] text-primary truncate">/r/{item.code}</p>
									</div>
									<div className="text-right text-[11px] text-muted-foreground shrink-0 pl-2">
										<span>{item.browser}</span>
										<p className="text-[10px] opacity-75">{item.time}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
