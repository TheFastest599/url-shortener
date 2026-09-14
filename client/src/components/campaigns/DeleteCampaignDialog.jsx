import * as React from "react";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function DeleteCampaignDialog({
	campaign,
	open,
	onOpenChange,
	onConfirm,
	isDeleting = false,
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete{" "}
						<span className="font-semibold text-foreground">
							"{campaign?.name}"
						</span>
						? All associated short links will remain active, but will no longer be grouped under this campaign.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onConfirm(campaign?.id)}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
					>
						{isDeleting ? "Deleting..." : "Delete Campaign"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default DeleteCampaignDialog;
