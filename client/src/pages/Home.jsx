import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { CtaSection } from "@/components/landing/cta-section";

/**
 * Hallmark · Modern-Minimal Home Page
 * Clean, human-first landing page with live interactive shortener,
 * benefit-driven feature cards, and 3-step walkthrough.
 */
export function HomePage() {
	return (
		<div className="flex flex-col min-h-[calc(100vh-4rem)]">
			<HeroSection />
			<FeaturesSection />
			<HowItWorksSection />
			<CtaSection />
		</div>
	);
}

export default HomePage;
