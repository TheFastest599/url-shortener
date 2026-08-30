import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesBento } from "@/components/landing/features-bento";
import { AnalyticsPreview } from "@/components/landing/analytics-preview";
import { ArchitectureShowcase } from "@/components/landing/architecture-showcase";
import { StatsStrip } from "@/components/landing/stats-strip";
import { CtaSection } from "@/components/landing/cta-section";

export function HomePage() {
	return (
		<div>
			<HeroSection />
			<FeaturesBento />
			<AnalyticsPreview />
			<ArchitectureShowcase />
			<StatsStrip />
			<CtaSection />
		</div>
	);
}

export default HomePage;
