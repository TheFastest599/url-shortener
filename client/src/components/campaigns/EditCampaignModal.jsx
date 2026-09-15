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
import { Textarea } from "@/components/ui/textarea";
import { IconPencil } from "@tabler/icons-react";
import { toast } from "sonner";

export function EditCampaignModal({
	campaign,
	open,
	onOpenChange,
	onSubmit,
	onSave,
	isSubmitting = false,
	isSaving = false,
}) {
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");

	React.useEffect(() => {
		if (campaign) {
			setName(campaign.name || "");
			setDescription(campaign.description || "");
		}
	}, [campaign, open]);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error("Campaign name is required");
			return;
		}
		const payload = {
			name: name.trim(),
			description: description.trim() || null,
		};
		if (onSubmit) {
			onSubmit({
				id: campaign.id,
				payload,
			});
		} else if (onSave) {
			onSave(payload);
		}
	};

	const pending = isSubmitting || isSaving;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<IconPencil className="size-5 text-primary" />
						<span>Edit Campaign</span>
					</DialogTitle>
					<DialogDescription className="text-xs">
						Update the campaign details. Existing associated links will remain preserved.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-foreground">
							Campaign Name <span className="text-destructive">*</span>
						</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Q4 Black Friday Launch"
							className="text-xs"
							required
							autoFocus
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-xs font-semibold text-foreground">Description</label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Goals, target channels, or campaign context..."
							className="text-xs min-h-[75px]"
						/>
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
							disabled={pending || !name.trim()}
							className="text-xs font-semibold cursor-pointer"
						>
							{pending ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default EditCampaignModal;
