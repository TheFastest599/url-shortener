import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProfileDialog } from "@/components/auth/profile-dialog";
import {
	IconLink,
	IconPlus,
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconChartBar,
	IconBolt,
	IconWorld,
	IconUsers,
	IconSparkles,
	IconUser,
	IconQrcode,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function DashboardPage() {
	const { user } = useAuthStore();
	const [profileOpen, setProfileOpen] = useState(false);
	const [newUrl, setNewUrl] = useState("");
	const [newSlug, setNewSlug] = useState("");
	const [copiedId, setCopiedId] = useState(null);

	const [links, setLinks] = useState([
		{
			id: "1",
			slug: "cloud-summit",
			shortUrl: "https://urlshortener.io/r/cloud-summit",
			targetUrl: "https://github.com/EnterpriseCorp/nextgen-cloud-infrastructure",
			clicks: 1420,
			status: "ACTIVE",
			createdAt: "2026-08-30",
		},
		{
			id: "2",
			slug: "spring-reactive-v3",
			shortUrl: "https://urlshortener.io/r/spring-reactive-v3",
			targetUrl: "https://spring.io/projects/spring-framework-v3-reactive-guides",
			clicks: 840,
			status: "ACTIVE",
			createdAt: "2026-08-28",
		},
		{
			id: "3",
			slug: "kafka-telemetry",
			shortUrl: "https://urlshortener.io/r/kafka-telemetry",
			targetUrl: "https://confluent.io/blog/kraft-event-driven-stream-processing",
			clicks: 512,
			status: "ACTIVE",
			createdAt: "2026-08-25",
		},
	]);

	const handleCreateLink = (e) => {
		e.preventDefault();
		if (!newUrl.trim()) {
			toast.error("Please enter a valid target URL");
			return;
		}

		const slug = newSlug.trim() || Math.random().toString(36).substring(2, 8);
		const newLinkItem = {
			id: Date.now().toString(),
			slug: slug,
			shortUrl: `https://urlshortener.io/r/${slug}`,
			targetUrl: newUrl.trim(),
			clicks: 0,
			status: "ACTIVE",
			createdAt: "Today",
		};

		setLinks([newLinkItem, ...links]);
		setNewUrl("");
		setNewSlug("");
		toast.success(`Short link /r/${slug} created and cached in Redis!`);
	};

	const handleCopy = (id, url) => {
		navigator.clipboard.writeText(url);
		setCopiedId(id);
		toast.success("Short URL copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	return (
		<div className="py-10">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
				{/* Top Welcome Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
					<div>
						<div className="flex items-center gap-2">
							<h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
								Welcome back, <span className="text-primary">{user?.username || "Developer"}</span>!
							</h1>
							<Badge variant="secondary" className="font-mono text-xs uppercase">
								{user?.role || "USER"}
							</Badge>
						</div>
						<p className="mt-1 text-xs sm:text-sm text-muted-foreground">
							Manage your high-performance short links, custom aliases, and real-time Kafka analytics.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setProfileOpen(true)}
							className="gap-2 cursor-pointer text-xs"
						>
							<IconUser className="size-4 text-primary" />
							<span>My Profile</span>
						</Button>
					</div>
				</div>

				{/* Quick Stats Grid */}
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground text-xs">
							<span>Active Links</span>
							<IconLink className="size-4 text-primary" />
						</div>
						<p className="font-heading mt-2 text-2xl font-bold text-foreground">{links.length}</p>
						<span className="text-[11px] text-emerald-500 font-medium">Base62 Invertible</span>
					</div>

					<div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground text-xs">
							<span>Total Clicks</span>
							<IconChartBar className="size-4 text-cyan-500" />
						</div>
						<p className="font-heading mt-2 text-2xl font-bold text-foreground">
							{links.reduce((acc, l) => acc + l.clicks, 0).toLocaleString()}
						</p>
						<span className="text-[11px] text-emerald-500 font-medium">Stream Ingested</span>
					</div>

					<div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground text-xs">
							<span>Redirect Engine</span>
							<IconBolt className="size-4 text-amber-500" />
						</div>
						<p className="font-heading mt-2 text-2xl font-bold text-foreground">3.2 ms</p>
						<span className="text-[11px] text-muted-foreground">Redis Cache Hit</span>
					</div>

					<div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
						<div className="flex items-center justify-between text-muted-foreground text-xs">
							<span>Geo Resolution</span>
							<IconWorld className="size-4 text-indigo-500" />
						</div>
						<p className="font-heading mt-2 text-lg font-bold text-foreground truncate">GeoIP2 Active</p>
						<span className="text-[11px] text-muted-foreground">City & ISP Filter</span>
					</div>
				</div>

				{/* Quick Shorten Link Card */}
				<div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<IconSparkles className="size-4 text-primary" />
						<h2 className="font-heading text-base font-bold text-foreground">
							Create New Short Link
						</h2>
					</div>

					<form onSubmit={handleCreateLink} className="space-y-3">
						<div className="flex flex-col sm:flex-row gap-3">
							<div className="flex-1">
								<Input
									value={newUrl}
									onChange={(e) => setNewUrl(e.target.value)}
									placeholder="https://example.com/target-destination-url..."
									className="h-10 text-sm bg-background border-border"
									required
								/>
							</div>
							<div className="w-full sm:w-48">
								<Input
									value={newSlug}
									onChange={(e) => setNewSlug(e.target.value)}
									placeholder="custom-slug (opt)"
									className="h-10 text-sm font-mono bg-background border-border"
								/>
							</div>
							<Button type="submit" className="h-10 gap-2 cursor-pointer shrink-0">
								<IconPlus className="size-4" />
								<span>Shorten</span>
							</Button>
						</div>
					</form>
				</div>

				{/* Links Table / List */}
				<div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
					<div className="p-5 border-b border-border/60 flex items-center justify-between">
						<h3 className="font-heading text-base font-bold text-foreground">
							Your Short Links
						</h3>
						<span className="text-xs text-muted-foreground font-mono">
							Showing {links.length} URLs
						</span>
					</div>

					<div className="divide-y divide-border/40">
						{links.map((link) => (
							<div
								key={link.id}
								className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
							>
								<div className="space-y-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="font-mono text-sm font-bold text-foreground">
											{link.shortUrl}
										</p>
										<Badge variant="outline" className="text-[10px] py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
											{link.status}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground truncate max-w-xl">
										Destination: {link.targetUrl}
									</p>
									<p className="text-[11px] text-muted-foreground font-mono">
										Created: {link.createdAt} · Total Clicks: <span className="font-bold text-foreground">{link.clicks}</span>
									</p>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-2 shrink-0">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleCopy(link.id, link.shortUrl)}
										className="gap-1.5 cursor-pointer text-xs"
									>
										{copiedId === link.id ? (
											<>
												<IconCheck className="size-3.5 text-primary" />
												<span>Copied</span>
											</>
										) : (
											<>
												<IconCopy className="size-3.5" />
												<span>Copy</span>
											</>
										)}
									</Button>

									<a
										href={link.shortUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
									>
										<IconExternalLink className="size-3.5" />
										<span>Test</span>
									</a>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Profile Modal */}
			<ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
		</div>
	);
}

export default DashboardPage;
