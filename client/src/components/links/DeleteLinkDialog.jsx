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

export function DeleteLinkDialog({
	open,
	onOpenChange,
	url,
	onConfirm,
	isDeleting = false,
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Short URL?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to permanently delete{" "}
						<span className="font-mono font-bold text-foreground">
							/r/{url?.shortCode}
						</span>
						? This will immediately terminate all incoming traffic and analytics collection for this slug.
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
						onClick={() => onConfirm(url)}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
					>
						{isDeleting ? "Deleting..." : "Delete Permanently"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default DeleteLinkDialog;
