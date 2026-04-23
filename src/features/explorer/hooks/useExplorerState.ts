import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";

export type SortBy = "name" | "size" | "date";
export type SortOrder = "asc" | "desc";

const storageOptions = {
	deserialize: (v: string) => {
		try {
			return JSON.parse(v);
		} catch (_e) {
			return v;
		}
	},
};

export function useExplorerState() {
	const [viewMode, setViewMode] = makePersisted(
		createSignal<"list" | "grid">("list"),
		{
			...storageOptions,
			name: "seeker-view-mode",
		},
	);

	const [sortBy, setSortBy] = makePersisted(createSignal<SortBy>("name"), {
		...storageOptions,
		name: "seeker-sort-by",
	});
	const [sortOrder, setSortOrder] = makePersisted(
		createSignal<SortOrder>("asc"),
		{
			...storageOptions,
			name: "seeker-sort-order",
		},
	);
	const [separateFolders, setSeparateFolders] = makePersisted(
		createSignal(false),
		{
			...storageOptions,
			name: "seeker-separate-folders",
		},
	);

	const [showHidden, setShowHidden] = makePersisted(createSignal(false), {
		...storageOptions,
		name: "seeker-show-hidden",
	});

	const [searchQuery, setSearchQuery] = createSignal("");
	const [refreshTrigger, setRefreshTrigger] = createSignal(0);

	const refresh = () => setRefreshTrigger((prev) => prev + 1);

	return {
		viewMode,
		setViewMode,
		sortBy,
		setSortBy,
		sortOrder,
		setSortOrder,
		separateFolders,
		setSeparateFolders,
		showHidden,
		setShowHidden,
		searchQuery,
		setSearchQuery,
		refreshTrigger,
		refresh,
	};
}
