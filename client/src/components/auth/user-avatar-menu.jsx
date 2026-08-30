import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ROUTES } from "@/routes/paths";
import { ProfileDialog } from "@/components/auth/profile-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
	IconUser,
	IconLayoutDashboard,
	IconLogout,
	IconChevronDown,
	IconShieldCheck,
} from "@tabler/icons-react";

export function UserAvatarMenu({ className = "" }) {
	const { user, logout } = useAuthStore();
	const navigate = useNavigate();
	const [profileOpen, setProfileOpen] = useState(false);

	if (!user) return null;

	const initials = user.username
		? user.username.slice(0, 2).toUpperCase()
		: user.email
		? user.email.slice(0, 2).toUpperCase()
		: "US";

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<button
							className={`group flex items-center gap-2 rounded-full p-1 border border-border/80 bg-background/80 hover:bg-muted/80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${className}`}
							aria-label="User account menu"
						>
							<div className="relative flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-xs">
								{initials}
								<span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
							</div>
							<span className="hidden sm:inline-block max-w-[90px] truncate text-xs font-medium text-foreground">
								{user.username || "User"}
							</span>
							<IconChevronDown className="size-3.5 text-muted-foreground transition-transform group-aria-expanded:rotate-180" />
						</button>
					}
				/>

				<DropdownMenuContent align="end" className="min-w-[210px] p-1.5 shadow-xl backdrop-blur-md">
					{/* User Header */}
					<div className="px-2.5 py-2 border-b border-border/40">
						<div className="flex items-center justify-between">
							<p className="font-semibold text-xs text-foreground truncate">
								{user.username || "Account"}
							</p>
							<Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono uppercase">
								{user.role || "USER"}
							</Badge>
						</div>
						<p className="text-[11px] text-muted-foreground truncate mt-0.5">
							{user.email}
						</p>
					</div>

					<div className="py-1">
						{/* Profile Option */}
						<DropdownMenuItem
							onClick={() => setProfileOpen(true)}
							className="flex items-center gap-2.5 cursor-pointer text-xs"
						>
							<IconUser className="size-4 text-primary" />
							<span>My Profile & Settings</span>
						</DropdownMenuItem>

						{/* Dashboard Option */}
						<DropdownMenuItem
							onClick={() => navigate(ROUTES.DASHBOARD)}
							className="flex items-center gap-2.5 cursor-pointer text-xs"
						>
							<IconLayoutDashboard className="size-4 text-cyan-500" />
							<span>Dashboard</span>
						</DropdownMenuItem>
					</div>

					<DropdownMenuSeparator />

					{/* Logout Option */}
					<DropdownMenuItem
						onClick={() => {
							logout();
							navigate(ROUTES.HOME);
						}}
						variant="destructive"
						className="flex items-center gap-2.5 cursor-pointer text-xs text-destructive focus:text-destructive"
					>
						<IconLogout className="size-4" />
						<span>Log Out</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* User Profile Dialog */}
			<ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
		</>
	);
}
