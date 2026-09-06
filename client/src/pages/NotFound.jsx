import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconAlertTriangle } from "@tabler/icons-react";

export function NotFoundPage() {
	return (
		<div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 py-16">
			<div className="flex size-14 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 mb-4">
				<IconAlertTriangle className="size-8" />
			</div>
			<h1 className="font-heading text-4xl font-extrabold text-foreground">
				404 — Page Not Found
			</h1>
			<p className="mt-3 text-sm text-muted-foreground max-w-md">
				The route or shortened URL destination you are looking for does not exist or has expired.
			</p>
			<div className="mt-6">
				<Link to={ROUTES.HOME}>
					<Button className="gap-2 cursor-pointer">
						<IconArrowLeft className="size-4" />
						<span>Return to Home</span>
					</Button>
				</Link>
			</div>
		</div>
	);
}

export default NotFoundPage;
