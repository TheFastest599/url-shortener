import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { IconFolder, IconPlus } from "@tabler/icons-react";

export function DashboardHeader({ username = "growth-marketer", onOpenCreateModal }) {
	return (
		<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/50 pb-5">
			<div className="space-y-1">
				<div className="flex items-center gap-2.5 flex-wrap">
					<h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
						Growth Mission Control
					</h1>
					<div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
						<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
						<span>Mesh Connected</span>
					</div>
				</div>
				<p className="text-xs sm:text-sm text-muted-foreground">
					Relational campaign intelligence, edge routing velocity, and conversion attribution for{" "}
					<span className="font-semibold text-foreground">@{username}</span>.
				</p>
			</div>

			<div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
				<Link to={ROUTES.CAMPAIGNS}>
					<Button
						variant="outline"
						className="gap-1.5 text-xs sm:text-sm h-9 sm:h-10 px-3.5 font-medium cursor-pointer"
					>
						<IconFolder className="size-4 text-primary" />
						<span>Campaigns Hub</span>
					</Button>
				</Link>

				<Button
					onClick={onOpenCreateModal}
					className="gap-2 text-xs sm:text-sm h-9 sm:h-10 px-4 font-semibold shadow-xs cursor-pointer"
				>
					<IconPlus className="size-4" />
					<span>Create Shortlink</span>
				</Button>
			</div>
		</div>
	);
}

export default DashboardHeader;
