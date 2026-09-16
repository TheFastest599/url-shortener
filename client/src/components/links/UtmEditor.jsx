import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconTag, IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react";

/**
 * UtmEditor
 * An interactive, two-way synchronized UTM parameter builder.
 * Bakes utm_source, utm_medium, utm_campaign, utm_term, and utm_content
 * directly into the target URL query string.
 */
export function UtmEditor({
	url = "",
	onChange,
	compact = false,
	defaultOpen = false,
}) {
	const [isOpen, setIsOpen] = React.useState(defaultOpen);

	// Parse current UTM values directly from the URL
	const utmValues = React.useMemo(() => {
		if (!url) {
			return { source: "", medium: "", campaign: "", term: "", content: "" };
		}
		try {
			// Ensure protocol for URL parsing
			const formatted = (!url.startsWith("http://") && !url.startsWith("https://"))
				? `https://${url}`
				: url;
			const parsed = new URL(formatted);
			return {
				source: parsed.searchParams.get("utm_source") || "",
				medium: parsed.searchParams.get("utm_medium") || "",
				campaign: parsed.searchParams.get("utm_campaign") || "",
				term: parsed.searchParams.get("utm_term") || "",
				content: parsed.searchParams.get("utm_content") || "",
			};
		} catch {
			return { source: "", medium: "", campaign: "", term: "", content: "" };
		}
	}, [url]);

	const activeCount = Object.values(utmValues).filter((v) => v.trim().length > 0).length;

	const handleUtmParamChange = (paramKey, value) => {
		if (!onChange) return;
		try {
			const hasProtocol = url.startsWith("http://") || url.startsWith("https://");
			const formatted = hasProtocol ? url : (url.trim() ? `https://${url.trim()}` : "https://example.com");
			const parsed = new URL(formatted);

			const paramMap = {
				source: "utm_source",
				medium: "utm_medium",
				campaign: "utm_campaign",
				term: "utm_term",
				content: "utm_content",
			};

			const queryKey = paramMap[paramKey];
			if (value && value.trim()) {
				parsed.searchParams.set(queryKey, value.trim());
			} else {
				parsed.searchParams.delete(queryKey);
			}

			// If original didn't have protocol, restore without it or with clean URL
			const updatedUrl = parsed.toString();
			if (!hasProtocol && url && !url.startsWith("http")) {
				// Keep clean format if originally without https://
				const cleaned = updatedUrl.replace(/^https?:\/\//, "");
				onChange(cleaned);
			} else {
				onChange(updatedUrl);
			}
		} catch (e) {
			console.warn("Could not update UTM parameter:", e);
		}
	};

	const handleClearAll = (e) => {
		e.stopPropagation();
		if (!onChange || !url) return;
		try {
			const hasProtocol = url.startsWith("http://") || url.startsWith("https://");
			const formatted = hasProtocol ? url : `https://${url}`;
			const parsed = new URL(formatted);

			["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
				parsed.searchParams.delete(k);
			});

			const updatedUrl = parsed.toString();
			if (!hasProtocol && !url.startsWith("http")) {
				onChange(updatedUrl.replace(/^https?:\/\//, ""));
			} else {
				onChange(updatedUrl);
			}
		} catch (e) {
			console.warn("Could not clear UTM parameters:", e);
		}
	};

	return (
		<div className="space-y-1.5 pt-1">
			<div className="flex items-center justify-between text-xs">
				<button
					type="button"
					onClick={() => setIsOpen((prev) => !prev)}
					className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
				>
					<IconTag className="size-3 text-primary shrink-0" />
					<span>UTM Tracking Parameters</span>
					{activeCount > 0 ? (
						<Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0 font-mono bg-primary/10 text-primary border-primary/20">
							{activeCount} active
						</Badge>
					) : null}
					{isOpen ? (
						<IconChevronUp className="size-3 text-muted-foreground" />
					) : (
						<IconChevronDown className="size-3 text-muted-foreground" />
					)}
				</button>

				{isOpen && activeCount > 0 && (
					<button
						type="button"
						onClick={handleClearAll}
						className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
						title="Clear all UTM parameters"
					>
						<IconX className="size-2.5" />
						<span>Clear UTMs</span>
					</button>
				)}
			</div>

			{isOpen && (
				<div className={`p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-2 text-xs transition-all ${compact ? "p-2 space-y-1.5" : ""}`}>
					<div className={`grid gap-2 ${compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
						<div className="space-y-0.5">
							<label className="text-[10px] font-medium text-muted-foreground">Source (utm_source)</label>
							<Input
								value={utmValues.source}
								onChange={(e) => handleUtmParamChange("source", e.target.value)}
								placeholder="e.g. google, newsletter, twitter"
								className="h-7 text-xs font-mono"
							/>
						</div>

						<div className="space-y-0.5">
							<label className="text-[10px] font-medium text-muted-foreground">Medium (utm_medium)</label>
							<Input
								value={utmValues.medium}
								onChange={(e) => handleUtmParamChange("medium", e.target.value)}
								placeholder="e.g. cpc, email, social"
								className="h-7 text-xs font-mono"
							/>
						</div>

						<div className="space-y-0.5">
							<label className="text-[10px] font-medium text-muted-foreground">Campaign (utm_campaign)</label>
							<Input
								value={utmValues.campaign}
								onChange={(e) => handleUtmParamChange("campaign", e.target.value)}
								placeholder="e.g. spring_sale, trial"
								className="h-7 text-xs font-mono"
							/>
						</div>
					</div>

					<div className={`grid gap-2 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
						<div className="space-y-0.5">
							<label className="text-[10px] font-medium text-muted-foreground">Term / Keyword (utm_term)</label>
							<Input
								value={utmValues.term}
								onChange={(e) => handleUtmParamChange("term", e.target.value)}
								placeholder="e.g. running+shoes"
								className="h-7 text-xs font-mono"
							/>
						</div>

						<div className="space-y-0.5">
							<label className="text-[10px] font-medium text-muted-foreground">Content (utm_content)</label>
							<Input
								value={utmValues.content}
								onChange={(e) => handleUtmParamChange("content", e.target.value)}
								placeholder="e.g. variant_a, hero_cta"
								className="h-7 text-xs font-mono"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default UtmEditor;
