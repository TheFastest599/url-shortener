import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { QuickStatCards } from "@/components/dashboard/quick-stat-cards";
import { LinksTable } from "@/components/dashboard/links-table";
import { CreateLinkModal } from "@/components/dashboard/create-link-modal";
import { QrCodeModal } from "@/components/dashboard/qr-code-modal";
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview";
import { UtmBuilderView } from "@/components/dashboard/utm-builder-view";
import { useUrlsQuery, useAnalyticsOverview } from "@/queries";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	IconPlus,
	IconSparkles,
	IconRefresh,
	IconBolt,
	IconServer,
	IconLayoutDashboard,
	IconLink,
	IconAdjustments,
	IconChartBar,
} from "@tabler/icons-react";

export function DashboardPage() {
	const { user } = useAuthStore();
	const [activeTab, setActiveTab] = React.useState("overview");
	const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
	const [createModalInitialUrl, setCreateModalInitialUrl] = React.useState("");
	const [qrModalUrl, setQrModalUrl] = React.useState(null);
	const [selectedAnalyticsCode, setSelectedAnalyticsCode] = React.useState(null);

	const handleOpenCreateModal = (initialUrl = "") => {
		setCreateModalInitialUrl(initialUrl || "");
		setIsCreateModalOpen(true);
	};

	// Fetch all short URLs for authenticated user
	const { data: urls = [], isLoading: isLoadingUrls, refetch: refetchUrls, isRefetching } = useUrlsQuery();

	// Fetch primary overview analytics for the first link or test link
	const activeShortCode = selectedAnalyticsCode || (urls.length > 0 ? urls[0].shortCode : "e2e-4968");
	const { data: analytics } = useAnalyticsOverview(activeShortCode, {
		days: 30,
		includeBots: true,
		enabled: !!activeShortCode,
	});

	const handleSelectAnalytics = (shortCode) => {
		setSelectedAnalyticsCode(shortCode);
		setActiveTab("analytics");
	};

	const tabTitles = {
		overview: {
			title: "Workspace Overview",
			subtitle: "Real-time metrics, recent short links, and high-velocity routing",
		},
		links: {
			title: "Short URLs & Aliases",
			subtitle: "Manage, filter, generate QR codes, and copy active redirection links",
		},
		utm: {
			title: "Campaign & UTM Builder",
			subtitle: "Construct trackable campaign destination URLs with Google Analytics presets",
		},
		analytics: {
			title: "Real-Time Telemetry Hub",
			subtitle: "Live Kafka stream aggregations, bot detection, and geographic distribution",
		},
	};

	return (
		<SidebarProvider defaultOpen={true}>
			<AppSidebar
				activeTab={activeTab}
				onTabChange={setActiveTab}
				totalLinksCount={urls.length}
				onOpenCreateModal={() => handleOpenCreateModal()}
			/>

			<SidebarInset>
				{/* Sticky Top Header Bar */}
				<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
					<div className="flex items-center gap-2 sm:gap-3">
						<SidebarTrigger />
						<div className="h-4 w-px bg-border/80 hidden sm:block" />
						<div className="flex items-center gap-2">
							<span className="text-xs sm:text-sm font-semibold text-foreground">
								{tabTitles[activeTab]?.title}
							</span>
							<Badge variant="secondary" className="hidden md:inline-flex text-[10px] uppercase font-mono px-1.5 py-0">
								{user?.role || "USER"}
							</Badge>
						</div>
					</div>

					{/* Right Action Cluster */}
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon-sm"
							onClick={() => refetchUrls()}
							disabled={isRefetching}
							className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
							title="Refresh Data"
						>
							<IconRefresh className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`} />
						</Button>

						<ThemeToggle size="icon-sm" />

						<Button
							size="sm"
							onClick={() => handleOpenCreateModal()}
							className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
						>
							<IconPlus className="size-3.5" />
							<span className="hidden sm:inline">Create Link</span>
						</Button>
					</div>
				</header>

				{/* Main Content Body */}
				<div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
					{/* Welcome Header */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<div>
							<h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
								Welcome back, <span className="text-primary">{user?.username || "Developer"}</span>
							</h1>
							<p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
								{tabTitles[activeTab]?.subtitle}
							</p>
						</div>

						<div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-border/80 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
							<span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
							<span className="font-mono text-[11px]">API Gateway: 8080 · Active</span>
						</div>
					</div>

					{/* Tab 1: Overview */}
					{activeTab === "overview" && (
						<div className="space-y-6">
							{/* Quick Stat Cards */}
							<QuickStatCards
								urls={urls}
								totalClicks={analytics?.totalClicks || 0}
								humanClicks={analytics?.humanClicks || 0}
								botClicks={analytics?.botClicks || 0}
							/>

							{/* Recent Links Table */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h2 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
										<IconLink className="size-4 text-primary" />
										<span>Recent Short Links</span>
									</h2>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setActiveTab("links")}
										className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
									>
										View All ({urls.length})
									</Button>
								</div>

								<LinksTable
									urls={urls.slice(0, 5)}
									isLoading={isLoadingUrls}
									onOpenCreateModal={() => handleOpenCreateModal()}
									onOpenQrModal={(url) => setQrModalUrl(url)}
									onSelectAnalytics={handleSelectAnalytics}
								/>
							</div>

							{/* Live Analytics Telemetry Snippet */}
							<div className="space-y-3 pt-2">
								<div className="flex items-center justify-between">
									<h2 className="text-base font-heading font-semibold text-foreground flex items-center gap-2">
										<IconChartBar className="size-4 text-primary" />
										<span>Click Telemetry & Trends</span>
									</h2>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setActiveTab("analytics")}
										className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
									>
										Open Full Telemetry Hub
									</Button>
								</div>

								<AnalyticsOverview
									urls={urls}
									selectedShortCode={activeShortCode}
								/>
							</div>
						</div>
					)}

					{/* Tab 2: Links Table */}
					{activeTab === "links" && (
						<div className="space-y-4">
							<LinksTable
								urls={urls}
								isLoading={isLoadingUrls}
								onOpenCreateModal={() => handleOpenCreateModal()}
								onOpenQrModal={(url) => setQrModalUrl(url)}
								onSelectAnalytics={handleSelectAnalytics}
							/>
						</div>
					)}

					{/* Tab 3: UTM Builder */}
					{activeTab === "utm" && (
						<UtmBuilderView
							onOpenCreateModal={(url) => handleOpenCreateModal(url)}
						/>
					)}

					{/* Tab 4: Analytics Hub */}
					{activeTab === "analytics" && (
						<AnalyticsOverview
							urls={urls}
							selectedShortCode={activeShortCode}
						/>
					)}
				</div>
			</SidebarInset>

			{/* Global Create Short Link Modal */}
			<CreateLinkModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onOpenQrModal={(url) => setQrModalUrl(url)}
				initialDestinationUrl={createModalInitialUrl}
			/>

			{/* Global QR Code Modal */}
			<QrCodeModal
				open={!!qrModalUrl}
				onOpenChange={(open) => !open && setQrModalUrl(null)}
				url={qrModalUrl}
			/>
		</SidebarProvider>
	);
}

export default DashboardPage;
