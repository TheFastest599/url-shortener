/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import * as React from "react";
import { IconCheck, IconX, IconSparkles } from "@tabler/icons-react";

/**
 * Hallmark · Feature Comparison Matrix
 * Honest, clear evaluation of HiClickMe vs Legacy Shorteners and Spreadsheets.
 */
export function ComparisonSection() {
	const rows = [
		{
			feature: "Branded Shortlinks & Custom Slugs",
			hiclickme: "Included on free tier",
			legacy: "Locked behind expensive tiers",
			manual: "Requires custom DNS setup",
		},
		{
			feature: "Dynamic QR Codes (Editable Destination)",
			hiclickme: "Yes, update anytime without reprinting",
			legacy: "Static only or high monthly cost",
			manual: "Separate third-party generators",
		},
		{
			feature: "Campaign Folder Organization",
			hiclickme: "Group multiple links under initiatives",
			legacy: "Unsorted flat lists with loose tags",
			manual: "Messy spreadsheets with multiple tabs",
		},
		{
			feature: "Automated UTM Parameter Builder",
			hiclickme: "1-Click source/medium/campaign tagging",
			legacy: "Manual entry or paid add-on",
			manual: "Copy-paste prone to typos",
		},
		{
			feature: "Zero-Flicker Server-Side A/B Testing",
			hiclickme: "Instant edge split with no page flash",
			legacy: "Not available",
			manual: "Requires heavy client JavaScript",
		},
		{
			feature: "30-Day Sticky Session Guarantee",
			hiclickme: "Consistent visitor variant assignment",
			legacy: "Not available",
			manual: "Inconsistent or missing",
		},
		{
			feature: "Bot & Scraper Filtering",
			hiclickme: "Automatic crawler isolation",
			legacy: "Varies by tier",
			manual: "Inflated raw click counts",
		},
	];

	return (
		<section className="py-20 sm:py-28 border-t border-border/50 bg-background relative">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="max-w-3xl mx-auto text-center space-y-3 mb-14 sm:mb-18">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
						<IconSparkles className="size-3.5" />
						<span>The Direct Comparison</span>
					</div>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Why teams upgrade to HiClickMe.
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
						Most shorteners only give you basic URLs. HiClickMe brings short links, structured campaigns, and A/B testing into one cohesive studio.
					</p>
				</div>

				{/* Comparison Table Container */}
				<div className="overflow-x-auto rounded-3xl border border-border/80 bg-card shadow-lg">
					<table className="w-full text-left border-collapse min-w-[640px]">
						<thead>
							<tr className="border-b border-border/60 bg-muted/40 text-xs">
								<th className="p-4 sm:p-5 font-semibold text-muted-foreground">
									Capability
								</th>
								<th className="p-4 sm:p-5 font-bold text-primary bg-primary/5 border-x border-border/60">
									HiClickMe
								</th>
								<th className="p-4 sm:p-5 font-semibold text-muted-foreground">
									Legacy Shorteners
								</th>
								<th className="p-4 sm:p-5 font-semibold text-muted-foreground">
									Manual Spreadsheets
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/50 text-xs">
							{rows.map((row, idx) => (
								<tr
									key={idx}
									className="hover:bg-muted/15 transition-colors"
								>
									<td className="p-4 sm:p-5 font-medium text-foreground">
										{row.feature}
									</td>

									{/* HiClickMe Highlight Column */}
									<td className="p-4 sm:p-5 font-semibold text-foreground bg-primary/5 border-x border-border/60">
										<div className="flex items-center gap-1.5 text-primary">
											<IconCheck className="size-4 shrink-0 text-emerald-500" />
											<span>{row.hiclickme}</span>
										</div>
									</td>

									{/* Legacy Shorteners Column */}
									<td className="p-4 sm:p-5 text-muted-foreground">
										<div className="flex items-center gap-1.5">
											{row.legacy.startsWith("Not") ? (
												<IconX className="size-4 shrink-0 text-muted-foreground/60" />
											) : (
												<span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
											)}
											<span>{row.legacy}</span>
										</div>
									</td>

									{/* Spreadsheets Column */}
									<td className="p-4 sm:p-5 text-muted-foreground">
										<div className="flex items-center gap-1.5">
											{row.manual.startsWith("Requires") || row.manual.startsWith("Messy") ? (
												<IconX className="size-4 shrink-0 text-muted-foreground/60" />
											) : (
												<span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
											)}
											<span>{row.manual}</span>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}

export default ComparisonSection;
