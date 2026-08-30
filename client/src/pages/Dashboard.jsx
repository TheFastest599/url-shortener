import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/badge";

export function DashboardPage() {
	const { user } = useAuthStore();

	return (
		<div className="py-12 sm:py-16">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
							Welcome back, <span className="text-primary">{user?.username || "Developer"}</span>!
						</h1>
						<Badge variant="secondary" className="font-mono text-xs uppercase px-2 py-0.5">
							{user?.role || "USER"}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						Your workspace is ready. High-throughput URL shortening and telemetry will connect here.
					</p>
				</div>
			</div>
		</div>
	);
}

export default DashboardPage;
