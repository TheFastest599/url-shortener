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
import { Badge } from "@/components/ui/badge";
import { IconTrophy } from "@tabler/icons-react";

export function PromoteWinnerDialog({
	open,
	onOpenChange,
	experiment,
	shortCode,
	onConfirm,
	isSubmitting = false,
}) {
	const variants = experiment?.variants || [];
	const [selectedKey, setSelectedKey] = React.useState("");

	React.useEffect(() => {
		if (variants.length > 0) {
			setSelectedKey(variants[0].key);
		}
	}, [experiment, open]);

	const handleConfirm = () => {
		if (!selectedKey) return;
		onConfirm({
			shortCode,
			winningVariant: selectedKey,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<IconTrophy className="size-5 text-amber-500" />
						<span>Promote Winning Variant</span>
					</DialogTitle>
					<DialogDescription className="text-xs">
						Conclude this experiment and redirect 100% of future traffic to the selected winning variant URL.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-2">
					<label className="text-xs font-semibold text-foreground">
						Select the Outperforming Variant:
					</label>

					<div className="space-y-2">
						{variants.map((v) => (
							<label
								key={v.key}
								className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
									selectedKey === v.key
										? "border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/30"
										: "border-border/70 bg-card hover:bg-muted/30"
								}`}
							>
								<div className="flex items-center gap-2.5 min-w-0">
									<input
										type="radio"
										name="winning_variant"
										value={v.key}
										checked={selectedKey === v.key}
										onChange={() => setSelectedKey(v.key)}
										className="size-4 text-amber-500 focus:ring-amber-500"
									/>
									<div className="min-w-0">
										<div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
											<span>Variant {v.key}</span>
											{v.isControl && (
												<Badge variant="outline" className="text-[10px]">
													Control
												</Badge>
											)}
										</div>
										<div
											className="text-[11px] text-muted-foreground truncate max-w-xs font-mono"
											title={v.destinationUrl || v.url}
										>
											{v.destinationUrl || v.url}
										</div>
									</div>
								</div>
								<div className="font-mono text-xs font-bold text-muted-foreground shrink-0">
									{v.weight}% split
								</div>
							</label>
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
						size="sm"
						onClick={handleConfirm}
						disabled={isSubmitting || !selectedKey}
						className="text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
					>
						{isSubmitting ? "Promoting..." : `Promote Variant ${selectedKey}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default PromoteWinnerDialog;
