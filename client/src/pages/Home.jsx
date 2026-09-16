/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PlatformDeepDive } from "@/components/landing/platform-deep-dive";
import { MarketingSolutions } from "@/components/landing/marketing-solutions";
import { AudienceInsightsSection } from "@/components/landing/audience-insights";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";

/**
 * Hallmark · Human-Centric Growth Studio Home Page
 * Comprehensive, full-content landing page featuring URL Shortener,
 * Marketing Campaigns, and Server-Side A/B Split Testing.
 */
export function HomePage() {
	return (
		<div className="flex flex-col min-h-[calc(100vh-4rem)] overflow-x-clip">
			{/* 1. Hero: Interactive Shortener & 3-Pillar Showcase Cards */}
			<HeroSection />

			{/* 2. Features: 3 Core Pillars (URL, Campaigns, A/B Testing) */}
			<FeaturesSection />

			{/* 3. Interactive Studio Workbench: Hands-on Simulators */}
			<PlatformDeepDive />

			{/* 4. Marketing Solutions: Real-World Use Case Playbooks */}
			<MarketingSolutions />

			{/* 5. Audience Insights: Privacy-Friendly Marketing Telemetry */}
			<AudienceInsightsSection />

			{/* 6. How It Works: 3-Step Lifecycle */}
			<HowItWorksSection />

			{/* 7. Comparison: HiClickMe vs Legacy Shorteners & Spreadsheets */}
			<ComparisonSection />

			{/* 8. FAQ: Practical Marketing & Operational Answers */}
			<FaqSection />

			{/* 9. Final CTA: Conversion & Workspace Access */}
			<CtaSection />
		</div>
	);
}

export default HomePage;
