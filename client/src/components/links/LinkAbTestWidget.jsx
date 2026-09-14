import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconFlask, IconArrowRight } from "@tabler/icons-react";

export function LinkAbTestWidget({ isAbTest = false, abTest = null }) {
	return (
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-5 pb-3">
				<CardTitle className="text-sm font-semibold flex items-center justify-between">
					<div className="flex items-center gap-2">
						<IconFlask className="size-4 text-primary" />
						<span>A/B Split Experiment</span>
					</div>
					{isAbTest ? (
						<Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/40">
							{abTest?.status || "Active"}
						</Badge>
					) : (
						<Badge variant="secondary" className="text-[10px]">
							Not Configured
						</Badge>
					)}
				</CardTitle>
				<CardDescription className="text-xs">
					Distribute incoming clicks across multiple landing page destinations.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-5 pt-0 space-y-3">
				{isAbTest && abTest ? (
					<div className="space-y-3">
						<div className="flex items-center justify-between text-xs">
							<Link
								to={`/ab-testing/${abTest.id || abTest.shortCode}`}
								className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
							>
								{abTest.name}
							</Link>
							<span className="text-muted-foreground font-mono">
								{abTest.variants?.length || 0} variants
							</span>
						</div>

						{/* Multi-segment split visualizer */}
						{abTest.variants && (
							<div className="space-y-1">
								<div className="h-2.5 w-full rounded-full overflow-hidden flex bg-muted border border-border/50">
									{abTest.variants.map((v, i) => (
										<div
											key={v.key}
											style={{ width: `${v.weight}%` }}
											className={`h-full ${i === 0 ? "bg-primary" : "bg-blue-500"}`}
											title={`Variant ${v.key}: ${v.weight}%`}
										/>
									))}
								</div>
							</div>
						)}

						<div className="space-y-1.5 pt-1">
							{abTest.variants?.map((v) => (
								<div
									key={v.key}
									className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-muted/30 border border-border/40"
								>
									<div className="flex items-center gap-2 min-w-0">
										<Badge variant={v.isControl ? "default" : "secondary"} className="text-[10px] font-mono">
											{v.key} {v.isControl ? "(Control)" : ""}
										</Badge>
										<span
											className="font-mono text-muted-foreground truncate max-w-[200px]"
											title={v.destinationUrl || v.url}
										>
											{v.destinationUrl || v.url}
										</span>
									</div>
									<span className="font-mono font-semibold text-foreground shrink-0">{v.weight}%</span>
								</div>
							))}
						</div>

						<div className="pt-2">
							<Link to={`/ab-testing/${abTest.id || abTest.shortCode}`}>
								<Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1.5 cursor-pointer">
									<span>Manage in A/B Experiments Workbench</span>
									<IconArrowRight className="size-3.5" />
								</Button>
							</Link>
						</div>
					</div>
				) : (
					<div className="flex items-center justify-between pt-1">
						<p className="text-xs text-muted-foreground">
							Test multiple variant pages against this link with cookie stickiness.
						</p>
						<Link to={ROUTES.AB_TESTING}>
							<Button size="sm" variant="outline" className="text-xs h-8 gap-1.5 shrink-0 cursor-pointer">
								<IconFlask className="size-3.5 text-primary" />
								<span>Configure A/B Test</span>
							</Button>
						</Link>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default LinkAbTestWidget;
