import * as React from "react";
import {
	Combobox,
	ComboboxInput,
	ComboboxContent,
	ComboboxList,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxGroup,
} from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * High-level SearchCombobox built directly on top of the official shadcn Combobox components.
 * Eliminates all native HTML <select> dropdowns in favor of searchable, keyboard-friendly selection.
 */
export function SearchCombobox({
	items = [],
	value,
	onValueChange,
	placeholder = "Search or select...",
	emptyMessage = "No matches found.",
	className = "",
	disabled = false,
	onSearchChange,
	isLoading = false,
	remote = false,
}) {
	const [search, setSearch] = React.useState("");

	const filteredItems = React.useMemo(() => {
		if (remote) return items;
		if (!search.trim()) return items;
		const q = search.toLowerCase();
		return items.filter((item) => {
			const text = `${item.label || item.name || item.shortCode || ""} ${
				item.sub || item.description || item.destinationUrl || ""
			} ${item.badge || ""} ${item.disabledReason || ""}`.toLowerCase();
			return text.includes(q);
		});
	}, [items, search, remote]);

	const selectedItem = React.useMemo(() => {
		return items.find((i) => (i.value ?? i.id ?? i.shortCode) === value);
	}, [items, value]);

	return (
		<div className={`relative w-full ${className}`}>
			<Combobox
				value={value}
				onValueChange={(newVal) => {
					const item = items.find(
						(i) => (i.value ?? i.id ?? i.shortCode) === newVal,
					);
					if (item?.disabled) return;
					onValueChange?.(newVal, item);
					setSearch("");
					onSearchChange?.("");
				}}
				disabled={disabled}
			>
				<ComboboxInput
					placeholder={
						selectedItem
							? `${selectedItem.label || selectedItem.name || selectedItem.shortCode}`
							: placeholder
					}
					value={search}
					onChange={(e) => {
						const val = e.target.value;
						setSearch(val);
						onSearchChange?.(val);
					}}
					className="w-full text-xs"
					showClear={!!value}
				/>
				<ComboboxContent className="w-full min-w-[280px] z-50 shadow-xl border-border/80">
					<ComboboxList className="max-h-60 p-1">
						{isLoading ? (
							<div className="py-4 text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
								<span className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
								<span>Searching...</span>
							</div>
						) : filteredItems.length === 0 ? (
							<div className="py-4 text-xs text-muted-foreground text-center">
								{emptyMessage}
							</div>
						) : null}
						<ComboboxGroup>
							{filteredItems.map((item) => {
								const itemVal =
									item.value ?? item.id ?? item.shortCode;
								const isSelected = itemVal === value;
								const isDisabled = Boolean(item.disabled);

								return (
									<ComboboxItem
										key={itemVal}
										value={itemVal}
										disabled={isDisabled}
										onClick={() => {
											if (isDisabled) return;
											onValueChange?.(itemVal, item);
											setSearch("");
										}}
										className={cn(
											"py-1.5 px-2.5 rounded-lg flex items-center justify-between",
											isDisabled
												? "opacity-50 cursor-not-allowed bg-muted/15 select-none"
												: "cursor-pointer"
										)}
									>
										<div className="flex flex-col min-w-0 flex-1 pr-2">
											<div className="flex items-center gap-2">
												<span
													className={cn(
														"font-medium text-xs truncate",
														isDisabled
															? "text-muted-foreground"
															: isSelected
															? "text-primary font-semibold"
															: "text-foreground"
													)}
												>
													{item.label ||
														item.name ||
														item.shortCode}
												</span>
												{item.badge && (
													<Badge
														variant={
															isDisabled
																? "outline"
																: isSelected
																? "default"
																: "secondary"
														}
														className={cn(
															"text-[9px] font-mono px-1.5 py-0 shrink-0",
															isDisabled && "text-muted-foreground border-border/70 bg-muted/30 font-normal"
														)}
													>
														{item.badge}
													</Badge>
												)}
											</div>
											{(item.disabledReason ||
												item.sub ||
												item.destinationUrl ||
												item.description) && (
												<div className="flex items-center gap-1.5 text-[10px] mt-0.5 min-w-0">
													{item.disabledReason && (
														<span className="text-amber-500/90 dark:text-amber-400/90 font-medium shrink-0">
															{item.disabledReason}
														</span>
													)}
													{item.disabledReason && (item.sub || item.destinationUrl || item.description) && (
														<span className="text-muted-foreground/50 shrink-0">•</span>
													)}
													{(item.sub ||
														item.destinationUrl ||
														item.description) && (
														<span className="text-muted-foreground truncate font-mono">
															{item.sub ||
																item.destinationUrl ||
																item.description}
														</span>
													)}
												</div>
											)}
										</div>
									</ComboboxItem>
								);
							})}
						</ComboboxGroup>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</div>
	);
}
