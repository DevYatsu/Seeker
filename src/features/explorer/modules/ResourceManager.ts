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
export type ViewMode = "list" | "grid" | "column";

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
export function createResourceManager(config: {
	currentPath: Accessor<string>;
	folderSizes: Accessor<Record<string, number>>;
}) {
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
		size: r.size ?? undefined,
		updatedAt: r.updated_at ? r.updated_at * 1000 : undefined,
		ext: getFileExtension(r.name) || "--",
	});

	const [currentFiles, { mutate }] = createResource(
		() => {
			const path = config.currentPath();
			if (!path) return false as const;
			return {
				path,
				trigger: refreshTrigger(),
				showHidden: showHidden(),
				sortBy: sortBy(),
				sortOrder: sortOrder(),
				search: searchQuery(),
			};
		},
		async (source) => {
			try {
				console.log(`[ResourceManager] Fetching: ${source.path}`);
				const [results, count] = await fileSystem.listDirectory(source.path, {
					show_hidden: source.showHidden,
					sort_by: source.sortBy,
					sort_order: source.sortOrder,
					search: source.search || undefined,
					limit: 1000, // Load first 1000 for now to keep memory low
				});
				const mapped = results.map(mapFile);
				console.log(
					`[ResourceManager] Fetched ${mapped.length}/${count} items`,
				);
				return mapped;
			} catch (err) {
				console.error("[ResourceManager] Error fetching directory:", err);
				return [];
			}
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

		return files;
	});

	const fetchMetadata = async (ids: string[]) => {
		if (ids.length === 0) return;
		try {
			const metadata = await fileSystem.getItemsMetadata(ids);
			console.log(
				`[ResourceManager] Hydrating ${metadata.length} items metadata`,
			);
			mutate((prev) => {
				if (!prev) return prev;
				const next = [...prev];
				const metadataMap = new Map(metadata.map((m) => [m.path, m]));

				for (let i = 0; i < next.length; i++) {
					const m = metadataMap.get(next[i].id);
					if (m) {
						next[i] = { ...next[i], ...mapFile(m) };
					}
				}
				console.log(
					`[ResourceManager] After hydration: ${next.length} items`,
					next.slice(0, 3),
				);
				return next;
			});
		} catch (e) {
			console.error("Hydration failed", e);
		}
	};

	return {
		// Data
		items: displayedItems,
		isLoading: () => currentFiles.loading || searchResults.loading,
		mutate,
		refresh,
		fetchMetadata,

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
