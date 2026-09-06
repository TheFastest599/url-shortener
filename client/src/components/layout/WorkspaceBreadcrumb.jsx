import * as React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ROUTES } from "@/routes/paths";
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

export function WorkspaceBreadcrumb() {
	const location = useLocation();
	const { shortCode } = useParams();
	const pathname = location.pathname;

	// Determine breadcrumb segments
	let items = [];

	if (pathname === ROUTES.DASHBOARD || pathname === "/dashboard") {
		items = [{ label: "Dashboard", isCurrent: true }];
	} else if (pathname === ROUTES.REDIRECT_LINKS || pathname === "/redirect-links") {
		items = [{ label: "Redirect Links", isCurrent: true }];
	} else if (pathname.startsWith("/redirect-links/") && shortCode) {
		items = [
			{ label: "Redirect Links", href: ROUTES.REDIRECT_LINKS },
			{ label: `/r/${shortCode}`, isCurrent: true, isCode: true },
		];
	} else if (pathname.startsWith("/analytics/") && shortCode) {
		items = [
			{ label: "Analytics", href: ROUTES.REDIRECT_LINKS },
			{ label: `/r/${shortCode}`, isCurrent: true, isCode: true },
		];
	} else if (pathname === ROUTES.CAMPAIGNS || pathname === "/campaigns") {
		items = [{ label: "Campaigns & UTM", isCurrent: true }];
	} else if (pathname === ROUTES.PROFILE || pathname === "/profile") {
		items = [{ label: "Settings & Profile", isCurrent: true }];
	} else {
		// Fallback parse path
		const segs = pathname.split("/").filter(Boolean);
		items = segs.map((seg, idx) => ({
			label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
			isCurrent: idx === segs.length - 1,
			href: `/${segs.slice(0, idx + 1).join("/")}`,
		}));
	}

	return (
		<Breadcrumb>
			<BreadcrumbList className="text-xs sm:text-sm font-medium">
				{items.map((item, index) => {
					const isLast = index === items.length - 1;
					return (
						<React.Fragment key={item.label}>
							<BreadcrumbItem>
								{item.isCurrent || isLast ? (
									<BreadcrumbPage
										className={item.isCode ? "font-mono text-primary font-bold text-xs sm:text-sm" : "text-foreground font-semibold"}
									>
										{item.label}
									</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link
											to={item.href}
											className="text-muted-foreground hover:text-foreground transition-colors"
										>
											{item.label}
										</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator />}
						</React.Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

export default WorkspaceBreadcrumb;
