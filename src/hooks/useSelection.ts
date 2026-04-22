import { createSelector, createSignal } from "solid-js";
import type { FileItem } from "../utils/mockData";

export const useSelection = (files: () => FileItem[]) => {
	const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
	const isSelected = createSelector(selectedIds);

	const handleSelection = (
		id: string | null,
		multi: boolean = false,
		range: boolean = false,
	) => {
		if (id === null) {
			setSelectedIds([]);
			return;
		}

		const current = selectedIds();

		if (range && current.length > 0) {
			const allFiles = files();
			const lastIndex = allFiles.findIndex(
				(f) => f.id === current[current.length - 1],
			);
			const currentIndex = allFiles.findIndex((f) => f.id === id);

			if (lastIndex === -1 || currentIndex === -1) {
				setSelectedIds([id]);
				return;
			}

			const start = Math.min(lastIndex, currentIndex);
			const end = Math.max(lastIndex, currentIndex);

			const rangeIds = allFiles.slice(start, end + 1).map((f) => f.id);
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

	return {
		selectedIds,
		isSelected,
		setSelectedIds,
		handleSelection,
	};
};
