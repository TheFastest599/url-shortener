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
import { SearchCombobox } from "@/components/ui/search-combobox";
import { IconFlask, IconPlus, IconTrash, IconScale } from "@tabler/icons-react";
import { toast } from "sonner";

export function CreateAbTestModal({
	open,
	onOpenChange,
	candidateUrls = [],
	onSearchUrls,
	onSubmit,
	isSubmitting = false,
}) {
	const [shortCode, setShortCode] = React.useState("");
	const [name, setName] = React.useState("");
	const [cookieDays, setCookieDays] = React.useState(30);
	const [variants, setVariants] = React.useState([
		{ key: "A", destinationUrl: "", weight: 50, isControl: true },
		{ key: "B", destinationUrl: "", weight: 50, isControl: false },
	]);

	React.useEffect(() => {
		if (open) {
			setShortCode("");
			setName("");
			setCookieDays(30);
			setVariants([
				{ key: "A", destinationUrl: "", weight: 50, isControl: true },
				{ key: "B", destinationUrl: "", weight: 50, isControl: false },
			]);
		}
	}, [open]);

	// Auto-fill Variant A destinationUrl when candidate shortCode is selected
	const handleSelectShortCode = (val) => {
		setShortCode(val);
		const matched = candidateUrls.find((u) => u.shortCode === val || u.id === val);
		if (matched) {
			setVariants((prev) => [
				{ ...prev[0], destinationUrl: matched.destinationUrl },
				...prev.slice(1),
			]);
			if (!name.trim()) {
				setName(`Experiment for /r/${matched.shortCode}`);
			}
		}
	};

	const totalWeight = variants.reduce(
		(sum, v) => sum + (parseInt(v.weight, 10) || 0),
		0
	);
	const isWeightValid = totalWeight === 100;

	const handleVariantWeightChange = (index, value) => {
		const parsed = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
		setVariants((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], weight: parsed };
			return updated;
		});
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
		if (!shortCode.trim()) {
			toast.error("Please select a short link to test");
			return;
		}
		if (!name.trim()) {
			toast.error("Experiment name is required");
			return;
		}
		if (!isWeightValid) {
			toast.error(`Variant weights must sum to exactly 100% (currently: ${totalWeight}%)`);
			return;
		}
		for (const v of variants) {
			if (!v.destinationUrl.trim()) {
				toast.error(`Destination URL for Variant ${v.key} is required`);
				return;
			}
		}

		onSubmit({
			shortCode: shortCode.trim(),
			payload: {
				name: name.trim(),
				cookieTtlSeconds: (parseInt(cookieDays, 10) || 30) * 86400,
				variants: variants.map((v) => ({
					key: v.key,
					destinationUrl: v.destinationUrl.trim(),
					weight: parseInt(v.weight, 10),
					isControl: !!v.isControl,
				})),
			},
		});
	};

	const comboboxItems = candidateUrls.map((u) => ({
		value: u.shortCode,
		label: `/r/${u.shortCode}`,
		sub: u.destinationUrl,
		badge: "Candidate",
	}));

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<IconFlask className="size-5 text-primary" />
						<span>Configure New A/B Split Test</span>
					</DialogTitle>
					<DialogDescription className="text-xs">
						Turn an existing short URL into a traffic split experiment. Visitors will be consistently routed via stickiness cookies.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
					{/* Target Short Link */}
					<div className="space-y-1.5">
						<label className="font-semibold text-foreground">
							Select Short Link to Test <span className="text-destructive">*</span>
						</label>
						<SearchCombobox
							items={comboboxItems}
							value={shortCode}
							onValueChange={handleSelectShortCode}
							onSearchChange={onSearchUrls}
							placeholder="Search links by code or destination..."
							emptyMessage="No available non-testing URLs found."
						/>
					</div>

					{/* Experiment Title & Stickiness */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div className="sm:col-span-2 space-y-1.5">
							<label className="font-semibold text-foreground">
								Experiment Name <span className="text-destructive">*</span>
							</label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Hero CTA Copy Optimization"
								className="text-xs"
								required
							/>
						</div>

						<div className="space-y-1.5">
							<label className="font-semibold text-foreground">Cookie Stickiness</label>
							<div className="flex items-center gap-1.5">
								<Input
									type="number"
									min="1"
									max="365"
									value={cookieDays}
									onChange={(e) => setCookieDays(e.target.value)}
									className="text-xs"
								/>
								<span className="text-muted-foreground shrink-0">days</span>
							</div>
						</div>
					</div>

					{/* Variant Configuration */}
					<div className="space-y-3 pt-2 border-t border-border/50">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="font-semibold uppercase tracking-wider text-foreground">
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
									className="text-[11px] h-7 gap-1 cursor-pointer"
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
										className="text-[11px] h-7 gap-1 cursor-pointer"
									>
										<IconPlus className="size-3" />
										<span>Add Variant</span>
									</Button>
								)}
							</div>
						</div>

						<div className="space-y-2.5">
							{variants.map((v, index) => (
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
													className="w-16 h-7 text-xs text-center"
												/>
												<span className="text-muted-foreground">%</span>
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

									<div>
										<Input
											value={v.destinationUrl}
											onChange={(e) => {
												const val = e.target.value;
												setVariants((prev) => {
													const upd = [...prev];
													upd[index] = { ...upd[index], destinationUrl: val };
													return upd;
												});
											}}
											placeholder={`https://mysite.com/variant-${v.key.toLowerCase()}`}
											className="text-xs font-mono"
											required
										/>
									</div>
								</div>
							))}
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
							disabled={isSubmitting || !isWeightValid}
							className="text-xs font-semibold cursor-pointer"
						>
							{isSubmitting ? "Configuring..." : "Launch A/B Test"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default CreateAbTestModal;
