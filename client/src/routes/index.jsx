import { Routes, Route } from "react-router-dom";
import { ROUTES } from "./paths";
import { ProtectedRoute, PublicOnlyRoute } from "./guards";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/pages/Home";
import { LoginPage } from "@/pages/Login";
import { SignupPage } from "@/pages/Signup";
import { OAuthCallbackPage } from "@/pages/OAuthCallback";
import { DashboardPage } from "@/pages/Dashboard";
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

			{/* Protected Internal App Pages (Own full-height dashboard shell) */}
			<Route
				path={ROUTES.DASHBOARD}
				element={
					<ProtectedRoute>
						<DashboardPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path={ROUTES.PROFILE}
				element={
					<ProtectedRoute>
						<ProfilePage />
					</ProtectedRoute>
				}
			/>

			{/* Main Marketing Layout (Navbar + Footer) */}
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
