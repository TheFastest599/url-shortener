import { useState } from "react";
import { Link } from "react-router-dom";
import { useSignupMutation, useOAuthMutation } from "@/queries";
import { ROUTES } from "@/routes/paths";
import { AuthSideArt } from "@/components/auth/auth-side-art";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	IconLink,
	IconBrandGithub,
	IconBrandGoogle,
	IconEye,
	IconEyeOff,
	IconArrowLeft,
	IconUserPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function SignupPage() {
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// Encapsulated TanStack mutations from queries/authQueries.js
	const signupMutation = useSignupMutation({ redirectTo: ROUTES.DASHBOARD });
	const oauthMutation = useOAuthMutation();

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!username.trim() || !email.trim() || !password.trim()) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters long");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		signupMutation.mutate({
			username: username.trim(),
			email: email.trim(),
			password,
		});
	};

	const handleOAuth = (provider) => {
		// toast.info(`Connecting to ${provider.toUpperCase()} OAuth2 provider...`);
		oauthMutation.mutate(provider);
	};

	return (
		<div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
			{/* Left Column: Signup Form Card */}
			<div className="flex flex-col justify-between p-6 sm:p-10 lg:p-14">
				{/* Top Header */}
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

				{/* Center: Signup Form Card */}
				<div className="mx-auto w-full max-w-sm py-8">
					<div className="space-y-2 text-center sm:text-left">
						<h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
							Create an account
						</h1>
						<p className="text-xs sm:text-sm text-muted-foreground">
							Deploy high-velocity short links with instant
							real-time telemetry
						</p>
					</div>

					<form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
						{/* Username Field */}
						<div className="space-y-1">
							<label className="text-xs font-medium text-foreground">
								Username
							</label>
							<Input
								type="text"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="alex_dev"
								required
								autoComplete="username"
								className="h-9 text-sm bg-muted/30 border-border"
							/>
						</div>

						{/* Email Field */}
						<div className="space-y-1">
							<label className="text-xs font-medium text-foreground">
								Email Address
							</label>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="alex@company.com"
								required
								autoComplete="email"
								className="h-9 text-sm bg-muted/30 border-border"
							/>
						</div>

						{/* Password Field */}
						<div className="space-y-1">
							<label className="text-xs font-medium text-foreground">
								Password (min. 6 characters)
							</label>
							<div className="relative">
								<Input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									placeholder="••••••••"
									required
									minLength={6}
									autoComplete="new-password"
									className="h-9 pr-10 text-sm bg-muted/30 border-border"
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
						</div>

						{/* Confirm Password Field with Eye toggle */}
						<div className="space-y-1">
							<label className="text-xs font-medium text-foreground">
								Confirm Password
							</label>
							<div className="relative">
								<Input
									type={
										showConfirmPassword
											? "text"
											: "password"
									}
									value={confirmPassword}
									onChange={(e) =>
										setConfirmPassword(e.target.value)
									}
									placeholder="••••••••"
									required
									minLength={6}
									autoComplete="new-password"
									className="h-9 pr-10 text-sm bg-muted/30 border-border"
								/>
								<button
									type="button"
									onClick={() =>
										setShowConfirmPassword(
											!showConfirmPassword,
										)
									}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
									aria-label={
										showConfirmPassword
											? "Hide password"
											: "Show password"
									}
								>
									{showConfirmPassword ? (
										<IconEyeOff className="size-4" />
									) : (
										<IconEye className="size-4" />
									)}
								</button>
							</div>
						</div>

						{/* Error Banner */}
						{signupMutation.isError && (
							<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
								{signupMutation.error?.response?.data
									?.message ||
									signupMutation.error?.response?.data
										?.error ||
									signupMutation.error?.message ||
									"Registration failed"}
							</div>
						)}

						{/* Submit Button */}
						<Button
							type="submit"
							disabled={signupMutation.isPending}
							className="w-full h-10 gap-2 cursor-pointer font-medium shadow-sm mt-1"
						>
							{signupMutation.isPending ? (
								<span>Creating account...</span>
							) : (
								<>
									<IconUserPlus className="size-4" />
									<span>Create Account</span>
								</>
							)}
						</Button>

						{/* Divider */}
						<div className="relative my-3 flex items-center justify-center">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-border/60" />
							</div>
							<span className="relative bg-background px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
								Or register with
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
								<IconBrandGoogle className="size-4 text-rose-500" />
								<span>
									{oauthMutation.isPending &&
									oauthMutation.variables === "google"
										? "Connecting..."
										: "Google"}
								</span>
							</Button>
						</div>
					</form>

					{/* Signin Switch Link */}
					<p className="mt-5 text-center text-xs text-muted-foreground">
						Already have an account?{" "}
						<Link
							to={ROUTES.LOGIN}
							className="font-semibold text-primary underline-offset-4 hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>

				<div />
			</div>

			{/* Right Column: Cybernetic Matrix Panel */}
			<AuthSideArt headline="Multi-Tenant Cloud Architecture" />
		</div>
	);
}

export default SignupPage;
