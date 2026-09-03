import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./paths";
import { ProtectedRoute, PublicOnlyRoute } from "./guards";
import { RootLayout } from "@/components/layout/RootLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { HomePage } from "@/pages/Home";
import { LoginPage } from "@/pages/Login";
import { SignupPage } from "@/pages/Signup";
import { OAuthCallbackPage } from "@/pages/OAuthCallback";
import { DashboardPage } from "@/pages/Dashboard";
import { RedirectLinksPage } from "@/pages/RedirectLinks";
import { LinkDetailPage } from "@/pages/LinkDetail";
import { AnalyticsDetailPage } from "@/pages/AnalyticsDetail";
import { CampaignsPage } from "@/pages/Campaigns";
import { ProfilePage } from "@/pages/Profile";
import { NotFoundPage } from "@/pages/NotFound";

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
						<LoginPage />
					</PublicOnlyRoute>
				}
			/>
			<Route
				path={ROUTES.SIGNUP}
				element={
					<PublicOnlyRoute>
						<SignupPage />
					</PublicOnlyRoute>
				}
			/>

			{/* OAuth2 Callback Handler */}
			<Route path={ROUTES.OAUTH_CALLBACK} element={<OAuthCallbackPage />} />

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
				<Route path="/redirect-links/:shortCode" element={<LinkDetailPage />} />
				<Route path={ROUTES.ANALYTICS_DETAIL} element={<AnalyticsDetailPage />} />
				<Route path={ROUTES.CAMPAIGNS} element={<CampaignsPage />} />
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
