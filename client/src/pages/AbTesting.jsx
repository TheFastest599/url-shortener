import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	useUrlsQuery,
	useConfigureAbTestMutation,
	useUpdateAbTestStatusMutation,
	useDeleteAbTestMutation,
} from "@/queries";
import { queryKeys } from "@/queries/queryKeys";
import { getAbTest } from "@/api/abTesting";
import { getOverview } from "@/api/analytics";
import { ROUTES } from "@/routes/paths";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
	IconFlask,
	IconPlus,
	IconPlayerPlay,
	IconPlayerPause,
	IconTrophy,
	IconTrash,
	IconChartBar,
	IconAdjustments,
	IconCheck,
	IconRefresh,
	IconExternalLink,
	IconScale,
	IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";

/* Hallmark · page: A/B Testing Experiments · macrostructure: Workbench · theme: modern-minimal */

const initialFormState = {
	shortCode: "",
	name: "",
	cookieDays: 30,
	variants: [
		{ key: "A", destinationUrl: "", weight: 50, isControl: true },
		{ key: "B", destinationUrl: "", weight: 50, isControl: false },
	],
};

export function AbTestingPage() {
	const queryClient = useQueryClient();

	// 1. Initial URLs query to discover which links have A/B experiments
	const { data: serverUrls, isLoading: urlsLoading, refetch: refetchUrls } = useUrlsQuery({
		page: 0,
		size: 100,
		sortBy: "createdAt",
		direction: "DESC",
	});

	const urls = React.useMemo(() => {
		return Array.isArray(serverUrls) ? serverUrls : serverUrls?.content || [];
	}, [serverUrls]);

	const abUrls = React.useMemo(() => {
		return urls.filter((u) => u.isAbTest === true);
	}, [urls]);

	// 2. Load all A/B experiment data & telemetry directly via React Query
	const {
		data: experimentsData = {},
		isLoading: loadingExperiments,
		isFetching: fetchingExperiments,
		refetch: refetchExperiments,
	} = useQuery({
		queryKey: queryKeys.abTesting.all,
		queryFn: async () => {
			const map = {};
			await Promise.all(
				abUrls.map(async (u) => {
					try {
						const exp = await getAbTest(u.shortCode);
						let variantStats = [];
						try {
							const ana = await getOverview(u.shortCode, 30, true);
							variantStats = ana?.variantBreakdown || [];
						} catch {}
						map[u.shortCode] = { exp, variantStats };
					} catch {}
				})
			);
			return map;
		},
		enabled: abUrls.length > 0,
		staleTime: 1000 * 60, // 1 minute cache
	});

	// 3. Simple merged state management (Only 3 useStates across the entire page!)
	const [dialog, setDialog] = React.useState({
		create: false,
		promote: null,      // experiment object being promoted
		winnerKey: "",      // winning variant key
		deleteCode: null,   // string shortCode to delete
	});

	const [form, setForm] = React.useState(initialFormState);

	const [search, setSearch] = React.useState({
		filter: "",               // filter query for experiments on the page
		linkQuery: "",            // typing in "Select Short Link to Test"
		debouncedLinkQuery: "",   // 300ms debounced backend search query
	});

	// 300ms debounce effect for candidate URL backend search
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setSearch((prev) => ({ ...prev, debouncedLinkQuery: prev.linkQuery }));
		}, 300);
		return () => clearTimeout(timer);
	}, [search.linkQuery]);

	// Backend URL search for candidate short links (direct API query, no in-memory filtering)
	const { data: serverCandidates, isFetching: isSearchingUrls } = useUrlsQuery(
		{
			search: search.debouncedLinkQuery.trim() || undefined,
			page: 0,
			size: 8,
		},
		{
			enabled: dialog.create && !form.shortCode,
		}
	);

	const candidateUrls = React.useMemo(() => {
		return Array.isArray(serverCandidates) ? serverCandidates : serverCandidates?.content || [];
	}, [serverCandidates]);

	// Filter experiments on page by name or shortCode
	const filteredAbUrls = React.useMemo(() => {
		if (!search.filter.trim()) return abUrls;
		const q = search.filter.toLowerCase().trim();
		return abUrls.filter((u) => {
			const exp = experimentsData[u.shortCode]?.exp;
			return (
				u.shortCode.toLowerCase().includes(q) ||
				u.destinationUrl.toLowerCase().includes(q) ||
				(exp?.name && exp.name.toLowerCase().includes(q))
			);
		});
	}, [abUrls, experimentsData, search.filter]);

	// 4. Mutations with automatic invalidation and refresh
	const configureMutation = useConfigureAbTestMutation({
		onSuccess: () => {
			setDialog((d) => ({ ...d, create: false }));
			setForm(initialFormState);
			setSearch((s) => ({ ...s, linkQuery: "", debouncedLinkQuery: "" }));
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchUrls();
			refetchExperiments();
		},
	});

	const updateStatusMutation = useUpdateAbTestStatusMutation({
		onSuccess: () => {
			setDialog((d) => ({ ...d, promote: null, winnerKey: "" }));
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchUrls();
			refetchExperiments();
		},
	});

	const deleteMutation = useDeleteAbTestMutation({
		onSuccess: () => {
			setDialog((d) => ({ ...d, deleteCode: null }));
			queryClient.invalidateQueries({ queryKey: queryKeys.abTesting.all });
			queryClient.invalidateQueries({ queryKey: queryKeys.urls.all });
			refetchUrls();
			refetchExperiments();
		},
	});

	// Form helpers
	const currentTotalWeight = form.variants.reduce((sum, v) => sum + (parseInt(v.weight, 10) || 0), 0);
	const isWeightValid = currentTotalWeight === 100;

	const handleVariantWeightChange = (index, value) => {
		const parsed = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
		setForm((prev) => {
			const updated = [...prev.variants];
			updated[index] = { ...updated[index], weight: parsed };
			return { ...prev, variants: updated };
		});
	};

	const handleEqualSplit = () => {
		const count = form.variants.length;
		if (count === 0) return;
		const base = Math.floor(100 / count);
		const remainder = 100 - base * count;

		setForm((prev) => ({
			...prev,
			variants: prev.variants.map((v, i) => ({
				...v,
				weight: i === 0 ? base + remainder : base,
			})),
		}));
	};

	const handleAddVariant = () => {
		if (form.variants.length >= 4) {
			toast.info("Maximum of 4 variants allowed per experiment");
			return;
		}
		const keys = ["A", "B", "C", "D"];
		const nextKey = keys[form.variants.length] || `V${form.variants.length + 1}`;
		setForm((prev) => ({
			...prev,
			variants: [
				...prev.variants,
				{ key: nextKey, destinationUrl: "", weight: 0, isControl: false },
			],
		}));
	};

	const handleRemoveVariant = (index) => {
		if (form.variants.length <= 2) {
			toast.info("At least two variants are required for an A/B test");
			return;
		}
		setForm((prev) => ({
			...prev,
			variants: prev.variants.filter((_, i) => i !== index),
		}));
	};

	const handleCreateSubmit = (e) => {
		e.preventDefault();
		if (!form.shortCode.trim()) {
			toast.error("Please select a short link to test");
			return;
		}
		if (!form.name.trim()) {
			toast.error("Experiment name is required");
			return;
		}
		if (!isWeightValid) {
			toast.error(`Variant weights must sum to exactly 100% (currently: ${currentTotalWeight}%)`);
			return;
		}

		for (const v of form.variants) {
			if (!v.destinationUrl.trim()) {
				toast.error(`Destination URL for Variant ${v.key} is required`);
				return;
			}
		}

		const payload = {
			name: form.name.trim(),
			cookieTtlSeconds: (parseInt(form.cookieDays, 10) || 30) * 86400,
			variants: form.variants.map((v) => ({
				key: v.key,
				destinationUrl: v.destinationUrl.trim(),
				weight: parseInt(v.weight, 10),
				isControl: !!v.isControl,
			})),
		};

		configureMutation.mutate({ shortCode: form.shortCode.trim(), payload });
	};

	const handleToggleStatus = (shortCode, currentStatus) => {
		const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
		updateStatusMutation.mutate({
			shortCode,
			payload: { status: newStatus },
		});
	};

	const handleOpenPromote = (exp, shortCode) => {
		setDialog((d) => ({
			...d,
			promote: { ...exp, shortCode },
			winnerKey: exp?.variants?.[0]?.key || "A",
		}));
	};

	const handleConfirmPromote = () => {
		if (!dialog.promote?.shortCode || !dialog.winnerKey) return;
		updateStatusMutation.mutate({
			shortCode: dialog.promote.shortCode,
			payload: {
				status: "CONCLUDED",
				winningVariant: dialog.winnerKey,
			},
		});
	};

	// Statistics
	const totalExperimentsCount = abUrls.length;
	const activeExperimentsCount = Object.values(experimentsData).filter((d) => d?.exp?.status === "ACTIVE").length;
	const concludedExperimentsCount = Object.values(experimentsData).filter((d) => d?.exp?.status === "CONCLUDED").length;

	return (
		<div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
			{/* 1. Header Banner */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
				<div>
					<h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
						<IconFlask className="size-7 text-primary" />
						<span>A/B Split Testing & Traffic Routing</span>
					</h1>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						Split incoming redirect traffic across multi-variant destinations with session cookie stickiness and automated winner promotion.
					</p>
				</div>

				<div className="flex items-center gap-2.5 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetchExperiments()}
						disabled={fetchingExperiments}
						className="gap-1.5 text-xs h-9 cursor-pointer shadow-2xs"
						title="Refresh experiments"
					>
						<IconRefresh className={`size-4 ${fetchingExperiments ? "animate-spin" : ""}`} />
						<span>Refresh</span>
					</Button>

					<Button
						size="sm"
						onClick={() => {
							setForm(initialFormState);
							setSearch((s) => ({ ...s, linkQuery: "", debouncedLinkQuery: "" }));
							setDialog((d) => ({ ...d, create: true }));
						}}
						className="gap-1.5 text-xs h-9 font-semibold cursor-pointer shadow-xs"
					>
						<IconPlus className="size-4" />
						<span>New A/B Test</span>
					</Button>
				</div>
			</div>

			{/* 2. Top Summary KPI Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Total Experiments
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-foreground mt-0.5 sm:mt-1">
								{totalExperimentsCount}
							</div>
							<div className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
								Configured split links
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary border border-primary/20">
							<IconFlask className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Running Active Tests
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-emerald-500 mt-0.5 sm:mt-1">
								{activeExperimentsCount}
							</div>
							<div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
								Live traffic splits
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
							<IconScale className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/70 bg-card shadow-xs col-span-2 sm:col-span-1">
					<CardContent className="p-3 sm:p-4 lg:p-5 flex items-start sm:items-center justify-between gap-2">
						<div className="min-w-0">
							<div className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
								Concluded / Winners
							</div>
							<div className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading text-amber-500 mt-0.5 sm:mt-1">
								{concludedExperimentsCount}
							</div>
							<div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium truncate">
								Promoted targets
							</div>
						</div>
						<div className="flex size-7 sm:size-9 lg:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
							<IconTrophy className="size-3.5 sm:size-4.5 lg:size-5" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 3. Toolbar: Following Campaign Page with direct search bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
				<div className="flex items-center gap-2">
					<h2 className="text-sm sm:text-base font-semibold font-heading text-foreground">
						Experiments List ({abUrls.length})
					</h2>
				</div>

				<div className="relative w-full sm:w-64">
					<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
					<Input
						value={search.filter}
						onChange={(e) => setSearch((prev) => ({ ...prev, filter: e.target.value }))}
						placeholder="Search experiments..."
						className="pl-9 h-8.5 text-xs bg-card"
					/>
				</div>
			</div>

			{/* 4. Experiments Cards */}
			<div className="space-y-4">
				{filteredAbUrls.length > 0 ? (
					<div className="grid grid-cols-1 gap-4 sm:gap-5">
						{filteredAbUrls.map((url) => {
							const expItem = experimentsData[url.shortCode];
							const exp = expItem?.exp;
							const variantStats = expItem?.variantStats || [];
							const status = exp?.status || "ACTIVE";
							const isPaused = status === "PAUSED";
							const isConcluded = status === "CONCLUDED";

							return (
								<Card key={url.shortCode} className="border-border/70 bg-card overflow-hidden shadow-xs">
									{/* Experiment Header */}
									<div className="p-4 sm:p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
										<div className="space-y-1 min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-heading text-base font-bold text-foreground">
													{exp?.name || "A/B Experiment"}
												</span>
												<Badge
													variant={isConcluded ? "secondary" : isPaused ? "outline" : "default"}
													className={`text-[10px] font-semibold ${
														status === "ACTIVE"
															? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
															: isPaused
															? "text-amber-500 border-amber-500/30"
															: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
													}`}
												>
													{status}
												</Badge>
												{isConcluded && exp?.winningVariant && (
													<Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/40 gap-1">
														<IconTrophy className="size-3" />
														<span>Winner: Variant {exp.winningVariant}</span>
													</Badge>
												)}
											</div>
											<div className="text-xs text-muted-foreground flex items-center gap-2">
												<span>Shortcode:</span>
												<Link
													to={`/redirect-links/${url.shortCode}`}
													className="font-mono font-semibold text-primary hover:underline"
												>
													/r/{url.shortCode}
												</Link>
												<span className="text-border">|</span>
												<span>Cookie Stickiness: {Math.round((exp?.cookieTtlSeconds || 2592000) / 86400)} days</span>
											</div>
										</div>

										{/* Actions */}
										<div className="flex items-center gap-2 shrink-0">
											{!isConcluded && (
												<>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleToggleStatus(url.shortCode, status)}
														className="text-xs h-8 gap-1.5 cursor-pointer shadow-2xs"
														title={isPaused ? "Resume Experiment" : "Pause Traffic Split"}
													>
														{isPaused ? (
															<>
																<IconPlayerPlay className="size-3.5 text-emerald-500" />
																<span>Resume</span>
															</>
														) : (
															<>
																<IconPlayerPause className="size-3.5 text-amber-500" />
																<span>Pause</span>
															</>
														)}
													</Button>

													<Button
														variant="outline"
														size="sm"
														onClick={() => handleOpenPromote(exp, url.shortCode)}
														className="text-xs h-8 gap-1.5 cursor-pointer text-amber-500 border-amber-500/30 hover:bg-amber-500/10 shadow-2xs"
														title="Declare winner and promote to single destination"
													>
														<IconTrophy className="size-3.5" />
														<span>Promote Winner</span>
													</Button>
												</>
											)}

											<Link to={`/analytics/${url.shortCode}`}>
												<Button
													variant="outline"
													size="sm"
													className="text-xs h-8 gap-1.5 cursor-pointer shadow-2xs"
													title="Inspect telemetry"
												>
													<IconChartBar className="size-3.5 text-primary" />
													<span>Telemetry</span>
												</Button>
											</Link>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => setDialog((d) => ({ ...d, deleteCode: url.shortCode }))}
												className="text-xs h-8 text-destructive hover:bg-destructive/10 cursor-pointer"
												title="Remove A/B test"
											>
												<IconTrash className="size-3.5" />
											</Button>
										</div>
									</div>

									{/* Multi-Segment Traffic Split Bar */}
									{exp?.variants && exp.variants.length > 0 && (
										<div className="px-4 sm:px-5 pt-4">
											<div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
												<span>Allocated Traffic Ratio</span>
												<span className="font-mono text-foreground font-bold">100% Total Split</span>
											</div>
											<div className="h-3 w-full rounded-full overflow-hidden flex bg-muted border border-border/60 shadow-inner">
												{exp.variants.map((v, i) => {
													const colors = [
														"bg-primary",
														"bg-blue-500",
														"bg-purple-500",
														"bg-amber-500",
													];
													const barColor = colors[i % colors.length];

													return (
														<div
															key={v.key}
															style={{ width: `${v.weight}%` }}
															className={`h-full ${barColor} transition-all relative group/seg`}
															title={`Variant ${v.key}: ${v.weight}% traffic`}
														>
															<span className="sr-only">{v.key} {v.weight}%</span>
														</div>
													);
												})}
											</div>
										</div>
									)}

									{/* Variants Table */}
									<CardContent className="p-4 sm:p-5 pt-3">
										<div className="overflow-x-auto">
											<table className="w-full text-xs text-left">
												<thead>
													<tr className="border-b border-border/40 text-muted-foreground font-medium">
														<th className="py-2 px-2">Variant</th>
														<th className="py-2 px-3">Type</th>
														<th className="py-2 px-3">Destination URL Target</th>
														<th className="py-2 px-3 text-center">Allocated Weight</th>
														<th className="py-2 px-3 text-center">Observed Clicks</th>
														<th className="py-2 px-2 text-right">Actions</th>
													</tr>
												</thead>
												<tbody className="divide-y divide-border/30">
													{exp?.variants?.map((v) => {
														const stat = variantStats.find(
															(s) => s.label?.toUpperCase() === v.key?.toUpperCase()
														);
														const clicks = stat?.count ?? 0;
														const isWinner = exp?.winningVariant?.toUpperCase() === v.key?.toUpperCase();

														return (
															<tr key={v.key} className="hover:bg-muted/20 transition-colors">
																<td className="py-2.5 px-2 font-mono font-bold text-foreground">
																	<div className="flex items-center gap-1.5">
																		<span className="size-5 rounded-md bg-muted flex items-center justify-center text-[11px] font-bold">
																			{v.key}
																		</span>
																		{isWinner && (
																			<IconTrophy className="size-3.5 text-amber-500" title="Promoted Winner" />
																		)}
																	</div>
																</td>
																<td className="py-2.5 px-3">
																	{v.isControl ? (
																		<Badge variant="outline" className="text-[10px]">
																			Control
																		</Badge>
																	) : (
																		<span className="text-muted-foreground text-[11px]">Variant</span>
																	)}
																</td>
																<td className="py-2.5 px-3 max-w-xs md:max-w-md truncate font-mono text-muted-foreground" title={v.destinationUrl}>
																	{v.destinationUrl}
																</td>
																<td className="py-2.5 px-3 text-center font-mono font-semibold text-foreground">
																	{v.weight}%
																</td>
																<td className="py-2.5 px-3 text-center font-mono">
																	<Badge variant="secondary" className="text-[11px]">
																		{clicks} clicks
																	</Badge>
																</td>
																<td className="py-2.5 px-2 text-right">
																	<a
																		href={v.destinationUrl}
																		target="_blank"
																		rel="noreferrer"
																		className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
																		title="Open variant target"
																	>
																		<IconExternalLink className="size-3.5" />
																	</a>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				) : (
					<Card className="border-dashed border-border/80 bg-muted/10 p-8 sm:p-12 text-center">
						<div className="max-w-md mx-auto space-y-3">
							<div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
								<IconFlask className="size-6" />
							</div>
							<h3 className="font-heading font-bold text-base text-foreground">
								{search.filter.trim() ? "No Matching Experiments Found" : "No A/B Testing Experiments Yet"}
							</h3>
							<p className="text-xs text-muted-foreground">
								{search.filter.trim()
									? "Try searching for another experiment name or shortcode."
									: "Select any of your short links to start a split experiment. Compare headline variants, landing page layouts, or offer prices with automated cookie stickiness."}
							</p>
							{!search.filter.trim() && (
								<div className="pt-2">
									<Button
										size="sm"
										onClick={() => {
											setForm(initialFormState);
											setSearch((s) => ({ ...s, linkQuery: "", debouncedLinkQuery: "" }));
											setDialog((d) => ({ ...d, create: true }));
										}}
										className="gap-1.5 text-xs font-semibold cursor-pointer"
									>
										<IconPlus className="size-3.5" />
										<span>Create First Experiment</span>
									</Button>
								</div>
							)}
						</div>
					</Card>
				)}
			</div>

			{/* 5. New A/B Experiment Modal with Direct Backend Debounced Search */}
			<Dialog
				open={dialog.create}
				onOpenChange={(open) => setDialog((d) => ({ ...d, create: open }))}
			>
				<DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<IconFlask className="size-5 text-primary" />
							<span>Configure A/B Split Experiment</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							Define variant URLs and allocated traffic weights. Cookie stickiness ensures a visitor continues to see the same variant across sessions.
						</DialogDescription>
					</DialogHeader>

					<form id="ab-create-form" onSubmit={handleCreateSubmit} className="space-y-4 py-2 overflow-y-auto pr-1 flex-1 min-h-0">
						{/* Target URL Selector with Direct Backend Debounced Search (No dropdown selects!) */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground">Select Short Link to Test</label>
							
							{form.shortCode ? (
								<div className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5">
									<div className="space-y-0.5 min-w-0">
										<div className="flex items-center gap-2">
											<IconCheck className="size-4 text-primary shrink-0" />
											<span className="font-mono font-bold text-xs text-primary">/r/{form.shortCode}</span>
											<Badge variant="outline" className="text-[10px]">Selected Target</Badge>
										</div>
										<p className="text-[11px] font-mono text-muted-foreground truncate max-w-sm">
											{form.variants[0]?.destinationUrl || "Default redirect destination"}
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setForm((prev) => ({ ...prev, shortCode: "" }))}
										className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-8 px-2.5"
									>
										Change
									</Button>
								</div>
							) : (
								<div className="space-y-2">
									<div className="relative">
										<IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
										<Input
											value={search.linkQuery}
											onChange={(e) => setSearch((prev) => ({ ...prev, linkQuery: e.target.value }))}
											placeholder="Type shortcode or destination to search backend..."
											className="pl-9 pr-8 text-xs bg-card"
											autoFocus
										/>
										{isSearchingUrls && (
											<IconRefresh className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 animate-spin text-muted-foreground" />
										)}
									</div>

									<div className="max-h-36 overflow-y-auto no-scrollbar space-y-1 border border-border/60 rounded-xl p-1.5 bg-muted/20">
										{candidateUrls.length > 0 ? (
											candidateUrls.map((u) => (
												<button
													key={u.shortCode}
													type="button"
													onClick={() => {
														setForm((prev) => {
															const updated = [...prev.variants];
															if (u.destinationUrl) {
																updated[0] = { ...updated[0], destinationUrl: u.destinationUrl };
															}
															return {
																...prev,
																shortCode: u.shortCode,
																variants: updated,
															};
														});
													}}
													className="w-full text-left p-2 rounded-lg hover:bg-card hover:shadow-2xs flex items-center justify-between gap-3 text-xs transition-all cursor-pointer group"
												>
													<div className="space-y-0.5 min-w-0">
														<div className="flex items-center gap-2">
															<span className="font-mono font-bold text-primary group-hover:underline">
																/r/{u.shortCode}
															</span>
															{u.isAbTest && (
																<Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/30">
																	Has A/B Test
																</Badge>
															)}
														</div>
														<p className="text-[11px] font-mono text-muted-foreground truncate max-w-sm">
															{u.destinationUrl}
														</p>
													</div>
													<span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary shrink-0">
														Select &rarr;
													</span>
												</button>
											))
										) : (
											<div className="py-6 text-center text-xs text-muted-foreground">
												{isSearchingUrls ? "Searching backend..." : "No short links found. Try a different query."}
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Experiment Name */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">Experiment Name</label>
							<Input
								value={form.name}
								onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="e.g. Summer Landing Page Headline Split"
								className="text-xs"
								required
							/>
						</div>

						{/* Cookie Stickiness TTL */}
						<div className="space-y-1">
							<label className="text-xs font-semibold text-foreground">Visitor Cookie Stickiness (Days)</label>
							<Input
								type="number"
								min="1"
								max="365"
								value={form.cookieDays}
								onChange={(e) => setForm((prev) => ({ ...prev, cookieDays: parseInt(e.target.value, 10) || 30 }))}
								className="text-xs font-mono"
							/>
							<p className="text-[11px] text-muted-foreground">
								Subsequent visits by the same user within this window will land on their initial variant.
							</p>
						</div>

						{/* Variants Configuration */}
						<div className="space-y-3 pt-2 border-t border-border/50">
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<div className="text-xs font-bold text-foreground">Experiment Variants</div>
									<div className={`text-[11px] font-mono font-medium ${isWeightValid ? "text-emerald-500" : "text-amber-500"}`}>
										Total Weight: {currentTotalWeight}% {isWeightValid ? "✓ (Valid)" : "(Must sum to 100%)"}
									</div>
								</div>

								<div className="flex items-center gap-1.5">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleEqualSplit}
										className="text-[11px] h-7 px-2 cursor-pointer"
										title="Balance weights equally"
									>
										<span>Equal Split</span>
									</Button>
									{form.variants.length < 4 && (
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={handleAddVariant}
											className="text-[11px] h-7 px-2 cursor-pointer"
										>
											<IconPlus className="size-3 mr-1" />
											<span>Add Variant</span>
										</Button>
									)}
								</div>
							</div>

							<div className="space-y-2.5">
								{form.variants.map((v, idx) => (
									<div key={v.key} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												<Badge variant={v.isControl ? "default" : "secondary"} className="font-mono text-xs">
													Variant {v.key} {v.isControl ? "(Control)" : ""}
												</Badge>
											</div>

											<div className="flex items-center gap-2">
												<div className="flex items-center gap-1">
													<label className="text-[11px] text-muted-foreground">Weight:</label>
													<Input
														type="number"
														min="0"
														max="100"
														value={v.weight}
														onChange={(e) => handleVariantWeightChange(idx, e.target.value)}
														className="w-16 h-7 text-xs font-mono text-center p-1"
													/>
													<span className="text-xs font-mono text-muted-foreground">%</span>
												</div>

												{!v.isControl && form.variants.length > 2 && (
													<button
														type="button"
														onClick={() => handleRemoveVariant(idx)}
														className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
														title="Remove variant"
													>
														<IconTrash className="size-3.5" />
													</button>
												)}
											</div>
										</div>

										<Input
											type="url"
											value={v.destinationUrl}
											onChange={(e) => {
												const val = e.target.value;
												setForm((prev) => {
													const updated = [...prev.variants];
													updated[idx] = { ...updated[idx], destinationUrl: val };
													return { ...prev, variants: updated };
												});
											}}
											placeholder={`https://example.com/landing-page-${v.key.toLowerCase()}`}
											className="h-8 text-xs font-mono bg-background"
											required
										/>
									</div>
								))}
							</div>
						</div>
					</form>

					<DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50 shrink-0">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setDialog((d) => ({ ...d, create: false }))}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							form="ab-create-form"
							type="submit"
							size="sm"
							disabled={configureMutation.isPending || !isWeightValid}
							className="text-xs font-semibold"
						>
							{configureMutation.isPending ? "Configuring..." : "Launch A/B Test"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 6. Promote Winner Confirmation Modal */}
			<Dialog
				open={!!dialog.promote}
				onOpenChange={(open) => !open && setDialog((d) => ({ ...d, promote: null }))}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-amber-500">
							<IconTrophy className="size-5" />
							<span>Promote Winning Variant</span>
						</DialogTitle>
						<DialogDescription className="text-xs">
							Concluding the test sets the winner as the permanent destination target for <span className="font-mono font-bold text-foreground">/r/{dialog.promote?.shortCode}</span>.
							The A/B split will conclude and 100% of future traffic will route to this chosen variant.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-3">
						<label className="text-xs font-semibold text-foreground">Choose Winning Variant</label>
						<div className="space-y-2">
							{dialog.promote?.variants?.map((v) => (
								<label
									key={v.key}
									onClick={() => setDialog((d) => ({ ...d, winnerKey: v.key }))}
									className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
										dialog.winnerKey === v.key
											? "border-amber-500 bg-amber-500/10 text-foreground shadow-2xs"
											: "border-border bg-card text-muted-foreground hover:text-foreground"
									}`}
								>
									<input
										type="radio"
										name="winnerVariant"
										checked={dialog.winnerKey === v.key}
										onChange={() => setDialog((d) => ({ ...d, winnerKey: v.key }))}
										className="mt-0.5"
									/>
									<div className="space-y-0.5 min-w-0">
										<div className="text-xs font-bold text-foreground flex items-center gap-1.5">
											<span>Variant {v.key}</span>
											{v.isControl && <Badge variant="outline" className="text-[10px]">Control</Badge>}
										</div>
										<div className="text-[11px] font-mono truncate max-w-sm text-muted-foreground">
											{v.destinationUrl}
										</div>
									</div>
								</label>
							))}
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setDialog((d) => ({ ...d, promote: null }))}
							className="text-xs"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleConfirmPromote}
							disabled={updateStatusMutation.isPending || !dialog.winnerKey}
							className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
						>
							{updateStatusMutation.isPending ? "Promoting..." : "Crown Winner & Conclude"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 7. Official Shadcn Alert Dialog for A/B Test Deletion */}
			<AlertDialog
				open={!!dialog.deleteCode}
				onOpenChange={(open) => !open && setDialog((d) => ({ ...d, deleteCode: null }))}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove A/B Experiment?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove the A/B test on <span className="font-mono font-bold text-foreground">/r/{dialog.deleteCode}</span>?
							Traffic redirection will immediately fall back to the root destination target.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDialog((d) => ({ ...d, deleteCode: null }))}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								if (dialog.deleteCode) {
									deleteMutation.mutate(dialog.deleteCode);
								}
							}}
							disabled={deleteMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
						>
							{deleteMutation.isPending ? "Deleting..." : "Remove Experiment"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default AbTestingPage;
