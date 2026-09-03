import * as React from "react";
import {
	IconLink,
	IconCopy,
	IconCheck,
	IconTrash,
	IconQrcode,
	IconChartBar,
	IconExternalLink,
	IconSearch,
	IconPlus,
	IconArrowUpRight,
	IconSparkles,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteUrlMutation } from "@/queries";
import { toast } from "sonner";

export function LinksTable({
	urls = [],
	isLoading = false,
	onOpenCreateModal,
	onOpenQrModal,
	onSelectAnalytics,
}) {
	const [searchQuery, setSearchQuery] = React.useState("");
	const [filterStatus, setFilterStatus] = React.useState("all");
	const [copiedId, setCopiedId] = React.useState(null);
	const [deleteTarget, setDeleteTarget] = React.useState(null);

	const deleteMutation = useDeleteUrlMutation({
		onSuccess: () => {
			toast.success("Short URL deleted");
			setDeleteTarget(null);
		},
	});

	const handleCopy = (shortCode, id) => {
		const fullUrl = `http://localhost:8080/r/${shortCode}`;
		navigator.clipboard.writeText(fullUrl);
		setCopiedId(id);
		toast.success("Short URL copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	const extractHostname = (urlStr) => {
		try {
			return new URL(urlStr).hostname;
		} catch {
			return "external link";
		}
	};

	const filteredUrls = urls.filter((url) => {
		const matchSearch =
			url.shortCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			url.destinationUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			url.title?.toLowerCase().includes(searchQuery.toLowerCase());

		if (filterStatus === "active") return matchSearch && url.isActive !== false;
		if (filterStatus === "inactive") return matchSearch && url.isActive === false;
		return matchSearch;
	});

	const formatDate = (dateStr) => {
		try {
			const d = new Date(dateStr);
			return d.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
		} catch {
			return dateStr || "—";
		}
	};

	return (
		<div className="space-y-4">
			{/* Search & Filter Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="relative flex-1 max-w-sm">
					<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search slugs, titles, or domains..."
						className="pl-9 h-9 text-xs sm:text-sm bg-card border-border/80"
					/>
				</div>

				<div className="flex items-center gap-2 self-end sm:self-auto">
					<div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
						{["all", "active", "inactive"].map((status) => (
							<button
								key={status}
								onClick={() => setFilterStatus(status)}
								className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${
									filterStatus === status
										? "bg-background text-foreground shadow-2xs font-semibold"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{status}
							</button>
						))}
					</div>

					<Button
						onClick={onOpenCreateModal}
						size="sm"
						className="gap-1.5 text-xs font-medium shadow-xs cursor-pointer"
					>
						<IconPlus className="size-3.5" />
						<span>New Link</span>
					</Button>
				</div>
			</div>

			{/* Table / Card List */}
			{filteredUrls.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
					<div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
						<IconLink className="size-6" />
					</div>
					<h3 className="font-heading text-base font-semibold text-foreground">
						No Short URLs Found
					</h3>
					<p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
						{searchQuery
							? "No short links match your active search filter."
							: "Create your first short link to start routing traffic through the API Gateway."}
					</p>
					{!searchQuery && (
						<Button
							onClick={onOpenCreateModal}
							size="sm"
							className="gap-1.5 text-xs cursor-pointer shadow-xs"
						>
							<IconPlus className="size-3.5" />
							<span>Create Short URL</span>
						</Button>
					)}
				</div>
			) : (
				<div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs sm:text-sm">
							<thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
								<tr>
									<th className="py-3 px-4">Short Code & Slug</th>
									<th className="py-3 px-4">Destination Target</th>
									<th className="py-3 px-4">Created</th>
									<th className="py-3 px-4">Status</th>
									<th className="py-3 px-4 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border/60">
								{filteredUrls.map((url) => {
									const isCopied = copiedId === url.id;
									const fullShortUrl = `http://localhost:8080/r/${url.shortCode}`;
									const hostname = extractHostname(url.destinationUrl);
									const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;

									return (
										<tr
											key={url.id}
											className="hover:bg-muted/30 transition-colors group"
										>
											{/* Short Link column */}
											<td className="py-3.5 px-4 font-mono font-semibold text-foreground">
												<div className="flex items-center gap-2">
													<span className="text-primary font-bold">
														/r/{url.shortCode}
													</span>
													<button
														onClick={() => handleCopy(url.shortCode, url.id)}
														className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1 rounded-md hover:bg-muted"
														title="Copy Short Link"
													>
														{isCopied ? (
															<IconCheck className="size-3.5 text-emerald-500" />
														) : (
															<IconCopy className="size-3.5 opacity-60 group-hover:opacity-100" />
														)}
													</button>
												</div>
												{url.title && (
													<div className="text-[11px] font-sans font-normal text-muted-foreground truncate max-w-[200px] mt-0.5">
														{url.title}
													</div>
												)}
											</td>

											{/* Destination column with Favicon */}
											<td className="py-3.5 px-4 max-w-sm">
												<div className="flex items-center gap-2 min-w-0">
													<img
														src={faviconUrl}
														alt=""
														className="size-4 shrink-0 rounded-xs opacity-80"
														onError={(e) => {
															e.target.style.display = "none";
														}}
													/>
													<a
														href={url.destinationUrl}
														target="_blank"
														rel="noreferrer"
														className="truncate text-xs text-muted-foreground hover:text-foreground transition-colors hover:underline"
														title={url.destinationUrl}
													>
														{url.destinationUrl}
													</a>
												</div>
											</td>

											{/* Date column */}
											<td className="py-3.5 px-4 text-muted-foreground font-mono text-xs whitespace-nowrap">
												{formatDate(url.createdAt)}
											</td>

											{/* Status badge */}
											<td className="py-3.5 px-4">
												<Badge
													variant={url.isActive !== false ? "default" : "secondary"}
													className="text-[10px] px-2 py-0 font-medium capitalize"
												>
													{url.isActive !== false ? "Active" : "Inactive"}
												</Badge>
											</td>

											{/* Actions column */}
											<td className="py-3.5 px-4 text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => onSelectAnalytics(url.shortCode)}
														className="size-7 text-muted-foreground hover:text-primary cursor-pointer rounded-lg"
														title="View Telemetry Hub"
													>
														<IconChartBar className="size-3.5" />
													</Button>

													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => onOpenQrModal(fullShortUrl)}
														className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
														title="Generate QR Code"
													>
														<IconQrcode className="size-3.5" />
													</Button>

													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => window.open(fullShortUrl, "_blank")}
														className="size-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
														title="Test Redirection (302)"
													>
														<IconExternalLink className="size-3.5" />
													</Button>

													<Button
														variant="ghost"
														size="icon-sm"
														onClick={() => setDeleteTarget(url)}
														className="size-7 text-muted-foreground hover:text-destructive cursor-pointer rounded-lg"
														title="Delete URL"
													>
														<IconTrash className="size-3.5" />
													</Button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Short URL</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete{" "}
							<span className="font-mono font-semibold text-foreground">
								/r/{deleteTarget?.shortCode}
							</span>
							? This will permanently stop all redirection traffic.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex gap-2 pt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDeleteTarget(null)}
							className="text-xs cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							disabled={deleteMutation.isPending}
							onClick={() =>
								deleteTarget && deleteMutation.mutate(deleteTarget.id)
							}
							className="text-xs cursor-pointer"
						>
							{deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
