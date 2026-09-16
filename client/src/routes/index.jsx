import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./paths";
import { ProtectedRoute, PublicOnlyRoute } from "./guards";
import { RootLayout } from "@/components/layout/RootLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/Home";
import { NotFoundPage } from "@/pages/NotFound";

function FullPageLoadingFallback() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="flex flex-col items-center gap-3">
				<div className="size-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
				<span className="text-xs text-muted-foreground font-mono">Loading...</span>
			</div>
		</div>
	);
}

// Lazy-loaded Auth Pages
const LoginPage = lazy(() => import("@/pages/Login"));
const SignupPage = lazy(() => import("@/pages/Signup"));
const OAuthCallbackPage = lazy(() => import("@/pages/OAuthCallback"));

// Lazy-loaded Workspace Pages (on-demand code-splitting)
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const RedirectLinksPage = lazy(() => import("@/pages/RedirectLinks"));
const LinkDetailPage = lazy(() => import("@/pages/LinkDetail"));
const AnalyticsPage = lazy(() => import("@/pages/Analytics"));
const AnalyticsDetailPage = lazy(() => import("@/pages/AnalyticsDetail"));
const CampaignsPage = lazy(() => import("@/pages/Campaigns"));
const CampaignDetailPage = lazy(() => import("@/pages/CampaignDetail"));
const AbTestingPage = lazy(() => import("@/pages/AbTesting"));
const AbTestDetailPage = lazy(() => import("@/pages/AbTestDetail"));
const ProfilePage = lazy(() => import("@/pages/Profile"));

/**
 * Centralized Application Routes configuration
 */
export function AppRoutes() {
	return (
		<Routes>
			{/* Public Auth Pages (Split Screen layout) - redirect if already logged in */}
			<Route
				path={ROUTES.LOGIN}
				element={
					<PublicOnlyRoute>
						<Suspense fallback={<FullPageLoadingFallback />}>
							<LoginPage />
						</Suspense>
					</PublicOnlyRoute>
				}
			/>
			<Route
				path={ROUTES.SIGNUP}
				element={
					<PublicOnlyRoute>
						<Suspense fallback={<FullPageLoadingFallback />}>
							<SignupPage />
						</Suspense>
					</PublicOnlyRoute>
				}
			/>

			{/* OAuth2 Callback Handler */}
			<Route
				path={ROUTES.OAUTH_CALLBACK}
				element={
					<Suspense fallback={<FullPageLoadingFallback />}>
						<OAuthCallbackPage />
					</Suspense>
				}
			/>

			{/* Protected Workspace Layout (Shared Top Navbar + Responsive Sidebar + Realtime Modals) */}
			<Route
				element={
					<ProtectedRoute>
						<AppLayout />
					</ProtectedRoute>
				}
			>
				<Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
				<Route path={ROUTES.REDIRECT_LINKS} element={<RedirectLinksPage />} />
				<Route path="/redirect-links/:id" element={<LinkDetailPage />} />
				<Route path="/redirect-links/:shortCode" element={<LinkDetailPage />} />
				<Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
				<Route path="/analytics/:id" element={<AnalyticsDetailPage />} />
				<Route path={ROUTES.ANALYTICS_DETAIL} element={<AnalyticsDetailPage />} />
				<Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
				<Route path={ROUTES.CAMPAIGN_DETAIL} element={<CampaignDetailPage />} />
				<Route path={ROUTES.AB_TESTING} element={<AbTestingPage />} />
				<Route path={ROUTES.AB_TEST_DETAIL} element={<AbTestDetailPage />} />
				<Route path={ROUTES.PROFILE} element={<ProfilePage />} />
			</Route>

			{/* Main Marketing Layout (Shared Navbar + Footer) */}
			<Route element={<RootLayout />}>
				{/* Unprotected Home / Landing */}
				<Route path={ROUTES.HOME} element={<HomePage />} />

				{/* 404 Catch-All */}
				<Route path="*" element={<NotFoundPage />} />
			</Route>
		</Routes>
	);
}

export default AppRoutes;
