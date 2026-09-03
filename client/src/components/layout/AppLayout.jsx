import * as React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navbar";
import { AppSidebar, SidebarNavContent } from "@/components/dashboard/app-sidebar";
import { WorkspaceBreadcrumb } from "@/components/layout/WorkspaceBreadcrumb";
import { CreateLinkModal } from "@/components/dashboard/create-link-modal";
import { QrCodeModal } from "@/components/dashboard/qr-code-modal";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { useUrlsQuery } from "@/queries";
import { ChevronRight } from "lucide-react";

export function AppLayout() {
	const { data: urls = [] } = useUrlsQuery();
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [qrModalUrl, setQrModalUrl] = React.useState(null);
	const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

	const handleOpenCreateModal = (initialUrl = "") => {
		setIsCreateOpen(true);
	};

	const handleOpenQrModal = (url) => {
		setQrModalUrl(url);
	};

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
			{/* 1. Shared Universal Top Navbar (Shared by ALL pages) */}
			<Navbar />

			{/* 2. Workspace Body Shell */}
			<div className="flex flex-1 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
				{/* Desktop-only Fixed Left Sidebar (w-60, no squishing, clean) */}
				<AppSidebar totalLinksCount={urls.length} />

				{/* Main Workspace Area (Breadcrumb Bar + Page Content) */}
				<div className="flex-1 flex flex-col min-w-0">
					{/* Shared Workspace Sub-Header with Mobile '>' Button and Breadcrumbs */}
					<header className="flex h-11 sm:h-12 items-center gap-2 border-b border-border/60 px-4 sm:px-6 lg:px-8 bg-card/40 backdrop-blur-xs shrink-0">
						{/* Mobile '>' Chevron Sidebar Toggle Button - HIDDEN on desktop */}
						<button
							onClick={() => setMobileSidebarOpen(true)}
							className="md:hidden inline-flex size-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-2xs shrink-0"
							aria-label="Open sidebar menu"
							title="Open sidebar"
						>
							<ChevronRight className="size-4" />
						</button>

						{/* Shared Breadcrumbs for All Pages */}
						<div className="flex-1 min-w-0">
							<WorkspaceBreadcrumb />
						</div>
					</header>

					{/* Active Workspace Page View */}
					<main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
						<Outlet
							context={{
								urls,
								onOpenCreateModal: handleOpenCreateModal,
								onOpenQrModal: handleOpenQrModal,
							}}
						/>
					</main>
				</div>
			</div>

			{/* 3. Mobile Slide-Over Sheet Drawer */}
			<Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
				<SheetContent side="left" className="w-68 p-4 pt-6 bg-card">
					<SheetHeader className="sr-only">
						<SheetTitle>Navigation Menu</SheetTitle>
						<SheetDescription>Mobile Workspace Navigation</SheetDescription>
					</SheetHeader>
					<SidebarNavContent
						totalLinksCount={urls.length}
						onItemClick={() => setMobileSidebarOpen(false)}
					/>
				</SheetContent>
			</Sheet>

			{/* 4. Global Workspace Modals */}
			<CreateLinkModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				onOpenQrModal={handleOpenQrModal}
			/>

			<QrCodeModal
				open={!!qrModalUrl}
				onOpenChange={(open) => {
					if (!open) setQrModalUrl(null);
				}}
				url={qrModalUrl}
			/>
		</div>
	);
}

export default AppLayout;
