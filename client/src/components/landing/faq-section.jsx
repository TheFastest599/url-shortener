/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import * as React from "react";
import { IconChevronDown, IconHelpCircle } from "@tabler/icons-react";

/**
 * Hallmark · Human-Centric FAQ Section
 * Real-world answers addressing practical marketing, campaign, and A/B testing concerns.
 */
export function FaqSection() {
	const [openIndex, setOpenIndex] = React.useState(0);

	const faqs = [
		{
			q: "What makes HiClickMe different from a traditional URL shortener?",
			a: "Traditional shorteners stop at making long links shorter. HiClickMe is a unified growth workspace designed for teams: you can create branded shortlinks, generate print-ready dynamic QR codes that never expire, organize links into campaign folders with multi-touch UTM attribution, and run server-side A/B split tests with 30-day visitor consistency.",
		},
		{
			q: "If I print a dynamic QR code on physical packaging or flyers, can I change the destination later?",
			a: "Yes, completely. The QR code encodes your shortlink URL rather than the lengthy final destination. You can update where the link redirects at any time from your dashboard in seconds. All printed brochures, banners, menus, and product boxes will immediately route to the new page with zero reprinting costs.",
		},
		{
			q: "How do Campaign folders replace messy marketing spreadsheets?",
			a: "Instead of juggling 50 disconnected links across separate spreadsheet tabs, HiClickMe allows you to create a Campaign folder (e.g. 'Q4 Product Launch'). All links within the campaign share standardized UTM parameters and aggregate into a unified channel dashboard, showing you side-by-side performance across Email, Social, and Ads.",
		},
		{
			q: "How does server-side A/B testing prevent customer confusion and page flicker?",
			a: "Client-side testing scripts load after the page renders, causing a noticeable layout jump (FOOC) that hurts conversion. HiClickMe routes traffic directly at the redirection edge before the page even loads. Furthermore, our 30-day sticky session cookie ensures that returning visitors always see the exact same variant, preventing price confusion or support complaints.",
		},
		{
			q: "Can I adjust the traffic split weights between Variant A and Variant B?",
			a: "Yes. While a 50/50 split is the default for head-to-head experiments, you can customize the weighting (such as 80% Control and 20% Challenger) to cautiously validate a new landing page or bold offer before rolling it out to all your traffic.",
		},
		{
			q: "Does HiClickMe filter out automated bots and link scrapers?",
			a: "Yes. Chat apps like Slack, iMessage, and Discord automatically send automated crawlers to preview links when you send them. HiClickMe isolates these preview requests so your analytics dashboard reflects genuine human clicks rather than inflated robot visits.",
		},
	];

	return (
		<section className="py-20 sm:py-28 border-t border-border/50 bg-muted/10 relative">
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
				{/* Section Header */}
				<div className="text-center space-y-3 mb-14 sm:mb-18">
					<div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
						<IconHelpCircle className="size-3.5" />
						<span>Frequently Asked Questions</span>
					</div>
					<h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
						Common questions about the platform.
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
						Everything you need to know about branded shortlinks, campaign attribution folders, and server-side split testing.
					</p>
				</div>

				{/* Accordion List */}
				<div className="space-y-3">
					{faqs.map((faq, idx) => {
						const isOpen = openIndex === idx;
						return (
							<div
								key={idx}
								className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-colors shadow-2xs"
							>
								<button
									type="button"
									onClick={() => setOpenIndex(isOpen ? -1 : idx)}
									className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-foreground cursor-pointer hover:text-primary transition-colors gap-4"
								>
									<span>{faq.q}</span>
									<IconChevronDown
										className={`size-4 shrink-0 transition-transform duration-200 text-muted-foreground ${
											isOpen ? "rotate-180 text-primary" : ""
										}`}
									/>
								</button>

								{isOpen && (
									<div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
										{faq.a}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export default FaqSection;
