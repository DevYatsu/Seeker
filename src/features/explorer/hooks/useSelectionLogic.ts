import { createSelector, createSignal } from "solid-js";
import type { FileItem } from "../utils/mockData";

export function useSelectionLogic(files: () => FileItem[]) {
	const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
	const isSelected = createSelector(selectedIds);

	const selectItem = (
		id: string,
		options: { multi: boolean; range: boolean },
	) => {
		const current = selectedIds();

		if (options.range && current.length > 0) {
			const allFiles = files();
			const lastId = current[current.length - 1];
			const lastIndex = allFiles.findIndex((f) => f.id === lastId);
			const currentIndex = allFiles.findIndex((f) => f.id === id);

			if (lastIndex === -1 || currentIndex === -1) {
				setSelectedIds([id]);
				return;
			}

			const start = Math.min(lastIndex, currentIndex);
			const end = Math.max(lastIndex, currentIndex);
			const rangeIds = allFiles.slice(start, end + 1).map((f) => f.id);

			setSelectedIds([...new Set([...current, ...rangeIds])]);
		} else if (options.multi) {
			if (current.includes(id)) {
				setSelectedIds(current.filter((i) => i !== id));
			} else {
				setSelectedIds([...current, id]);
			}
		} else {
			setSelectedIds([id]);
		}
	};

	/** Get the index of the last selected item (the "cursor") */
	const getFocusedIndex = (): number => {
		const current = selectedIds();
		if (current.length === 0) return -1;
		const lastId = current[current.length - 1];
		return files().findIndex((f) => f.id === lastId);
	};

	/** Navigate selection by delta (+1 = down/right, -1 = up/left) */
	const selectByDelta = (delta: number, extend: boolean) => {
		const allFiles = files();
		if (allFiles.length === 0) return;

		const currentIdx = getFocusedIndex();
		let nextIdx = currentIdx + delta;

		// Clamp to valid range
		if (nextIdx < 0) nextIdx = 0;
		if (nextIdx >= allFiles.length) nextIdx = allFiles.length - 1;

		const nextId = allFiles[nextIdx].id;

		if (extend) {
			// Shift+Arrow: extend selection range
			const current = selectedIds();
			if (!current.includes(nextId)) {
				setSelectedIds([...current, nextId]);
			}
		} else {
			setSelectedIds([nextId]);
		}
	};

	const selectAll = () => {
		setSelectedIds(files().map((f) => f.id));
	};

	const clearSelection = () => setSelectedIds([]);

	return {
		selectedIds,
		isSelected,
		setSelectedIds,
		selectItem,
		selectByDelta,
		selectAll,
		clearSelection,
	};
}
