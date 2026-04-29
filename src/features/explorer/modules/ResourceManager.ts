import { makePersisted } from "@solid-primitives/storage";
import { debounce } from "@solid-primitives/scheduled";
import {
	createMemo,
	createResource,
	createSignal,
	type Accessor,
} from "solid-js";
import { fileSystem } from "../../../services/apiService";
import { getFileExtension } from "../../../utils/path";
import type { FileItem } from "../../../utils/mockData";

export type SortBy = "name" | "size" | "date";
export type SortOrder = "asc" | "desc";
export type ViewMode = "list" | "grid";

const storageOptions = {
	deserialize: (v: string) => {
		try {
			return JSON.parse(v);
		} catch (_e) {
			return v;
		}
	},
};

/**
 * Explorer Resource Manager
 *
 * Depth: High. Orchestrates data fetching, searching, sorting, and persistent view settings.
 * Leverage: Provides a single source of truth for "what files are we looking at and how".
 * Locality: Concentrates all filtering, sorting, and API resource management.
 */
export function createResourceManager(config: { currentPath: Accessor<string> }) {
	// 1. Persistent View Settings
	const [viewMode, setViewMode] = makePersisted(
		createSignal<ViewMode>("list"),
		{ ...storageOptions, name: "seeker-view-mode" },
	);
	const [sortBy, setSortBy] = makePersisted(createSignal<SortBy>("name"), {
		...storageOptions,
		name: "seeker-sort-by",
	});
	const [sortOrder, setSortOrder] = makePersisted(
		createSignal<SortOrder>("asc"),
		{ ...storageOptions, name: "seeker-sort-order" },
	);
	const [separateFolders, setSeparateFolders] = makePersisted(
		createSignal(true),
		{ ...storageOptions, name: "seeker-separate-folders" },
	);
	const [showHidden, setShowHidden] = makePersisted(createSignal(false), {
		...storageOptions,
		name: "seeker-show-hidden",
	});

	// 2. Search Logic
	const [searchQuery, setSearchQuery] = createSignal("");
	const [debouncedQuery, setDebouncedQuery] = createSignal("");
	const updateDebouncedQuery = debounce(
		(q: string) => setDebouncedQuery(q),
		300,
	);

	createMemo(() => {
		const q = searchQuery();
		if (q.length < 2) setDebouncedQuery("");
		else updateDebouncedQuery(q);
	});

	// 3. Data Fetching
	const [refreshTrigger, setRefreshTrigger] = createSignal(0);
	const refresh = () => setRefreshTrigger((prev) => prev + 1);

	const mapFile = (r: any): FileItem => ({
		id: r.path,
		name: r.name,
		type: r.is_dir ? "folder" : "file",
		size: r.size,
		updatedAt: new Date(r.updated_at * 1000).toISOString(),
		ext: getFileExtension(r.name) || "--",
	});

	const [currentFiles, { mutate }] = createResource(
		() => ({
			path: config.currentPath(),
			trigger: refreshTrigger(),
			showHidden: showHidden(),
		}),
		async ({ path, showHidden }) => {
			if (!path) return [];
			const results = await fileSystem.listDirectory(path, showHidden);
			return results.map(mapFile);
		},
	);

	const [searchResults] = createResource(
		() => ({ path: config.currentPath(), query: debouncedQuery() }),
		async ({ path, query }) => {
			if (query.length < 2) return [];
			const results = await fileSystem.searchFiles(path, query);
			return results.map(mapFile);
		},
	);

	// 4. Sorting & Filtering (Derived)
	const displayedItems = createMemo(() => {
		const files =
			debouncedQuery().length >= 2
				? searchResults() || []
				: currentFiles() || [];

		return [...files].sort((a, b) => {
			if (separateFolders() && a.type !== b.type) {
				return a.type === "folder" ? -1 : 1;
			}
			let comparison = 0;
			switch (sortBy()) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "size":
					comparison = a.size - b.size;
					break;
				case "date":
					comparison =
						new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
					break;
			}
			return sortOrder() === "asc" ? comparison : -comparison;
		});
	});

	return {
		// Data
		items: displayedItems,
		isLoading: () => currentFiles.loading || searchResults.loading,
		mutate,
		refresh,

		// Options/Settings
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
	};
}
