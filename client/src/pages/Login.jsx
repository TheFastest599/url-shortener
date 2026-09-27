import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLoginMutation, useOAuthMutation } from "@/queries";
import { ROUTES } from "@/routes/paths";
import { AuthSideArt } from "@/components/auth/auth-side-art";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
	IconLink,
	IconBrandGithub,
	IconBrandGoogle,
	IconEye,
	IconEyeOff,
	IconArrowLeft,
	IconBolt,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
	validateEmail,
	validatePassword,
	parseApiError,
	showErrorToast,
} from "@/lib/errorHandler";

export function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [clientErrors, setClientErrors] = useState({});

	const location = useLocation();
	const redirectPath = location.state?.from?.pathname || ROUTES.DASHBOARD;

	// Encapsulated TanStack mutations
	const loginMutation = useLoginMutation({
		redirectTo: redirectPath,
	});
	const oauthMutation = useOAuthMutation();
	const { fieldErrors: serverErrors } = parseApiError(loginMutation.error);

	const handleSubmit = (e) => {
		e.preventDefault();

		const emailVal = validateEmail(email);
		const passVal = validatePassword(password);

		const newErrors = {};
		if (!emailVal.isValid) newErrors.email = emailVal.error;
		if (!passVal.isValid) newErrors.password = passVal.error;

		if (Object.keys(newErrors).length > 0) {
			setClientErrors(newErrors);
			const firstError = Object.values(newErrors)[0];
			toast.error("Validation Error", { description: firstError });
			return;
		}
		setClientErrors({});

		loginMutation.mutate({ email: email.trim(), password });
	};

	const handleOAuth = (provider) => {
		// toast.info(`Connecting to ${provider.toUpperCase()} OAuth2 provider...`);
		oauthMutation.mutate(provider);
	};

	return (
		<div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
			{/* Left Column: Form Card */}
			<div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14">
				{/* Top Header Bar */}
				<div className="flex items-center justify-between">
					<Link
						to={ROUTES.HOME}
						className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
					>
						<div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
							<IconLink className="size-4" />
						</div>
						<span className="font-heading text-lg font-bold tracking-tight text-foreground">
							url
							<span className="text-primary font-extrabold">
								Shortener
							</span>
						</span>
					</Link>

					<div className="flex items-center gap-2">
						<ThemeToggle size="icon-sm" />
						<Link
							to={ROUTES.HOME}
							className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
						>
							<IconArrowLeft className="size-3.5" />
							<span>Back to Home</span>
						</Link>
					</div>
				</div>

				{/* Center: Login Form Card */}
				<div className="mx-auto w-full max-w-sm py-10">
					<div className="space-y-2 text-center sm:text-left">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
							Login to your account
						</h1>
						<p className="text-xs sm:text-sm text-muted-foreground">
							Enter your credentials below to access your
							shortener dashboard
						</p>
					</div>

					<form onSubmit={handleSubmit} className="mt-8 space-y-4">
						{/* Email Field */}
						<Field>
							<FieldLabel>
								Email
							</FieldLabel>
							<Input
								type="email"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
									if (clientErrors.email) {
										setClientErrors((prev) => ({
											...prev,
											email: null,
										}));
									}
								}}
								placeholder="developer@company.com"
								required
								autoComplete="email"
								aria-invalid={Boolean(
									clientErrors.email || serverErrors.email,
								)}
								className="h-10 text-sm bg-muted/30 border-border"
							/>
							<FieldError>
								{clientErrors.email || serverErrors.email}
							</FieldError>
						</Field>

						{/* Password Field */}
						<Field>
							<div className="flex items-center justify-between text-xs">
								<FieldLabel>
									Password
								</FieldLabel>
								<button
									type="button"
									onClick={() =>
										toast.info(
											"Password reset link sent to registered email.",
										)
									}
									className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
								>
									Forgot your password?
								</button>
							</div>
							<div className="relative">
								<Input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										if (clientErrors.password) {
											setClientErrors((prev) => ({
												...prev,
												password: null,
											}));
										}
									}}
									placeholder="••••••••"
									required
									autoComplete="current-password"
									aria-invalid={Boolean(
										clientErrors.password ||
											serverErrors.password,
									)}
									className="h-10 pr-10 text-sm bg-muted/30 border-border"
								/>
								<button
									type="button"
									onClick={() =>
										setShowPassword(!showPassword)
									}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
									aria-label={
										showPassword
											? "Hide password"
											: "Show password"
									}
								>
									{showPassword ? (
										<IconEyeOff className="size-4" />
									) : (
										<IconEye className="size-4" />
									)}
								</button>
							</div>
							<FieldError>
								{clientErrors.password || serverErrors.password}
							</FieldError>
						</Field>

						{/* Error Banner if any */}
						{loginMutation.isError && (
							<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
								{loginMutation.error?.response?.data?.message ||
									loginMutation.error?.response?.data
										?.error ||
									loginMutation.error?.message ||
									"Login failed"}
							</div>
						)}

						{/* Submit Button */}
						<Button
							type="submit"
							disabled={loginMutation.isPending}
							className="w-full h-10 gap-2 cursor-pointer font-medium shadow-sm mt-2"
						>
							{loginMutation.isPending ? (
								<span>Signing in...</span>
							) : (
								<>
									<IconBolt className="size-4" />
									<span>Login</span>
								</>
							)}
						</Button>

						{/* Divider */}
						<div className="relative my-4 flex items-center justify-center">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-border/60" />
							</div>
							<span className="relative bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
								Or continue with
							</span>
						</div>

						{/* OAuth Buttons */}
						<div className="grid grid-cols-2 gap-2.5">
							<Button
								type="button"
								variant="outline"
								disabled={oauthMutation.isPending}
								className="h-9 gap-2 cursor-pointer text-xs justify-center"
								onClick={() => handleOAuth("github")}
							>
								<IconBrandGithub className="size-4" />
								<span>
									{oauthMutation.isPending &&
									oauthMutation.variables === "github"
										? "Connecting..."
										: "GitHub"}
								</span>
							</Button>

							<Button
								type="button"
								variant="outline"
								disabled={oauthMutation.isPending}
								className="h-9 gap-2 cursor-pointer text-xs justify-center"
								onClick={() => handleOAuth("google")}
							>
								<IconBrandGoogle className="size-4 text-destructive" />
								<span>
									{oauthMutation.isPending &&
									oauthMutation.variables === "google"
										? "Connecting..."
										: "Google"}
								</span>
							</Button>
						</div>
					</form>

					{/* Signup Switch Link */}
					<p className="mt-6 text-center text-xs text-muted-foreground">
						Don't have an account?{" "}
						<Link
							to={ROUTES.SIGNUP}
							className="font-semibold text-primary underline-offset-4 hover:underline"
						>
							Sign up
						</Link>
					</p>
				</div>

				<div />
			</div>

			{/* Right Column: Cybernetic Matrix Art Panel */}
			<AuthSideArt headline="Sub-5ms Redirection & Real-Time Analytics" />
		</div>
	);
}

export default LoginPage;
