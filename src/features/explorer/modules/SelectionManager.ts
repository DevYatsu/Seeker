import { createSelector, createSignal, type Accessor } from "solid-js";
import type { FileItem } from "../../../utils/mockData";
import type { InteractionEvent } from "../components/FileBrowser";

export type NavigationDirection = "up" | "down" | "left" | "right";

export interface SelectionConfig {
	files: Accessor<FileItem[]>;
	viewMode: Accessor<"grid" | "list">;
	gridColumns: Accessor<number>;
}

/**
 * Unified Selection Module
 *
 * Depth: High. Handles all selection state and logic behind a small interface.
 * Leverage: Callers send high-level events (Interaction, Navigation) instead of managing indices.
 * Locality: All range math, multi-select logic, and 2D navigation live here.
 */
export function createSelectionManager(config: SelectionConfig) {
	const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
	const isSelected = createSelector(selectedIds);

	/** Internal helper to find indices in current file list */
	const getIndex = (id: string) =>
		config.files().findIndex((f) => f.id === id);

	/** Get the "cursor" (last selected item) index */
	const getFocusedIndex = () => {
		const current = selectedIds();
		if (current.length === 0) return -1;
		return getIndex(current[current.length - 1]);
	};

	const handleInteraction = (event: InteractionEvent) => {
		const { id, multi, range, rightClick } = event;
		const current = selectedIds();

		if (rightClick) {
			if (!current.includes(id)) setSelectedIds([id]);
			return;
		}

		if (range && current.length > 0) {
			const lastId = current[current.length - 1];
			const startIdx = getIndex(lastId);
			const endIdx = getIndex(id);

			if (startIdx === -1 || endIdx === -1) {
				setSelectedIds([id]);
				return;
			}

			const start = Math.min(startIdx, endIdx);
			const end = Math.max(startIdx, endIdx);
			const rangeIds = config
				.files()
				.slice(start, end + 1)
				.map((f) => f.id);

			setSelectedIds([...new Set([...current, ...rangeIds])]);
		} else if (multi) {
			if (current.includes(id)) {
				setSelectedIds(current.filter((i) => i !== id));
			} else {
				setSelectedIds([...current, id]);
			}
		} else {
			setSelectedIds([id]);
		}
	};

	const handleNavigation = (
		direction: NavigationDirection,
		options: { extend: boolean },
	) => {
		const allFiles = config.files();
		if (allFiles.length === 0) return;

		const currentIdx = getFocusedIndex();
		const isGrid = config.viewMode() === "grid";
		const columns = config.gridColumns();

		let nextIdx = currentIdx;

		switch (direction) {
			case "down":
				nextIdx += isGrid ? columns : 1;
				break;
			case "up":
				nextIdx -= isGrid ? columns : 1;
				break;
			case "right":
				if (isGrid) nextIdx += 1;
				break;
			case "left":
				if (isGrid) nextIdx -= 1;
				break;
		}

		// Clamp to valid range
		if (nextIdx < 0) nextIdx = 0;
		if (nextIdx >= allFiles.length) nextIdx = allFiles.length - 1;

		if (nextIdx === currentIdx) return;

		const nextId = allFiles[nextIdx].id;

		if (options.extend) {
			const current = selectedIds();
			if (!current.includes(nextId)) {
				setSelectedIds([...current, nextId]);
			}
		} else {
			setSelectedIds([nextId]);
		}
	};

	const selectAll = () => setSelectedIds(config.files().map((f) => f.id));
	const clear = () => setSelectedIds([]);

	return {
		selectedIds,
		isSelected,
		setSelectedIds,
		handleInteraction,
		handleNavigation,
		selectAll,
		clear,
	};
}
