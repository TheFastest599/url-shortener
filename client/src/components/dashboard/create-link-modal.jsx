import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateUrlMutation } from "@/queries";
import {
	IconLink,
	IconSparkles,
	IconAdjustments,
	IconCheck,
	IconCopy,
	IconArrowRight,
	IconQrcode,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function CreateLinkModal({
	open,
	onOpenChange,
	onOpenQrModal,
	initialDestinationUrl = "",
}) {
	const [destinationUrl, setDestinationUrl] = React.useState(initialDestinationUrl);
	const [customAlias, setCustomAlias] = React.useState("");
	const [showUtm, setShowUtm] = React.useState(false);
	const [utmSource, setUtmSource] = React.useState("");
	const [utmMedium, setUtmMedium] = React.useState("");
	const [utmCampaign, setUtmCampaign] = React.useState("");
	const [utmTerm, setUtmTerm] = React.useState("");
	const [utmContent, setUtmContent] = React.useState("");

	React.useEffect(() => {
		if (initialDestinationUrl && open) {
			setDestinationUrl(initialDestinationUrl);
		}
	}, [initialDestinationUrl, open]);

	const [createdResult, setCreatedResult] = React.useState(null);
	const [copied, setCopied] = React.useState(false);

	const createUrlMutation = useCreateUrlMutation({
		onSuccess: (data) => {
			setCreatedResult(data);
			toast.success("Short URL created successfully!");
		},
		onError: (err) => {
			const msg =
				err?.response?.data?.message ||
				err?.response?.data?.error ||
				"Failed to create short URL";
			toast.error(msg);
		},
	});

	const handleReset = () => {
		setDestinationUrl("");
		setCustomAlias("");
		setShowUtm(false);
		setUtmSource("");
		setUtmMedium("");
		setUtmCampaign("");
		setUtmTerm("");
		setUtmContent("");
		setCreatedResult(null);
		setCopied(false);
	};

	const handleDialogClose = (newOpen) => {
		if (!newOpen) {
			handleReset();
		}
		onOpenChange(newOpen);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!destinationUrl.trim()) {
			toast.error("Destination URL is required");
			return;
		}

		let formattedUrl = destinationUrl.trim();
		if (
			!formattedUrl.startsWith("http://") &&
			!formattedUrl.startsWith("https://")
		) {
			formattedUrl = "https://" + formattedUrl;
		}

		const payload = {
			destinationUrl: formattedUrl,
			customAlias: customAlias.trim() || undefined,
			utmSource: utmSource.trim() || undefined,
			utmMedium: utmMedium.trim() || undefined,
			utmCampaign: utmCampaign.trim() || undefined,
			utmTerm: utmTerm.trim() || undefined,
			utmContent: utmContent.trim() || undefined,
		};

		createUrlMutation.mutate(payload);
	};

	const shortUrlHref = createdResult
		? `http://localhost:8080/r/${createdResult.shortCode}`
		: "";

	const handleCopy = () => {
		if (shortUrlHref) {
			navigator.clipboard.writeText(shortUrlHref);
			setCopied(true);
			toast.success("Short URL copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleDialogClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-2.5">
						<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
							<IconLink className="size-4" />
						</div>
						<div>
							<DialogTitle>
								{createdResult
									? "Your Short Link is Ready!"
									: "Create Short URL"}
							</DialogTitle>
							<DialogDescription>
								{createdResult
									? "Link is live and routing traffic via API Gateway"
									: "Generate high-velocity shortcodes with automated telemetry"}
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{createdResult ? (
					/* Success View */
					<div className="space-y-4 py-2">
						<div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
									Active Short URL
								</span>
								<span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">
									<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
									Live on Gateway
								</span>
							</div>

							<div className="flex items-center justify-between gap-2 bg-background/80 border border-border p-2.5 rounded-lg">
								<span className="font-mono text-xs sm:text-sm font-semibold text-foreground truncate select-all">
									{shortUrlHref}
								</span>
								<Button
									size="sm"
									variant="outline"
									onClick={handleCopy}
									className="h-8 gap-1.5 text-xs cursor-pointer shrink-0"
								>
									{copied ? (
										<IconCheck className="size-3.5 text-emerald-500" />
									) : (
										<IconCopy className="size-3.5" />
									)}
									<span>{copied ? "Copied" : "Copy"}</span>
								</Button>
							</div>

							<div className="text-xs text-muted-foreground truncate">
								<span className="font-medium text-foreground">
									Target:
								</span>{" "}
								{createdResult.destinationUrl}
							</div>
						</div>

						<DialogFooter className="flex gap-2">
							{onOpenQrModal && (
								<Button
									variant="outline"
									onClick={() => {
										onOpenQrModal(shortUrlHref);
										handleDialogClose(false);
									}}
									className="gap-1.5 text-xs cursor-pointer"
								>
									<IconQrcode className="size-4" />
									<span>QR Code</span>
								</Button>
							)}
							<Button
								onClick={() => handleReset()}
								variant="default"
								className="gap-1.5 text-xs cursor-pointer"
							>
								<span>Create Another</span>
							</Button>
						</DialogFooter>
					</div>
				) : (
					/* Creation Form */
					<form onSubmit={handleSubmit} className="space-y-4 py-2">
						{/* Destination URL */}
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-foreground">
								Destination URL{" "}
								<span className="text-destructive">*</span>
							</label>
							<Input
								type="text"
								value={destinationUrl}
								onChange={(e) =>
									setDestinationUrl(e.target.value)
								}
								placeholder="https://example.com/long-landing-page"
								required
								className="h-9.5 text-xs sm:text-sm bg-muted/30"
							/>
						</div>

						{/* Custom Alias */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between text-xs">
								<label className="font-medium text-foreground">
									Custom Alias (Optional)
								</label>
								<span className="text-[11px] text-muted-foreground">
									Leave blank for auto Base62
								</span>
							</div>
							<div className="flex items-center rounded-lg border border-border bg-muted/30 px-3 h-9.5 focus-within:ring-2 focus-within:ring-ring">
								<span className="text-xs font-mono text-muted-foreground shrink-0 select-none">
									/r/
								</span>
								<input
									type="text"
									value={customAlias}
									onChange={(e) =>
										setCustomAlias(
											e.target.value
												.toLowerCase()
												.replace(/[^a-z0-9_-]/g, ""),
										)
									}
									placeholder="my-campaign-slug"
									className="w-full bg-transparent pl-1 text-xs sm:text-sm font-mono text-foreground outline-none"
								/>
							</div>
						</div>

						{/* Collapsible UTM Builder */}
						<div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3">
							<button
								type="button"
								onClick={() => setShowUtm(!showUtm)}
								className="flex w-full items-center justify-between text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
							>
								<span className="flex items-center gap-1.5">
									<IconAdjustments className="size-3.5" />
									<span>UTM Campaign Parameters</span>
								</span>
								<span className="text-[11px] text-muted-foreground">
									{showUtm ? "Hide" : "Add Tags"}
								</span>
							</button>

							{showUtm && (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
									<div className="space-y-1">
										<label className="text-[11px] text-muted-foreground">
											UTM Source
										</label>
										<Input
											type="text"
											value={utmSource}
											onChange={(e) =>
												setUtmSource(e.target.value)
											}
											placeholder="e.g. twitter, newsletter"
											className="h-8 text-xs bg-background"
										/>
									</div>
									<div className="space-y-1">
										<label className="text-[11px] text-muted-foreground">
											UTM Medium
										</label>
										<Input
											type="text"
											value={utmMedium}
											onChange={(e) =>
												setUtmMedium(e.target.value)
											}
											placeholder="e.g. cpc, email, social"
											className="h-8 text-xs bg-background"
										/>
									</div>
									<div className="space-y-1">
										<label className="text-[11px] text-muted-foreground">
											UTM Campaign
										</label>
										<Input
											type="text"
											value={utmCampaign}
											onChange={(e) =>
												setUtmCampaign(e.target.value)
											}
											placeholder="e.g. spring_launch"
											className="h-8 text-xs bg-background"
										/>
									</div>
									<div className="space-y-1">
										<label className="text-[11px] text-muted-foreground">
											UTM Content / Term
										</label>
										<Input
											type="text"
											value={utmContent}
											onChange={(e) =>
												setUtmContent(e.target.value)
											}
											placeholder="e.g. banner_top"
											className="h-8 text-xs bg-background"
										/>
									</div>
								</div>
							)}
						</div>

						<DialogFooter className="pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleDialogClose(false)}
								className="text-xs cursor-pointer"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={createUrlMutation.isPending}
								className="gap-2 text-xs font-medium cursor-pointer shadow-xs"
							>
								{createUrlMutation.isPending ? (
									<span>Creating...</span>
								) : (
									<>
										<IconSparkles className="size-3.5" />
										<span>Generate Short URL</span>
									</>
								)}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
