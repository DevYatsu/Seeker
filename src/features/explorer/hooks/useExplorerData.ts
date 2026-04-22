import { createMemo, createResource, createSignal } from "solid-js";
import { debounce } from "@solid-primitives/scheduled";
import { fileSystem } from "../../../services/apiService";
import type { SortBy, SortOrder } from "./useExplorerState";

export function useExplorerData(options: {
	currentPath: () => string;
	refreshTrigger: () => number;
	searchQuery: () => string;
	sortBy: () => SortBy;
	sortOrder: () => SortOrder;
	separateFolders: () => boolean;
	showHidden: () => boolean;
}) {
	// Debounced search query — waits 300ms after user stops typing
	const [debouncedQuery, setDebouncedQuery] = createSignal("");
	const updateDebouncedQuery = debounce((q: string) => setDebouncedQuery(q), 300);

	// Track the raw query and update debounced version
	createMemo(() => {
		const q = options.searchQuery();
		if (q.length < 2) {
			// Clear immediately when query is too short (feels responsive)
			setDebouncedQuery("");
		} else {
			updateDebouncedQuery(q);
		}
	});

	const [currentFiles, { mutate }] = createResource(
		() => ({
			path: options.currentPath(),
			trigger: options.refreshTrigger(),
			showHidden: options.showHidden(),
		}),
		async ({ path, showHidden }) => {
			if (!path) return [];
			const results = await fileSystem.listDirectory(path, showHidden);
			return results.map((r) => ({
        id: r.path,
        name: r.name,
        type: r.is_dir ? "folder" : "file",
        size: r.size,
        updatedAt: new Date(r.updated_at * 1000).toISOString(),
        ext:
          r.name.indexOf(".") != -1  && r.name.indexOf(".") > r.name.length - 6
            ? r.name.split(".").pop()
            : "--",
      }));
		},
	);

	const [searchResults] = createResource(
		() => ({ path: options.currentPath(), query: debouncedQuery() }),
		async ({ path, query }) => {
			if (query.length < 2) return [];
			const results = await fileSystem.searchFiles(path, query);
			return results.map((r) => ({
				id: r.path,
				name: r.name,
				type: r.is_dir ? "folder" : "file",
				size: r.size,
				updatedAt: new Date(r.updated_at * 1000).toISOString(),
				ext: r.name.includes(".") ? r.name.split(".").pop() : undefined,
			}));
		},
	);

	const displayedFiles = createMemo(() => {
		const files =
			debouncedQuery().length >= 2
				? searchResults() || []
				: currentFiles() || [];

		return [...files].sort((a, b) => {
			if (options.separateFolders() && a.type !== b.type) {
				return a.type === "folder" ? -1 : 1;
			}
			let comparison = 0;
			switch (options.sortBy()) {
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
			return options.sortOrder() === "asc" ? comparison : -comparison;
		});
	});

	return {
		currentFiles,
		mutate,
		displayedFiles,
		isLoading: currentFiles.loading || searchResults.loading,
	};
}
