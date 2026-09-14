import * as React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	IconCopy,
	IconCheck,
	IconExternalLink,
	IconQrcode,
	IconChartBar,
	IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function LinkDetailHeader({
	shortCode,
	isActive = true,
	isAbTest = false,
	onOpenQrModal,
	onDeleteClick,
}) {
	const [copied, setCopied] = React.useState(false);
	const fullUrl = `${window.location.origin}/r/${shortCode}`;

	const handleCopy = () => {
		navigator.clipboard.writeText(fullUrl);
		setCopied(true);
		toast.success("Short URL copied to clipboard");
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
			<div className="space-y-1">
				<Breadcrumb>
					<BreadcrumbList className="text-xs">
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={ROUTES.REDIRECT_LINKS}>Links</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="font-mono font-semibold text-foreground">
								/r/{shortCode}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex items-center gap-2.5 flex-wrap">
					<h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
						/r/{shortCode}
					</h1>
					<Badge
						variant="outline"
						className={`text-[10px] ${
							isActive
								? "text-emerald-500 border-emerald-500/30"
								: "text-muted-foreground border-border"
						}`}
					>
						{isActive ? "Active" : "Inactive"}
					</Badge>
					{isAbTest && (
						<Link to={ROUTES.AB_TESTING}>
							<Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer">
								A/B Test Running
							</Badge>
						</Link>
					)}
				</div>
			</div>

			<div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
				<Button
					variant="outline"
					size="sm"
					onClick={handleCopy}
					className="text-xs h-8.5 gap-1.5 cursor-pointer shadow-2xs"
				>
					{copied ? <IconCheck className="size-3.5 text-emerald-500" /> : <IconCopy className="size-3.5" />}
					<span>Copy</span>
				</Button>

				<Button
					variant="outline"
					size="sm"
					onClick={() => onOpenQrModal?.(fullUrl)}
					className="text-xs h-8.5 gap-1.5 cursor-pointer shadow-2xs"
				>
					<IconQrcode className="size-3.5" />
					<span>QR Code</span>
				</Button>

				<a
					href={fullUrl}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-1.5 px-3 h-8.5 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted/50 transition-colors shadow-2xs"
				>
					<span>Test Redirect</span>
					<IconExternalLink className="size-3.5" />
				</a>

				<Link to={`/analytics/${shortCode}`}>
					<Button
						variant="outline"
						size="sm"
						className="text-xs h-8.5 gap-1.5 cursor-pointer shadow-2xs text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
					>
						<IconChartBar className="size-3.5" />
						<span>Telemetry</span>
					</Button>
				</Link>

				<Button
					variant="ghost"
					size="sm"
					onClick={onDeleteClick}
					className="text-xs h-8.5 text-destructive hover:bg-destructive/10 cursor-pointer"
					title="Delete short URL"
				>
					<IconTrash className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}

export default LinkDetailHeader;
