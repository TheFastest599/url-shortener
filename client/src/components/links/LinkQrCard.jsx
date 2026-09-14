import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconQrcode, IconDownload } from "@tabler/icons-react";
import { toast } from "sonner";

export function LinkQrCard({ shortCode, onOpenQrModal }) {
	const fullShortUrl = `${window.location.origin}/r/${shortCode}`;
	const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
		fullShortUrl
	)}&margin=12`;

	const handleDownloadQr = async () => {
		try {
			const response = await fetch(qrImageUrl);
			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = `qr-${shortCode}.png`;
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
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
					<span>QR Code</span>
					<IconQrcode className="size-4 text-primary" />
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-2 flex flex-col items-center text-center space-y-3">
				<div className="p-2.5 bg-white rounded-xl shadow-2xs border border-border/80">
					<img
						src={qrImageUrl}
						alt={`QR Code for /r/${shortCode}`}
						className="size-36 object-contain"
						loading="lazy"
					/>
				</div>
				<p className="text-[11px] text-muted-foreground leading-snug">
					Scan directly or download high-res PNG for marketing materials.
				</p>
				<div className="flex items-center gap-2 w-full pt-1">
					<Button
						variant="outline"
						size="sm"
						onClick={handleDownloadQr}
						className="flex-1 h-8 gap-1.5 text-xs cursor-pointer shadow-2xs"
					>
						<IconDownload className="size-3.5" />
						<span>Download PNG</span>
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => onOpenQrModal?.(fullShortUrl)}
						className="h-8 text-xs cursor-pointer shadow-2xs"
					>
						<span>Expand</span>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export default LinkQrCard;
