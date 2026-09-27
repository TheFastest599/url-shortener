import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { queryKeys } from "@/queries";
import { ROUTES } from "@/routes/paths";
import { toast } from "sonner";
import { IconLoader2, IconSparkles } from "@tabler/icons-react";

export function OAuthCallbackPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { setToken, setUser } = useAuthStore();

	useEffect(() => {
		const accessToken = searchParams.get("accessToken");
		const refreshToken = searchParams.get("refreshToken");
		const id = searchParams.get("id");
		const username = searchParams.get("username");
		const email = searchParams.get("email");
		const role = searchParams.get("role") || "USER";
		const error = searchParams.get("error");

		if (error) {
			toast.error("OAuth authentication failed. Please try again.");
			navigate(ROUTES.LOGIN, { replace: true });
			return;
		}

		if (accessToken && email) {
			const userObj = {
				id: id || "usr_" + Math.random().toString(36).substring(2, 9),
				username: username || email.split("@")[0],
				email: email,
				role: role,
			};

			setToken(accessToken);
			setUser(userObj);
			queryClient.setQueryData(queryKeys.auth.currentUser, userObj);

			// toast.success(`Welcome back, ${userObj.username}!`);
			navigate(ROUTES.DASHBOARD, { replace: true });
		} else {
			toast.error("Invalid authentication response received.");
			navigate(ROUTES.LOGIN, { replace: true });
		}
	}, [searchParams, navigate, queryClient, setToken, setUser]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="flex flex-col items-center gap-4 text-center">
				<div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
					<IconSparkles className="size-6 animate-spin text-primary" />
				</div>
				<div className="space-y-1">
					<h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
						Authenticating your account...
					</h2>
					<p className="text-xs text-muted-foreground">
						Finalizing secure OAuth2 token exchange with API Gateway
					</p>
				</div>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<IconLoader2 className="size-4 animate-spin text-primary" />
					<span>Redirecting to your dashboard...</span>
				</div>
			</div>
		</div>
	);
}

export default OAuthCallbackPage;
