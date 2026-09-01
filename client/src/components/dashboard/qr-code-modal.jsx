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
import {
	IconQrcode,
	IconDownload,
	IconCopy,
	IconCheck,
	IconExternalLink,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function QrCodeModal({ open, onOpenChange, url }) {
	const [copied, setCopied] = React.useState(false);

	if (!url) return null;

	const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
		url,
	)}&margin=10`;

	const handleCopy = () => {
		navigator.clipboard.writeText(url);
		setCopied(true);
		toast.success("Short URL copied");
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = async () => {
		try {
			const response = await fetch(qrImageUrl);
			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = `qrcode-${Date.now()}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(blobUrl);
			toast.success("QR Code downloaded");
		} catch {
			window.open(qrImageUrl, "_blank");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md text-center">
				<DialogHeader>
					<div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 mb-1">
						<IconQrcode className="size-5" />
					</div>
					<DialogTitle className="text-center">
						Scan or Download QR Code
					</DialogTitle>
					<DialogDescription className="text-center">
						Share this QR code for print materials, packaging, and
						digital displays
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center justify-center py-4 space-y-4">
					<div className="p-3 bg-white rounded-2xl shadow-md border border-border">
						<img
							src={qrImageUrl}
							alt="QR Code"
							className="size-52 sm:size-60 object-contain rounded-lg"
							loading="lazy"
						/>
					</div>

					<div className="flex items-center justify-between gap-2 w-full max-w-sm bg-muted/40 border border-border p-2 rounded-lg text-xs font-mono">
						<span className="truncate text-foreground select-all">
							{url}
						</span>
						<Button
							size="sm"
							variant="ghost"
							onClick={handleCopy}
							className="h-7 size-7 p-0 shrink-0 cursor-pointer"
						>
							{copied ? (
								<IconCheck className="size-3.5 text-emerald-500" />
							) : (
								<IconCopy className="size-3.5" />
							)}
						</Button>
					</div>
				</div>

				<DialogFooter className="flex sm:justify-between gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.open(url, "_blank")}
						className="gap-1.5 text-xs cursor-pointer"
					>
						<IconExternalLink className="size-3.5" />
						<span>Visit URL</span>
					</Button>
					<Button
						variant="default"
						size="sm"
						onClick={handleDownload}
						className="gap-1.5 text-xs cursor-pointer shadow-xs"
					>
						<IconDownload className="size-3.5" />
						<span>Download PNG</span>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
