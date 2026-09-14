import * as React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	IconTag,
	IconAdjustments,
	IconChartBar,
	IconCopy,
	IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function CampaignUtmTable({ links = [] }) {
	const [copiedId, setCopiedId] = React.useState(null);

	const handleCopy = (text, id) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		toast.success("Copied to clipboard");
		setTimeout(() => setCopiedId(null), 2000);
	};

	return (
		<Card className="border-border/70 bg-card overflow-hidden shadow-xs">
			<div className="overflow-x-auto">
				<table className="w-full text-left text-xs border-collapse">
					<thead>
						<tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-medium">
							<th className="py-3 px-4">Campaign Name</th>
							<th className="py-3 px-4">Source / Medium</th>
							<th className="py-3 px-4">Short Code</th>
							<th className="py-3 px-4 text-center">Clicks</th>
							<th className="py-3 px-4 text-right">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border/50">
						{links.length > 0 ? (
							links.map((link) => {
								const id = link.id || link.shortCode;
								const shortUrl = `${window.location.origin}/r/${link.shortCode}`;

								return (
									<tr key={id} className="hover:bg-muted/30 transition-colors">
										<td className="py-3.5 px-4 font-semibold text-foreground">
											<div className="flex items-center gap-1.5">
												<IconTag className="size-3.5 text-primary" />
												<span>{link.utmCampaign}</span>
											</div>
										</td>
										<td className="py-3.5 px-4">
											<div className="flex items-center gap-1.5">
												<Badge variant="outline" className="text-[10px] font-mono">
													{link.utmSource}
												</Badge>
												<span className="text-muted-foreground">/</span>
												<Badge variant="secondary" className="text-[10px] font-mono">
													{link.utmMedium}
												</Badge>
											</div>
										</td>
										<td className="py-3.5 px-4 font-mono">
											<Link
												to={`/redirect-links/${link.shortCode}`}
												className="font-semibold text-primary hover:underline transition-colors"
												title="Configure link"
											>
												/r/{link.shortCode}
											</Link>
										</td>
										<td className="py-3.5 px-4 text-center font-mono">
											<Badge variant="secondary">{link.clickCount ?? 0}</Badge>
										</td>
										<td className="py-3.5 px-4 text-right">
											<div className="flex items-center justify-end gap-1.5">
												<Link
													to={`/redirect-links/${link.shortCode}`}
													className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
													title="Configure link"
												>
													<IconAdjustments className="size-3.5" />
												</Link>
												<Link
													to={`/analytics/${link.shortCode}`}
													className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-primary transition-colors cursor-pointer"
													title="View telemetry"
												>
													<IconChartBar className="size-3.5" />
												</Link>
												<button
													onClick={() => handleCopy(shortUrl, id)}
													className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
													title="Copy short link"
												>
													{copiedId === id ? (
														<IconCheck className="size-3.5 text-emerald-500" />
													) : (
														<IconCopy className="size-3.5" />
													)}
												</button>
											</div>
										</td>
									</tr>
								);
							})
						) : (
							<tr>
								<td colSpan={5} className="py-10 text-center text-muted-foreground">
									<IconTag className="size-8 mx-auto text-muted-foreground/50 mb-2" />
									<p className="font-semibold text-foreground">No UTM Links Detected</p>
									<p className="text-xs max-w-sm mx-auto mt-1">
										Use the UTM Builder above to construct campaign-tagged short links.
									</p>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

export default CampaignUtmTable;
