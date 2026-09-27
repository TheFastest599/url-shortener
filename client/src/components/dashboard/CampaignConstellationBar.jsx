import * as React from "react";
import { Link } from "react-router-dom";
import { IconTopologyStar3, IconFolder, IconArrowRight } from "@tabler/icons-react";

export function CampaignConstellationBar({
	campaigns = [],
	totalLinks = 0,
	activeFilter = "ALL",
	onSelectFilter,
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<IconTopologyStar3 className="size-4 text-primary" />
					<span className="text-xs font-semibold uppercase tracking-wider text-foreground">
						Campaign Constellation
					</span>
					<span className="text-[11px] text-muted-foreground">
						(Click to isolate campaign links)
					</span>
				</div>

				{activeFilter !== "ALL" && (
					<button
						onClick={() => onSelectFilter("ALL")}
						className="text-xs text-primary hover:underline font-medium cursor-pointer"
					>
						Reset Filter (Show All)
					</button>
				)}
			</div>

			<div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
				{/* All Links Pill */}
				<button
					onClick={() => onSelectFilter("ALL")}
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
						activeFilter === "ALL"
							? "bg-primary text-primary-foreground border-primary shadow-xs"
							: "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80"
					}`}
				>
					<span>All Workspace Links</span>
					<span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-background/20">
						{totalLinks}
					</span>
				</button>

				{/* Campaign Chips */}
				{campaigns.map((c) => {
					const isSelected = String(activeFilter) === String(c.id);

					return (
						<div
							key={c.id}
							className={`flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-xl text-xs font-medium transition-all shrink-0 border ${
								isSelected
									? "bg-primary/15 border-primary text-primary shadow-xs"
									: "bg-card border-border text-foreground hover:border-primary/40"
							}`}
						>
							<button
								onClick={() => onSelectFilter(isSelected ? "ALL" : c.id)}
								className="flex items-center gap-1.5 cursor-pointer text-left"
							>
								<IconFolder className="size-3.5 text-primary shrink-0" />
								<span className="truncate max-w-[130px]">{c.name}</span>
							</button>

							<Link
								to={`/campaigns/${c.id}`}
								title={`Open ${c.name} campaign workbench`}
								className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-background/80 transition-colors"
							>
								<IconArrowRight className="size-3.5" />
							</Link>
						</div>
					);
				})}

				{/* Standalone / Unassigned Pill */}
				<button
					onClick={() => onSelectFilter("UNASSIGNED")}
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border ${
						activeFilter === "UNASSIGNED"
							? "bg-muted text-foreground border-foreground/30 font-semibold"
							: "bg-card border-border text-muted-foreground hover:text-foreground"
					}`}
				>
					<span>Standalone (No Campaign)</span>
				</button>
			</div>
		</div>
	);
}

export default CampaignConstellationBar;
