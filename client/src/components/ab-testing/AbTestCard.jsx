import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	IconFlask,
	IconPlayerPlay,
	IconPlayerPause,
	IconTrophy,
	IconEdit,
	IconChartBar,
	IconTrash,
	IconExternalLink,
} from "@tabler/icons-react";

export function AbTestCard({
	shortCode,
	experiment,
	variantStats = [],
	onToggleStatus,
	onEdit,
	onPromoteWinner,
	onViewTelemetry,
	onDelete,
}) {
	const status = experiment?.status || "ACTIVE";
	const isPaused = status === "PAUSED";
	const isConcluded = status === "CONCLUDED";
	const variants = experiment?.variants || [];

	const totalClicks = variantStats.reduce(
		(sum, v) => sum + (v.clickCount || 0),
		0
	);

	return (
		<Card className="border-border/70 bg-card overflow-hidden shadow-xs">
			{/* Experiment Header */}
			<div className="p-4 sm:p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
				<div className="space-y-1 min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<Link
							to={`/ab-testing/${experiment?.id || shortCode}`}
							className="font-heading text-base font-bold text-foreground hover:text-primary transition-colors hover:underline"
						>
							{experiment?.name || "A/B Experiment"}
						</Link>
						<Badge
							variant={isConcluded ? "secondary" : isPaused ? "outline" : "default"}
							className={`text-[10px] font-semibold ${
								status === "ACTIVE"
									? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
									: isPaused
										? "text-amber-500 border-amber-500/30"
										: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
							}`}
						>
							{status}
						</Badge>
						{isConcluded && experiment?.winningVariant && (
							<Badge
								variant="outline"
								className="text-[10px] text-amber-500 border-amber-500/40 gap-1"
							>
								<IconTrophy className="size-3" />
								<span>Winner: Variant {experiment.winningVariant}</span>
							</Badge>
						)}
					</div>
					<div className="text-xs text-muted-foreground flex items-center gap-2">
						<span>Shortcode:</span>
						<Link
							to={`/redirect-links/${shortCode}`}
							className="font-mono font-semibold text-primary hover:underline"
						>
							/r/{shortCode}
						</Link>
						<span className="text-border">|</span>
						<span>
							Cookie Stickiness:{" "}
							{Math.round((experiment?.cookieTtlSeconds || 2592000) / 86400)} days
						</span>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 shrink-0">
					{!isConcluded && (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onEdit(experiment, shortCode)}
								className="text-xs h-8 gap-1.5 cursor-pointer shadow-2xs hover:border-primary/50 text-foreground"
								title="Edit experiment variants, URLs and traffic distribution"
							>
								<IconEdit className="size-3.5 text-blue-500" />
								<span>Edit</span>
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => onToggleStatus(shortCode, status)}
								className="text-xs h-8 gap-1.5 cursor-pointer shadow-2xs"
								title={isPaused ? "Resume Experiment" : "Pause Traffic Split"}
							>
								{isPaused ? (
									<>
										<IconPlayerPlay className="size-3.5 text-emerald-500" />
										<span>Resume</span>
									</>
								) : (
									<>
										<IconPlayerPause className="size-3.5 text-amber-500" />
										<span>Pause</span>
									</>
								)}
							</Button>

							<Button
								variant="outline"
								size="sm"
								onClick={() => onPromoteWinner(experiment, shortCode)}
								className="text-xs h-8 gap-1.5 cursor-pointer text-amber-500 border-amber-500/30 hover:bg-amber-500/10 shadow-2xs"
								title="Declare winner and promote to single destination"
							>
								<IconTrophy className="size-3.5" />
								<span>Promote Winner</span>
							</Button>
						</>
					)}

					<Link to={`/ab-testing/${experiment?.id || shortCode}`}>
						<Button
							variant="outline"
							size="sm"
							className="text-xs h-8 gap-1.5 cursor-pointer shadow-2xs hover:border-primary/50 text-foreground"
							title="Open dedicated A/B Experiment workbench"
						>
							<IconFlask className="size-3.5 text-primary" />
							<span>Details</span>
						</Button>
					</Link>

					<Button
						variant="outline"
						size="sm"
						onClick={() => onViewTelemetry(experiment, shortCode)}
						className="text-xs h-8 gap-1.5 cursor-pointer shadow-2xs bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
						title="Inspect A/B telemetry"
					>
						<IconChartBar className="size-3.5" />
						<span>Telemetry</span>
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDelete(shortCode)}
						className="text-xs h-8 text-destructive hover:bg-destructive/10 cursor-pointer"
						title="Remove A/B test"
					>
						<IconTrash className="size-3.5" />
					</Button>
				</div>
			</div>

			{/* Multi-Segment Traffic Split Bar */}
			{variants.length > 0 && (
				<div className="px-4 sm:px-5 pt-4">
					<div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
						<span>Allocated Traffic Ratio</span>
						<span className="font-mono text-foreground font-bold">100% Total Split</span>
					</div>
					<div className="h-3 w-full rounded-full overflow-hidden flex bg-muted border border-border/60 shadow-inner">
						{variants.map((v, i) => {
							const colors = [
								"bg-primary",
								"bg-blue-500",
								"bg-purple-500",
								"bg-amber-500",
							];
							const barColor = colors[i % colors.length];

							return (
								<div
									key={v.key}
									style={{ width: `${v.weight}%` }}
									className={`h-full ${barColor} transition-all relative group/seg`}
									title={`Variant ${v.key}: ${v.weight}% traffic`}
								/>
							);
						})}
					</div>
				</div>
			)}

			{/* Variant Cards Grid */}
			<div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
				{variants.map((variant, i) => {
					const stat = variantStats.find(
						(s) => s.variantKey === variant.key
					);
					const clicks = stat?.clickCount || 0;
					const share = totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;
					const isControl = variant.isControl || i === 0;
					const isWinner = isConcluded && experiment?.winningVariant === variant.key;

					return (
						<div
							key={variant.key}
							className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-3 transition-all ${
								isWinner
									? "border-amber-500/60 bg-amber-500/5 shadow-2xs ring-1 ring-amber-500/20"
									: isControl
										? "border-primary/40 bg-primary/5"
										: "border-border/60 bg-muted/10"
							}`}
						>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<Badge
											variant={isWinner ? "default" : isControl ? "default" : "outline"}
											className={`text-[10px] font-bold ${
												isWinner ? "bg-amber-500 text-white" : ""
											}`}
										>
											Variant {variant.key}
										</Badge>
										{isControl && (
											<span className="text-[10px] font-medium text-primary">
												Control
											</span>
										)}
										{isWinner && (
											<span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
												<IconTrophy className="size-3" /> Winner
											</span>
										)}
									</div>
									<div className="font-mono font-bold text-foreground">
										{variant.weight}% traffic
									</div>
								</div>

								<div className="space-y-1">
									<div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
										Destination Target:
									</div>
									<a
										href={variant.destinationUrl || variant.url}
										target="_blank"
										rel="noreferrer"
										className="text-foreground hover:text-primary transition-colors flex items-center gap-1 truncate block font-mono"
										title={variant.destinationUrl || variant.url}
									>
										<span className="truncate">
											{variant.destinationUrl || variant.url}
										</span>
										<IconExternalLink className="size-3 shrink-0 opacity-60" />
									</a>
								</div>
							</div>

							<div className="pt-2 border-t border-border/40 flex items-center justify-between">
								<div>
									<div className="text-[10px] text-muted-foreground">Observed Clicks</div>
									<div className="font-heading font-bold text-foreground text-sm">
										{clicks.toLocaleString()}
									</div>
								</div>
								<div className="text-right">
									<div className="text-[10px] text-muted-foreground">Traffic Share</div>
									<div className="font-mono font-semibold text-foreground text-xs">
										{share}%
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}

export default AbTestCard;
