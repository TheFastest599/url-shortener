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
import {
	Field,
	FieldLabel,
	FieldDescription,
	FieldError,
} from "@/components/ui/field";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { useCreateUrlMutation, useCampaignsQuery } from "@/queries";
import {
	IconLink,
	IconSparkles,
	IconCheck,
	IconCopy,
	IconQrcode,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { UtmEditor } from "@/components/links/UtmEditor";
import { getShortUrl, getShortDomainPrefix } from "@/config/constants";
import {
	validateUrl,
	validateCustomAlias,
	parseApiError,
	showErrorToast,
} from "@/lib/errorHandler";

export function CreateLinkModal({
	open,
	onOpenChange,
	onOpenQrModal,
	initialDestinationUrl = "",
	initialCampaignId = "",
}) {
	const [campaignSearch, setCampaignSearch] = React.useState("");
	const [debouncedCampaignSearch, setDebouncedCampaignSearch] =
		React.useState("");

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedCampaignSearch(campaignSearch);
		}, 250);
		return () => clearTimeout(timer);
	}, [campaignSearch]);

	const { data: campaignsData, isLoading: isCampaignsLoading } =
		useCampaignsQuery(
			{
				page: 0,
				size: 20,
				search: debouncedCampaignSearch.trim() || undefined,
				sortBy: "name",
				direction: "ASC",
			},
			{ enabled: !!open },
		);

	const campaigns = Array.isArray(campaignsData)
		? campaignsData
		: campaignsData?.content || [];

	const [destinationUrl, setDestinationUrl] = React.useState(
		initialDestinationUrl,
	);
	const [prevInitialUrl, setPrevInitialUrl] = React.useState(
		initialDestinationUrl,
	);

	if (initialDestinationUrl !== prevInitialUrl) {
		setPrevInitialUrl(initialDestinationUrl);
		setDestinationUrl(initialDestinationUrl);
	}

	const [customAlias, setCustomAlias] = React.useState(
		initialCampaignId ? "" : "",
	);
	const [selectedCampaignId, setSelectedCampaignId] = React.useState(
		initialCampaignId || "",
	);

	React.useEffect(() => {
		if (open && initialCampaignId) {
			setSelectedCampaignId(initialCampaignId);
		}
	}, [open, initialCampaignId]);

	const [createdResult, setCreatedResult] = React.useState(null);
	const [copied, setCopied] = React.useState(false);
	const [clientErrors, setClientErrors] = React.useState({});

	const createUrlMutation = useCreateUrlMutation({
		onSuccess: (data) => {
			setCreatedResult(data);
			setClientErrors({});
			toast.success("Short URL created successfully!");
		},
	});

	const { fieldErrors: serverFieldErrors } = parseApiError(
		createUrlMutation.error,
	);

	const handleReset = () => {
		setDestinationUrl("");
		setCustomAlias("");
		setSelectedCampaignId(initialCampaignId || "");
		setCampaignSearch("");
		setDebouncedCampaignSearch("");
		setCreatedResult(null);
		setCopied(false);
		setClientErrors({});
	};

	const handleDialogClose = (newOpen) => {
		if (!newOpen) {
			handleReset();
		}
		onOpenChange(newOpen);
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		const urlValidation = validateUrl(destinationUrl);
		const aliasValidation = validateCustomAlias(customAlias);

		const newErrors = {};
		if (!urlValidation.isValid) {
			newErrors.destinationUrl = urlValidation.error;
		}
		if (!aliasValidation.isValid) {
			newErrors.customAlias = aliasValidation.error;
		}

		if (Object.keys(newErrors).length > 0) {
			setClientErrors(newErrors);
			const firstError = Object.values(newErrors)[0];
			toast.error("Validation Error", { description: firstError });
			return;
		}
		setClientErrors({});

		const payload = {
			destinationUrl: urlValidation.formattedUrl,
			customAlias: customAlias.trim() || undefined,
			campaignId: selectedCampaignId || undefined,
		};

		createUrlMutation.mutate(payload);
	};

	const shortUrlHref = createdResult
		? getShortUrl(createdResult.shortCode)
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
						<div className="rounded-xl border border-chart-2/30 bg-chart-2/10 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold text-chart-2 uppercase tracking-wider">
									Active Short URL
								</span>
								<span className="inline-flex items-center gap-1.5 text-xs text-chart-2 font-mono font-medium">
									<span className="size-2 rounded-full bg-chart-2 animate-pulse" />
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
										<IconCheck className="size-3.5 text-chart-2" />
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
						<Field>
							<FieldLabel>
								Destination URL{" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								type="text"
								value={destinationUrl}
								onChange={(e) => {
									setDestinationUrl(e.target.value);
									if (clientErrors.destinationUrl) {
										setClientErrors((prev) => ({
											...prev,
											destinationUrl: null,
										}));
									}
								}}
								placeholder="https://example.com/long-landing-page"
								required
								aria-invalid={Boolean(
									clientErrors.destinationUrl ||
										serverFieldErrors.destinationUrl,
								)}
								className="h-9.5 text-xs sm:text-sm bg-muted/30"
							/>
							<FieldError>
								{clientErrors.destinationUrl ||
									serverFieldErrors.destinationUrl}
							</FieldError>
						</Field>

						{/* Custom Alias */}
						<Field>
							<div className="flex items-center justify-between text-xs">
								<FieldLabel>
									Custom Alias (Optional)
								</FieldLabel>
								<FieldDescription>
									Leave blank for auto Base62
								</FieldDescription>
							</div>
							<div
								className={`flex items-center rounded-lg border bg-muted/30 px-3 h-9.5 focus-within:ring-2 focus-within:ring-ring ${
									Boolean(
										clientErrors.customAlias ||
											serverFieldErrors.customAlias,
									)
										? "border-destructive ring-2 ring-destructive/20"
										: "border-border"
								}`}
							>
								<span className="text-xs font-mono text-muted-foreground shrink-0 select-none">
									{getShortDomainPrefix()}
								</span>
								<input
									type="text"
									value={customAlias}
									maxLength={64}
									onChange={(e) => {
										setCustomAlias(
											e.target.value
												.toLowerCase()
												.replace(/[^a-z0-9_-]/g, ""),
										);
										if (clientErrors.customAlias) {
											setClientErrors((prev) => ({
												...prev,
												customAlias: null,
											}));
										}
									}}
									placeholder="my-slug"
									className="w-full bg-transparent pl-1 text-xs sm:text-sm font-mono text-foreground outline-none"
								/>
							</div>
							<FieldError>
								{clientErrors.customAlias ||
									serverFieldErrors.customAlias}
							</FieldError>
						</Field>

						{/* Optional Campaign Assignment */}
						<div className="space-y-1.5">
							<label className="text-xs font-medium text-foreground">
								Assign to Campaign (Optional)
							</label>
							<SearchCombobox
								items={[
									{
										value: "",
										label: "No Campaign (Standalone URL)",
										description: "Leave unattached",
									},
									...campaigns.map((c) => ({
										value: c.id,
										label: c.name,
										description: c.description || "",
										badge: "Campaign",
									})),
								]}
								value={selectedCampaignId}
								onValueChange={(val) =>
									setSelectedCampaignId(val || "")
								}
								placeholder="Search campaigns..."
								emptyMessage="No campaigns found."
								onSearchChange={setCampaignSearch}
								isLoading={isCampaignsLoading}
								remote={true}
							/>
						</div>

						{/* Unified Live UTM Editor */}
						<UtmEditor
							url={destinationUrl}
							onChange={setDestinationUrl}
						/>

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
