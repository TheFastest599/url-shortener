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
import { Badge } from "@/components/ui/badge";
import { IconEdit, IconScale, IconPlus, IconTrash } from "@tabler/icons-react";
import { UtmEditor } from "@/components/links/UtmEditor";
import { useUpdateAbTestMutation } from "@/queries/abTestingQueries";
import { toast } from "sonner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { validateUrl, parseApiError, showErrorToast } from "@/lib/errorHandler";

export function EditAbTestModal({
	open,
	onOpenChange,
	experiment,
	shortCode,
	onSubmit,
	isSubmitting = false,
	error = null,
}) {
	const [name, setName] = React.useState(experiment?.name || "");
	const [cookieDays, setCookieDays] = React.useState(
		experiment?.cookieTtlSeconds ? Math.round(experiment.cookieTtlSeconds / 86400) : 30
	);
	const [variants, setVariants] = React.useState(() =>
		(experiment?.variants || []).map((v, i) => ({
			key: v.key || (i === 0 ? "A" : "B"),
			destinationUrl: v.destinationUrl || v.url || "",
			weight: v.weight ?? 50,
			isControl: typeof v.isControl === "boolean" ? v.isControl : i === 0,
		}))
	);
	// Sync state whenever modal opens or experiment changes
	React.useEffect(() => {
		if (open && experiment) {
			setName(experiment.name || "");
			setCookieDays(
				experiment.cookieTtlSeconds
					? Math.round(experiment.cookieTtlSeconds / 86400)
					: 30
			);
			setVariants(
				(experiment.variants && experiment.variants.length > 0
					? experiment.variants
					: [
							{ key: "A", destinationUrl: "", weight: 50, isControl: true },
							{ key: "B", destinationUrl: "", weight: 50, isControl: false },
					  ]
				).map((v, i) => ({
					key: v.key || (i === 0 ? "A" : "B"),
					destinationUrl: v.destinationUrl || v.url || "",
					weight: v.weight ?? 50,
					isControl: typeof v.isControl === "boolean" ? v.isControl : i === 0,
				}))
			);
			setClientErrors({});
		}
	}, [open, experiment]);

	const defaultMutation = useUpdateAbTestMutation({
		onSuccess: () => {
			onOpenChange?.(false);
		},
	});

	const activeError = error || defaultMutation.error;
	const { fieldErrors: serverFieldErrors } = parseApiError(activeError);

	const isProcessing = isSubmitting || defaultMutation.isPending;

	const totalWeight = variants.reduce(
		(sum, v) => sum + (parseInt(v.weight, 10) || 0),
		0
	);
	const isWeightValid = totalWeight === 100;

	const handleVariantWeightChange = (index, value) => {
		if (value === "") {
			setVariants((prev) => {
				const updated = [...prev];
				updated[index] = { ...updated[index], weight: "" };
				return updated;
			});
			return;
		}
		const num = parseInt(value, 10);
		if (!isNaN(num)) {
			const clamped = Math.max(0, Math.min(100, num));
			setVariants((prev) => {
				const updated = [...prev];
				updated[index] = { ...updated[index], weight: clamped };
				return updated;
			});
		}
	};

	const handleVariantWeightBlur = (index) => {
		setVariants((prev) => {
			const updated = [...prev];
			const current = updated[index]?.weight;
			const fallback = current === "" || isNaN(current) ? 0 : Math.max(0, Math.min(100, Number(current)));
			updated[index] = { ...updated[index], weight: fallback };
			return updated;
		});
	};

	const handleCookieDaysChange = (value) => {
		if (value === "") {
			setCookieDays("");
			return;
		}
		const num = parseInt(value, 10);
		if (!isNaN(num)) {
			setCookieDays(Math.max(1, Math.min(365, num)));
		}
	};

	const handleCookieDaysBlur = () => {
		setCookieDays((prev) =>
			prev === "" || isNaN(prev) ? 30 : Math.max(1, Math.min(365, Number(prev)))
		);
	};

	const handleEqualSplit = () => {
		const count = variants.length;
		if (count === 0) return;
		const base = Math.floor(100 / count);
		const remainder = 100 - base * count;

		setVariants((prev) =>
			prev.map((v, i) => ({
				...v,
				weight: i === 0 ? base + remainder : base,
			}))
		);
	};

	const handleAddVariant = () => {
		if (variants.length >= 4) {
			toast.info("Maximum of 4 variants allowed per experiment");
			return;
		}
		const keys = ["A", "B", "C", "D"];
		const nextKey = keys[variants.length] || `V${variants.length + 1}`;
		setVariants((prev) => [
			...prev,
			{ key: nextKey, destinationUrl: "", weight: 0, isControl: false },
		]);
	};

	const handleRemoveVariant = (index) => {
		if (variants.length <= 2) {
			toast.info("At least two variants are required for an A/B test");
			return;
		}
		setVariants((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const errors = {};

		if (!name.trim()) {
			errors.name = "Experiment name is required.";
		}
		if (!isWeightValid) {
			errors.weight = `Variant weights must sum to exactly 100% (currently: ${totalWeight}%).`;
		}

		const validatedVariants = [];
		for (const v of variants) {
			const urlVal = validateUrl(v.destinationUrl);
			if (!urlVal.isValid) {
				errors[`variant_${v.key}`] = `Variant ${v.key}: ${urlVal.error}`;
			} else {
				validatedVariants.push({
					key: v.key,
					destinationUrl: urlVal.formattedUrl,
					weight: parseInt(v.weight, 10) || 0,
					isControl: !!v.isControl,
				});
			}
		}

		if (Object.keys(errors).length > 0) {
			setClientErrors(errors);
			const firstError = Object.values(errors)[0];
			toast.error("Validation Error", { description: firstError });
			return;
		}

		setClientErrors({});
		const cookieDaysNum = parseInt(cookieDays, 10) || 30;
		const payload = {
			name: name.trim(),
			cookieTtlSeconds: cookieDaysNum * 86400,
			variants: validatedVariants,
		};

		const targetId = experiment?.id;
		const targetCode = experiment?.shortCode || shortCode;

		if (typeof onSubmit === "function") {
			onSubmit({
				id: targetId,
				shortCode: targetCode,
				payload,
			});
		} else if (targetId) {
			defaultMutation.mutate({
				id: targetId,
				payload,
			});
		} else {
			toast.error("Unable to update", { description: "Experiment ID is missing." });
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
				<form onSubmit={handleSubmit} className="space-y-4">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<IconEdit className="size-5 text-primary" />
							<span>Edit A/B Experiment: {experiment?.shortCode || shortCode}</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							Modify destination URLs, adjust traffic split weights, or change session stickiness.
						</DialogDescription>
					</DialogHeader>

					{/* Experiment Basic Details */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<Field className="sm:col-span-2 gap-1.5">
							<FieldLabel className="text-xs font-semibold text-foreground">
								Experiment Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									if (clientErrors.name) setClientErrors((prev) => ({ ...prev, name: null }));
								}}
								placeholder="e.g. Landing Page Headline Test"
								className="text-xs"
								required
								aria-invalid={Boolean(clientErrors.name || serverFieldErrors?.name)}
							/>
							<FieldError>{clientErrors.name || serverFieldErrors?.name}</FieldError>
						</Field>

						<Field className="gap-1.5">
							<FieldLabel className="text-xs font-semibold text-foreground">
								Cookie Stickiness
							</FieldLabel>
							<div className="flex items-center gap-1.5">
								<Input
									type="number"
									min="1"
									max="365"
									value={cookieDays}
									onChange={(e) => handleCookieDaysChange(e.target.value)}
									onBlur={handleCookieDaysBlur}
									className="text-xs"
								/>
								<span className="text-muted-foreground shrink-0 text-xs">days</span>
							</div>
						</Field>
					</div>

					{/* Variants */}
					<div className="space-y-3 pt-2 border-t border-border/50">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="font-semibold uppercase tracking-wider text-foreground text-xs">
									Test Variants
								</span>
								<Badge
									variant={isWeightValid ? "default" : "destructive"}
									className="text-[10px]"
								>
									Total: {totalWeight}% / 100%
								</Badge>
							</div>

							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={handleEqualSplit}
									className="h-7 text-xs gap-1 cursor-pointer"
								>
									<IconScale className="size-3" />
									<span>Equal Split</span>
								</Button>

								{variants.length < 4 && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleAddVariant}
										className="h-7 text-xs gap-1 cursor-pointer"
									>
										<IconPlus className="size-3" />
										<span>Add Variant</span>
									</Button>
								)}
							</div>
						</div>

						{clientErrors.weight && (
							<p className="text-[11px] font-medium text-destructive">
								{clientErrors.weight}
							</p>
						)}

						<div className="space-y-2.5">
							{variants.map((v, index) => {
								const variantErr = clientErrors[`variant_${v.key}`];
								return (
									<div
										key={v.key}
										className="p-3 rounded-xl border border-border/70 bg-card space-y-2"
									>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<Badge
													variant={v.isControl ? "default" : "outline"}
													className="text-xs font-bold"
												>
													Variant {v.key}
												</Badge>
												{v.isControl && (
													<span className="text-[10px] font-medium text-primary">
														(Control / Default)
													</span>
												)}
											</div>

											<div className="flex items-center gap-2">
												<div className="flex items-center gap-1">
													<span className="text-muted-foreground text-[11px]">Weight:</span>
													<Input
														type="number"
														min="0"
														max="100"
														value={v.weight}
														onChange={(e) =>
															handleVariantWeightChange(index, e.target.value)
														}
														onBlur={() => handleVariantWeightBlur(index)}
														className="w-16 h-7 text-xs text-center"
													/>
													<span className="text-muted-foreground text-xs">%</span>
												</div>

												{variants.length > 2 && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => handleRemoveVariant(index)}
														className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
													>
														<IconTrash className="size-3.5" />
													</Button>
												)}
											</div>
										</div>

										<Field className="gap-1">
											<Input
												value={v.destinationUrl}
												onChange={(e) => {
													const val = e.target.value;
													setVariants((prev) => {
														const upd = [...prev];
														upd[index] = { ...upd[index], destinationUrl: val };
														return upd;
													});
													if (clientErrors[`variant_${v.key}`]) {
														setClientErrors((prev) => ({ ...prev, [`variant_${v.key}`]: null }));
													}
												}}
												placeholder={`https://mysite.com/variant-${v.key.toLowerCase()}`}
												className="text-xs font-mono"
												required
												aria-invalid={Boolean(variantErr)}
											/>
											<FieldError>{variantErr}</FieldError>
											<UtmEditor
												url={v.destinationUrl}
												onChange={(newUrl) => {
													setVariants((prev) => {
														const upd = [...prev];
														upd[index] = { ...upd[index], destinationUrl: newUrl };
														return upd;
													});
												}}
												compact
											/>
										</Field>
									</div>
								);
							})}
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							className="text-xs cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							disabled={isProcessing || !isWeightValid}
							className="text-xs font-semibold cursor-pointer"
						>
							{isProcessing ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default EditAbTestModal;
