import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	IconUser,
	IconMail,
	IconShieldCheck,
	IconFingerprint,
	IconCopy,
	IconCheck,
	IconLogout,
	IconArrowLeft,
	IconLock,
	IconServer,
	IconClock,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function ProfilePage() {
	const { user, logout } = useAuthStore();
	const navigate = useNavigate();
	const [copied, setCopied] = useState(false);

	if (!user) {
		return (
			<div className="py-16 text-center">
				<p className="text-muted-foreground">No active user session found.</p>
				<Link to={ROUTES.LOGIN} className="mt-4 inline-block">
					<Button variant="default">Sign In</Button>
				</Link>
			</div>
		);
	}

	const initials = user.username
		? user.username.slice(0, 2).toUpperCase()
		: user.email
		? user.email.slice(0, 2).toUpperCase()
		: "US";

	const handleCopyId = () => {
		if (user.id) {
			navigator.clipboard.writeText(user.id);
			setCopied(true);
			toast.success("User ID copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleLogout = () => {
		logout();
		navigate(ROUTES.HOME);
	};

	return (
		<div className="py-10 sm:py-14">
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
				{/* Top Back Navigation & Title */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
					<div className="space-y-1">
						<Link
							to={ROUTES.DASHBOARD}
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 group"
						>
							<IconArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
							<span>Back to Dashboard</span>
						</Link>
						<h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							Account Profile
						</h1>
						<p className="text-xs sm:text-sm text-muted-foreground">
							Manage your account credentials, roles, and active authentication session.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="destructive"
							size="sm"
							onClick={handleLogout}
							className="gap-2 cursor-pointer text-xs"
						>
							<IconLogout className="size-4" />
							<span>Log Out</span>
						</Button>
					</div>
				</div>

				{/* User Banner Card */}
				<div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
					<div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
						<div className="relative flex size-20 sm:size-22 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground text-2xl sm:text-3xl font-bold shadow-md">
							{initials}
							<span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-emerald-500 ring-4 ring-card" />
						</div>

						<div className="space-y-1.5 flex-1 min-w-0">
							<div className="flex flex-wrap items-center gap-2.5">
								<h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground truncate">
									{user.username || "Developer"}
								</h2>
								<Badge variant="secondary" className="font-mono text-xs uppercase px-2 py-0.5">
									{user.role || "USER"}
								</Badge>
							</div>
							<p className="text-sm text-muted-foreground truncate">{user.email}</p>
							<div className="flex items-center gap-2 pt-1">
								<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
									<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
									Active Session
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Account Details & Security Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Profile Information */}
					<div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border/60 pb-3">
							<IconUser className="size-4 text-primary" />
							<h3 className="font-heading text-sm font-bold text-foreground">
								Personal Details
							</h3>
						</div>

						<div className="space-y-3 text-xs">
							<div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
								<div className="flex items-center gap-2.5 text-muted-foreground">
									<IconUser className="size-4 text-primary" />
									<span className="font-medium">Username</span>
								</div>
								<span className="font-semibold text-foreground font-mono">
									{user.username || "—"}
								</span>
							</div>

							<div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
								<div className="flex items-center gap-2.5 text-muted-foreground">
									<IconMail className="size-4 text-primary" />
									<span className="font-medium">Email Address</span>
								</div>
								<span className="font-semibold text-foreground truncate max-w-[180px]">
									{user.email || "—"}
								</span>
							</div>

							<div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
								<div className="flex items-center gap-2.5 text-muted-foreground">
									<IconFingerprint className="size-4 text-primary" />
									<span className="font-medium">User ID</span>
								</div>
								<div className="flex items-center gap-1.5">
									<span className="font-mono text-[11px] text-muted-foreground max-w-[120px] truncate">
										{user.id ? `${user.id.slice(0, 10)}...` : "—"}
									</span>
									{user.id && (
										<Button
											variant="ghost"
											size="icon-xs"
											onClick={handleCopyId}
											className="cursor-pointer text-muted-foreground hover:text-foreground"
											title="Copy User ID"
										>
											{copied ? (
												<IconCheck className="size-3.5 text-primary" />
											) : (
												<IconCopy className="size-3.5" />
											)}
										</Button>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Security & Token Architecture */}
					<div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border/60 pb-3">
							<IconShieldCheck className="size-4 text-primary" />
							<h3 className="font-heading text-sm font-bold text-foreground">
								Security & Session
							</h3>
						</div>

						<div className="space-y-3 text-xs">
							<div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
								<div className="flex items-center gap-2.5 text-muted-foreground">
									<IconLock className="size-4 text-primary" />
									<span className="font-medium">Session Storage</span>
								</div>
								<span className="font-semibold text-foreground font-mono text-[11px]">
									In-Memory Only
								</span>
							</div>

							<div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
								<div className="flex items-center gap-2.5 text-muted-foreground">
									<IconClock className="size-4 text-primary" />
									<span className="font-medium">Token Refresh</span>
								</div>
								<span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
									HttpOnly Cookie (7d)
								</span>
							</div>

							<div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
								<div className="flex items-center gap-2.5 text-muted-foreground">
									<IconServer className="size-4 text-primary" />
									<span className="font-medium">Gateway Protection</span>
								</div>
								<span className="font-semibold text-foreground font-mono text-[11px]">
									Spring Cloud Gateway
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ProfilePage;
