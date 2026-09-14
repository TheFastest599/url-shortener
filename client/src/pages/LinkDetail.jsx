import * as React from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
	useUrlByCodeQuery,
	useUrlByIdQuery,
	useDeleteUrlMutation,
	useAnalyticsOverview,
	useAbTestQuery,
	useCampaignsQuery,
} from "@/queries";
import { queryKeys } from "@/queries/queryKeys";
import { updateUrl } from "@/api/url";
import { ROUTES } from "@/routes/paths";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import {
	LinkDetailHeader,
	LinkConfigCard,
	LinkAbTestWidget,
	LinkTelemetrySnapshot,
	LinkQrCard,
	DeleteLinkDialog,
} from "@/components/links";

/* Hallmark · page: Link Detail Workbench · decomposed into modular components */

export function LinkDetailPage() {
	const params = useParams();
	const codeOrId = params.codeOrId || params.shortCode || params.id;
	const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(codeOrId || "");

	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { onOpenQrModal } = useOutletContext() || {};

	const [isDeleting, setIsDeleting] = React.useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

	const { data: urlDataById, isLoading: isLoadingById, refetch: refetchById } = useUrlByIdQuery(codeOrId, {
		enabled: !isDeleting && isUuid && !!codeOrId,
	});

	const { data: urlDataByCode, isLoading: isLoadingByCode, refetch: refetchByCode } = useUrlByCodeQuery(codeOrId, {
		enabled: !isDeleting && !isUuid && !!codeOrId,
	});

	const urlData = isUuid ? urlDataById : urlDataByCode;
	const isLoading = isUuid ? isLoadingById : isLoadingByCode;
	const refetch = isUuid ? refetchById : refetchByCode;
	const shortCode = urlData?.shortCode || (!isUuid ? codeOrId : "");

	const updateMutation = useMutation({
		mutationFn: (payload) => updateUrl(payload.id || urlData?.id, payload),
		onSuccess: () => {
			toast.success("Short URL updated successfully");
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.lists() });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.byCode(shortCode) });
			queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
			refetch();
		},
		onError: (err) => {
			toast.error(err?.response?.data?.message || "Failed to update short URL");
		},
	});

	const deleteMutation = useDeleteUrlMutation({
		onSuccess: () => {
			toast.success("Short URL deleted");
			navigate(ROUTES.REDIRECT_LINKS);
		},
		onError: (err) => {
			setIsDeleting(false);
			toast.error(err?.response?.data?.message || "Failed to delete short URL");
		},
	});

	// Analytics preview
	const { data: analytics } = useAnalyticsOverview(shortCode, {
		days: 7,
		includeBots: true,
		enabled: !isDeleting && !!shortCode,
	});

	// A/B Test Query
	const { data: abTest } = useAbTestQuery(shortCode, {
		enabled: !isDeleting && !!shortCode && !!urlData?.isAbTest,
	});

	// Campaigns Query
	const { data: userCampaigns = [] } = useCampaignsQuery();

	const handleDeleteConfirm = () => {
		if (!urlData?.id) return;
		setIsDeleting(true);
		setDeleteDialogOpen(false);
		queryClient.cancelQueries({ queryKey: queryKeys.urls.byCode(shortCode) });
		queryClient.removeQueries({ queryKey: queryKeys.urls.byCode(shortCode) });
		queryClient.removeQueries({ queryKey: queryKeys.analytics.all(shortCode) });
		deleteMutation.mutate(urlData.id);
	};

	if (isLoading) {
		return (
			<div className="space-y-6 max-w-5xl mx-auto py-4">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-5xl mx-auto">
			{/* 1. Header & Quick Actions */}
			<LinkDetailHeader
				shortCode={shortCode}
				isActive={urlData?.isActive !== false}
				isAbTest={!!urlData?.isAbTest}
				onOpenQrModal={onOpenQrModal}
				onDeleteClick={() => setDeleteDialogOpen(true)}
			/>

			{/* 2. Details Layout Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Main Column: Config & A/B Widgets */}
				<div className="md:col-span-2 space-y-6">
					<LinkConfigCard
						key={urlData?.id}
						url={urlData}
						campaigns={userCampaigns}
						onSave={(payload) => updateMutation.mutate(payload)}
						isSaving={updateMutation.isPending}
					/>

					<LinkAbTestWidget
						isAbTest={!!urlData?.isAbTest}
						abTest={abTest}
					/>
				</div>

				{/* Side Column: Telemetry Snapshot & QR Card */}
				<div className="space-y-6">
					<LinkTelemetrySnapshot
						shortCode={shortCode}
						analytics={analytics}
					/>

					<LinkQrCard
						shortCode={shortCode}
						onOpenQrModal={onOpenQrModal}
					/>
				</div>
			</div>

			{/* 3. Delete Confirmation Alert Dialog */}
			<DeleteLinkDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				url={urlData}
				onConfirm={handleDeleteConfirm}
				isDeleting={deleteMutation.isPending}
			/>
		</div>
	);
}

export default LinkDetailPage;
