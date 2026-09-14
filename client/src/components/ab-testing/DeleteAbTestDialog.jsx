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

export function DeleteAbTestDialog({
	open,
	onOpenChange,
	shortCode,
	onConfirm,
	isDeleting = false,
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Remove A/B Test?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to dismantle the A/B split test on{" "}
						<span className="font-mono font-semibold text-foreground">
							/r/{shortCode}
						</span>
						? Traffic routing rules will be cleared and the short link will fall back to its primary destination URL.
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
						onClick={() => onConfirm(shortCode)}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
					>
						{isDeleting ? "Removing..." : "Remove Test"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default DeleteAbTestDialog;
