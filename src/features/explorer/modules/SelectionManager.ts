import { createSelector, createSignal, type Accessor, batch } from "solid-js";
import type { FileItem } from "../../../utils/mockData";
import type { InteractionEvent } from "../components/FileBrowser";

export type NavigationDirection = "up" | "down" | "left" | "right";

export interface SelectionConfig {
	files: Accessor<FileItem[]>;
	viewMode: Accessor<"grid" | "list" | "column">;
	gridColumns: Accessor<number>;
}

/**
 * Unified Selection Module
 *
 * Optimized to use a Set for O(1) lookups and updates.
 */
export function createSelectionManager(config: SelectionConfig) {
	// Use a Set for performance, but we need to trigger updates by cloning
	const [selectedSet, setSelectedSet] = createSignal<Set<string>>(new Set());
	const [lastId, setLastId] = createSignal<string | null>(null);

	const isSelected = createSelector<string, Set<string>>(
		selectedSet,
		(id, set) => set.has(id),
	);

	/** Internal helper to find indices in current file list */
	const getIndex = (id: string) => config.files().findIndex((f) => f.id === id);

	const handleInteraction = (event: InteractionEvent) => {
		const { id, multi, range, rightClick } = event;

		if (rightClick) {
			if (!selectedSet().has(id)) {
				batch(() => {
					setSelectedSet(new Set([id]));
					setLastId(id);
				});
			}
			return;
		}

		if (range && lastId()) {
			const startIdx = getIndex(lastId()!);
			const endIdx = getIndex(id);

			if (startIdx === -1 || endIdx === -1) {
				batch(() => {
					setSelectedSet(new Set([id]));
					setLastId(id);
				});
				return;
			}

			const start = Math.min(startIdx, endIdx);
			const end = Math.max(startIdx, endIdx);
			const rangeIds = config
				.files()
				.slice(start, end + 1)
				.map((f) => f.id);

			batch(() => {
				const nextSet = multi ? new Set(selectedSet()) : new Set();
				for (const rid of rangeIds) nextSet.add(rid);
				setSelectedSet(nextSet);
				setLastId(id);
			});
		} else if (multi) {
			const nextSet = new Set(selectedSet());
			if (nextSet.has(id)) {
				nextSet.delete(id);
			} else {
				nextSet.add(id);
			}
			batch(() => {
				setSelectedSet(nextSet);
				setLastId(id);
			});
		} else {
			batch(() => {
				setSelectedSet(new Set([id]));
				setLastId(id);
			});
		}
	};

	const handleNavigation = (
		direction: NavigationDirection,
		options: { extend: boolean },
	) => {
		const allFiles = config.files();
		if (allFiles.length === 0) return;

		const currentIdx = lastId() ? getIndex(lastId()!) : -1;
		const isGrid = config.viewMode() === "grid";
		const columns = config.gridColumns();

		let nextIdx = currentIdx === -1 ? 0 : currentIdx;

		if (currentIdx !== -1) {
			switch (direction) {
				case "down":
					nextIdx += isGrid ? columns : 1;
					break;
				case "up":
					nextIdx -= isGrid ? columns : 1;
					break;
				case "right":
					nextIdx += 1;
					break;
				case "left":
					nextIdx -= 1;
					break;
			}
		}

		nextIdx = Math.max(0, Math.min(nextIdx, allFiles.length - 1));
		if (nextIdx === currentIdx && currentIdx !== -1) return;

		const nextId = allFiles[nextIdx].id;

		if (options.extend) {
			const nextSet = new Set(selectedSet());
			nextSet.add(nextId);
			batch(() => {
				setSelectedSet(nextSet);
				setLastId(nextId);
			});
		} else {
			batch(() => {
				setSelectedSet(new Set([nextId]));
				setLastId(nextId);
			});
		}
	};

	const selectAll = () => {
		setSelectedSet(new Set(config.files().map((f) => f.id)));
	};

	const clear = () => {
		batch(() => {
			setSelectedSet(new Set());
			setLastId(null);
		});
	};

	return {
		selectedIds: () => Array.from(selectedSet()),
		isSelected,
		handleInteraction,
		handleNavigation,
		selectAll,
		clear,
	};
}
