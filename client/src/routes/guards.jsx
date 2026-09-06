import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "./paths";
import { IconLoader2 } from "@tabler/icons-react";

/**
 * Route guard for protected internal routes (e.g. /dashboard, /profile, /links)
 * Redirects unauthenticated visitors to /login preserving the return path in location state.
 */
export function ProtectedRoute({ children }) {
	const token = useAuthStore((state) => state.token);
	const isLogged = useAuthStore((state) => state.isLogged);
	const isInitializing = useAuthStore((state) => state.isInitializing);
	const location = useLocation();

	if (isInitializing || (isLogged && !token)) {
		return (
			<div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
				<IconLoader2 className="size-6 animate-spin text-primary" />
				<span className="text-xs text-muted-foreground">Verifying secure session...</span>
			</div>
		);
	}

	if (!token && !isLogged) {
		return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
	}

	return children;
}

/**
 * Route guard for public-only auth routes (e.g. /login, /signup)
 * Automatically redirects already authenticated users directly to /dashboard.
 */
export function PublicOnlyRoute({ children }) {
	const token = useAuthStore((state) => state.token);
	const isLogged = useAuthStore((state) => state.isLogged);
	const isInitializing = useAuthStore((state) => state.isInitializing);
	const location = useLocation();

	if (isInitializing || (isLogged && !token)) {
		return (
			<div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
				<IconLoader2 className="size-6 animate-spin text-primary" />
				<span className="text-xs text-muted-foreground">Verifying session...</span>
			</div>
		);
	}

	if (token || isLogged) {
		const redirectPath = location.state?.from?.pathname || ROUTES.DASHBOARD;
		return <Navigate to={redirectPath} replace />;
	}

	return children;
}
