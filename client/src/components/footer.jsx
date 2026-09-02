import { Link } from "react-router-dom";
import { IconLink, IconBrandGithub } from "@tabler/icons-react";
import { ROUTES } from "@/routes/paths";

export function Footer() {
	return (
		<footer className="border-t border-border/60 bg-background transition-colors">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Brand & Tagline */}
					<div className="flex items-center gap-3">
						<Link
							to={ROUTES.HOME}
							className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
						>
							<div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
								<IconLink className="size-3.5" />
							</div>
							<span className="font-heading text-sm font-bold text-foreground">
								url<span className="text-primary font-extrabold">Shortener</span>
							</span>
						</Link>
						<span className="text-muted-foreground/60">·</span>
						<span className="text-xs text-muted-foreground">
							Enterprise Reactive URL Infrastructure
						</span>
					</div>

					{/* Links & Cluster Status */}
					<div className="flex items-center gap-6 text-xs text-muted-foreground">
						<Link to={ROUTES.DASHBOARD} className="hover:text-foreground transition-colors">
							Dashboard
						</Link>
						<a
							href="https://github.com"
							target="_blank"
							rel="noreferrer"
							className="hover:text-foreground transition-colors flex items-center gap-1.5"
						>
							<IconBrandGithub className="size-3.5" />
							<span>GitHub</span>
						</a>
						<div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-2.5 py-0.5 text-[11px]">
							<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
							<span className="font-mono">Gateway :8080</span>
						</div>
					</div>
				</div>

				{/* Copyright Line */}
				<div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
					<p>© {new Date().getFullYear()} urlShortener. All rights reserved.</p>
					<span className="font-mono">Spring Boot 3 · Kafka KRaft · Redis 7 · React 19</span>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
