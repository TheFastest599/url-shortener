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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { parseApiError } from "@/lib/errorHandler";
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
	error = null,
}) {
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [clientError, setClientError] = React.useState("");

	const { fieldErrors: serverFieldErrors } = parseApiError(error);

	React.useEffect(() => {
		if (campaign) {
			setName(campaign.name || "");
			setDescription(campaign.description || "");
			setClientError("");
		}
	}, [campaign, open]);

	const handleSubmit = (e) => {
		e.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) {
			const msg = "Campaign name is required.";
			setClientError(msg);
			toast.error("Validation Error", { description: msg });
			return;
		}
		if (trimmedName.length < 2) {
			const msg = "Campaign name must be at least 2 characters long.";
			setClientError(msg);
			toast.error("Validation Error", { description: msg });
			return;
		}
		setClientError("");
		const payload = {
			name: trimmedName,
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
	const nameError = clientError || serverFieldErrors?.name;

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
					<Field className="gap-1.5">
						<FieldLabel className="text-xs font-semibold text-foreground">
							Campaign Name <span className="text-destructive">*</span>
						</FieldLabel>
						<Input
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								if (clientError) setClientError("");
							}}
							placeholder="e.g. Q4 Black Friday Launch"
							className="text-xs"
							required
							autoFocus
							aria-invalid={Boolean(nameError)}
						/>
						<FieldError>{nameError}</FieldError>
					</Field>

					<Field className="gap-1.5">
						<FieldLabel className="text-xs font-semibold text-foreground">
							Description
						</FieldLabel>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Goals, target channels, or campaign context..."
							className="text-xs min-h-[75px]"
							aria-invalid={Boolean(serverFieldErrors?.description)}
						/>
						<FieldError>{serverFieldErrors?.description}</FieldError>
					</Field>

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
