import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { IconArrowRight, IconSparkles, IconCheck, IconLayoutDashboard } from "@tabler/icons-react";

/**
 * Hallmark · Modern-Minimal CTA Section
 * Warm, inviting call to action without buzzwords or fake metrics.
 */
export function CtaSection() {
	const { logged, isLogged, user } = useAuthStore();
	const isAuthenticated = !!(logged || isLogged || user);

	const scrollToShortener = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<section className="py-20 sm:py-24 border-t border-border/40 bg-gradient-to-b from-transparent to-muted/20">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
				<div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-8 sm:p-12 text-center shadow-lg">
					{/* Ambient subtle glow */}
					<div className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-primary/10 blur-3xl" />
					<div className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-emerald-500/10 blur-3xl" />

					<div className="mx-auto max-w-2xl relative z-10">
						<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
							<IconSparkles className="size-3.5" />
							<span>Simple · Fast · Reliable</span>
						</div>

						<h2 className="font-heading mt-5 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
							Start sharing links that get noticed.
						</h2>
						<p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
							Create branded short links, generate print-ready QR codes, and see where your audience comes from in real time.
						</p>

						{/* Action Buttons */}
						<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
							{isAuthenticated ? (
								<>
									<Link to={ROUTES.DASHBOARD}>
										<Button
											size="lg"
											className="gap-2 cursor-pointer shadow-sm text-sm font-semibold px-6"
										>
											<IconLayoutDashboard className="size-4" />
											<span>Open Dashboard</span>
											<IconArrowRight className="size-4" />
										</Button>
									</Link>
									<Button
										variant="outline"
										size="lg"
										onClick={scrollToShortener}
										className="cursor-pointer text-sm font-medium px-5"
									>
										Shorten Another Link
									</Button>
								</>
							) : (
								<>
									<Link to={ROUTES.SIGNUP}>
										<Button
											size="lg"
											className="gap-2 cursor-pointer shadow-sm text-sm font-semibold px-6"
										>
											<span>Get Started Free</span>
											<IconArrowRight className="size-4" />
										</Button>
									</Link>
									<Link to={ROUTES.LOGIN}>
										<Button
											variant="outline"
											size="lg"
											className="cursor-pointer text-sm font-medium px-5"
										>
											Sign In
										</Button>
									</Link>
								</>
							)}
						</div>

						{/* Clean Honest Trust Checks */}
						<div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
							<div className="flex items-center gap-1.5">
								<IconCheck className="size-4 text-emerald-500" />
								<span>Free to use</span>
							</div>
							<div className="flex items-center gap-1.5">
								<IconCheck className="size-4 text-emerald-500" />
								<span>No credit card required</span>
							</div>
							<div className="flex items-center gap-1.5">
								<IconCheck className="size-4 text-emerald-500" />
								<span>Instant activation</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default CtaSection;
