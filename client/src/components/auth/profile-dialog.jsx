import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	IconUser,
	IconMail,
	IconShield,
	IconKey,
	IconX,
	IconLogout,
	IconDatabase,
	IconClock,
} from "@tabler/icons-react";

export function ProfileDialog({ open, onOpenChange }) {
	const { user, token, logout } = useAuthStore();

	if (!user) return null;

	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
				<DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/80 bg-card p-6 text-card-foreground shadow-2xl transition-all duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
					{/* Header */}
					<div className="flex items-center justify-between border-b border-border/60 pb-4">
						<div className="flex items-center gap-3">
							<div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-sm">
								{user.username ? user.username.slice(0, 2).toUpperCase() : "U"}
							</div>
							<div>
								<DialogPrimitive.Title className="font-heading text-lg font-bold text-foreground">
									User Profile
								</DialogPrimitive.Title>
								<DialogPrimitive.Description className="text-xs text-muted-foreground">
									Active In-Memory Session
								</DialogPrimitive.Description>
							</div>
						</div>

						<DialogPrimitive.Close
							render={
								<Button
									variant="ghost"
									size="icon-xs"
									className="rounded-full cursor-pointer text-muted-foreground hover:text-foreground"
								>
									<IconX className="size-4" />
								</Button>
							}
						/>
					</div>

					{/* Body / Info Fields */}
					<div className="mt-5 space-y-3.5 text-xs">
						{/* Username */}
						<div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 p-3">
							<div className="flex items-center gap-2.5 text-muted-foreground">
								<IconUser className="size-4 text-primary" />
								<span className="font-medium">Username</span>
							</div>
							<span className="font-semibold text-foreground font-mono">
								{user.username || "—"}
							</span>
						</div>

						{/* Email */}
						<div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 p-3">
							<div className="flex items-center gap-2.5 text-muted-foreground">
								<IconMail className="size-4 text-primary" />
								<span className="font-medium">Email</span>
							</div>
							<span className="font-semibold text-foreground truncate max-w-[200px]">
								{user.email || "—"}
							</span>
						</div>

						{/* Role */}
						<div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 p-3">
							<div className="flex items-center gap-2.5 text-muted-foreground">
								<IconShield className="size-4 text-primary" />
								<span className="font-medium">Access Role</span>
							</div>
							<Badge variant="secondary" className="font-mono text-[11px] uppercase">
								{user.role || "USER"}
							</Badge>
						</div>

						{/* In-Memory Session Indicator */}
						<div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
							<div className="flex items-center justify-between">
								<span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
									<IconDatabase className="size-3.5" />
									<span>Session Memory Store</span>
								</span>
								<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							</div>
							<p className="text-[11px] text-muted-foreground">
								User credentials and JWT tokens are securely maintained in-memory for this session.
							</p>
						</div>
					</div>

					{/* Actions Footer */}
					<div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
						<Button
							variant="destructive"
							size="sm"
							className="gap-1.5 cursor-pointer text-xs"
							onClick={() => {
								onOpenChange(false);
								logout();
							}}
						>
							<IconLogout className="size-3.5" />
							<span>Log Out</span>
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							className="cursor-pointer text-xs"
						>
							Close
						</Button>
					</div>
				</DialogPrimitive.Popup>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
