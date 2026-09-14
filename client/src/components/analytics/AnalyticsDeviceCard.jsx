import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IconDeviceDesktop, IconBrowser } from "@tabler/icons-react";

export function AnalyticsDeviceCard({ browsers = [], totalClicks = 0 }) {
	return (
		<Card className="border-border/70 bg-card shadow-xs">
			<CardHeader className="p-4 sm:p-5 pb-2">
				<CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
					<IconDeviceDesktop className="size-4 text-primary" />
					<span>Browsers & User Agents</span>
				</CardTitle>
				<CardDescription className="text-xs">
					Client browser platforms identified from User-Agent headers.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-4 sm:p-5 pt-2">
				{browsers.length > 0 ? (
					<div className="space-y-3">
						{browsers.slice(0, 6).map((b) => {
							const clicks = b.count || b.clickCount || 0;
							const name = b.browser || b.name || "Other";
							const percent = totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;

							return (
								<div key={name} className="space-y-1 text-xs">
									<div className="flex justify-between items-center">
										<span className="font-medium text-foreground flex items-center gap-1.5">
											<IconBrowser className="size-3 text-muted-foreground" />
											<span>{name}</span>
										</span>
										<div className="font-mono text-muted-foreground">
											<span className="font-semibold text-foreground">{clicks}</span> ({percent}%)
										</div>
									</div>
									<Progress value={percent} className="h-1.5" />
								</div>
							);
						})}
					</div>
				) : (
					<div className="py-8 text-center text-xs text-muted-foreground space-y-1">
						<IconDeviceDesktop className="size-6 mx-auto opacity-30" />
						<p>No browser telemetry recorded yet.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default AnalyticsDeviceCard;
