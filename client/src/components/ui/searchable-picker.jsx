import * as React from "react";
import { IconSearch, IconCheck, IconX, IconChevronDown, IconPlus } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * SearchablePicker - Anti-dropdown selection primitive.
 * Fast, keyboard-friendly searchable selector with badge tags and optional "create new" action.
 */
export function SearchablePicker({
	items = [],
	value = null,
	onChange,
	placeholder = "Search or select...",
	searchPlaceholder = "Type to search...",
	emptyMessage = "No matches found.",
	onAddNew,
	addNewLabel = "Create new",
	className = "",
	disabled = false,
	renderItem,
	clearable = true,
}) {
	const [isOpen, setIsOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const containerRef = React.useRef(null);
	const inputRef = React.useRef(null);

	// Close on click outside or Escape
	React.useEffect(() => {
		const handleClickOutside = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				setIsOpen(false);
			}
		};
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("keydown", handleKeyDown);
			// Auto focus search input when opened
			setTimeout(() => inputRef.current?.focus(), 50);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	// Filter items based on query
	const filteredItems = React.useMemo(() => {
		if (!searchQuery.trim()) return items;
		const q = searchQuery.toLowerCase();
		return items.filter((item) => {
			const label = (item.label || item.name || item.title || item.shortCode || "").toLowerCase();
			const sub = (item.sub || item.description || item.destinationUrl || "").toLowerCase();
			const tag = (item.tag || item.badge || "").toLowerCase();
			return label.includes(q) || sub.includes(q) || tag.includes(q);
		});
	}, [items, searchQuery]);

	// Currently selected item
	const selectedItem = React.useMemo(() => {
		if (value === null || value === undefined || value === "") return null;
		return items.find((item) => (item.value ?? item.id ?? item.shortCode) === value);
	}, [items, value]);

	const handleSelect = (item) => {
		const val = item ? (item.value ?? item.id ?? item.shortCode) : null;
		onChange?.(val, item);
		setIsOpen(false);
		setSearchQuery("");
	};

	const handleClear = (e) => {
		e.stopPropagation();
		onChange?.(null, null);
		setSearchQuery("");
	};

	return (
		<div ref={containerRef} className={`relative w-full ${className}`}>
			{/* Trigger Button */}
			<button
				type="button"
				disabled={disabled}
				onClick={() => setIsOpen(!isOpen)}
				className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
					isOpen
						? "border-primary bg-primary/5 shadow-xs"
						: "border-border/80 bg-background hover:border-border hover:bg-muted/30"
				} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
			>
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<IconSearch className="size-4 text-muted-foreground shrink-0" />
					{selectedItem ? (
						<div className="flex items-center gap-2 min-w-0 truncate">
							<span className="font-medium text-foreground truncate">
								{selectedItem.label || selectedItem.name || selectedItem.shortCode}
							</span>
							{selectedItem.badge && (
								<Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">
									{selectedItem.badge}
								</Badge>
							)}
						</div>
					) : (
						<span className="text-muted-foreground truncate">{placeholder}</span>
					)}
				</div>

				<div className="flex items-center gap-1 shrink-0 text-muted-foreground">
					{clearable && selectedItem && !disabled && (
						<span
							role="button"
							tabIndex={0}
							onClick={handleClear}
							className="p-0.5 rounded-sm hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
							title="Clear selection"
						>
							<IconX className="size-3.5" />
						</span>
					)}
					<IconChevronDown
						className={`size-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
					/>
				</div>
			</button>

			{/* Search Panel Popover */}
			{isOpen && (
				<div className="absolute left-0 top-full mt-1.5 w-full z-50 rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl overflow-hidden backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150">
					{/* Search Input Bar */}
					<div className="p-2 border-b border-border/60 bg-muted/20">
						<div className="relative flex items-center">
							<IconSearch className="size-4 text-muted-foreground absolute left-2.5 pointer-events-none" />
							<input
								ref={inputRef}
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={searchPlaceholder}
								className="w-full pl-8 pr-7 py-1.5 text-xs bg-background rounded-md border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="absolute right-2 p-0.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground"
								>
									<IconX className="size-3" />
								</button>
							)}
						</div>
					</div>

					{/* Filtered Items List */}
					<div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
						{filteredItems.length === 0 ? (
							<div className="py-6 px-3 text-center text-xs text-muted-foreground">
								{emptyMessage}
							</div>
						) : (
							filteredItems.map((item) => {
								const itemVal = item.value ?? item.id ?? item.shortCode;
								const isSelected = (selectedItem?.value ?? selectedItem?.id ?? selectedItem?.shortCode) === itemVal;

								return (
									<button
										key={itemVal}
										type="button"
										onClick={() => handleSelect(item)}
										className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
											isSelected
												? "bg-primary/15 text-primary font-medium"
												: "hover:bg-muted/70 text-foreground"
										}`}
									>
										{renderItem ? (
											renderItem(item, isSelected)
										) : (
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<span className="font-medium truncate">
														{item.label || item.name || item.shortCode}
													</span>
													{item.badge && (
														<Badge
															variant={isSelected ? "default" : "secondary"}
															className="text-[10px] px-1.5 py-0 shrink-0 font-mono"
														>
															{item.badge}
														</Badge>
													)}
												</div>
												{(item.sub || item.description || item.destinationUrl) && (
													<p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">
														{item.sub || item.description || item.destinationUrl}
													</p>
												)}
											</div>
										)}

										{isSelected && (
											<IconCheck className="size-4 text-primary shrink-0 ml-1" />
										)}
									</button>
								);
							})
						)}
					</div>

					{/* Optional "+ Add New" Quick Action */}
					{onAddNew && (
						<div className="p-1.5 border-t border-border/60 bg-muted/10">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => {
									setIsOpen(false);
									onAddNew();
								}}
								className="w-full justify-start text-xs h-8 text-primary hover:text-primary hover:bg-primary/10 font-medium"
							>
								<IconPlus className="size-3.5 mr-1.5" />
								<span>{addNewLabel}</span>
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
