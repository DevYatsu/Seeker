import { createSignal } from "solid-js";

interface TabBarOptions {
	onMove: (from: number, to: number) => void;
}

/**
 * Logic hook for TabBar.
 * Extracts drag-and-drop orchestration for tabs.
 */
export function useTabBar(opts: TabBarOptions) {
	const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);

	const handleDragStart = (e: DragEvent, index: number) => {
		setDraggedIndex(index);
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", index.toString());

			// Set a transparent ghost image
			const img = new Image();
			img.src =
				"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
			e.dataTransfer.setDragImage(img, 0, 0);
		}
	};

	const handleDragOver = (e: DragEvent, index: number) => {
		e.preventDefault();
		if (draggedIndex() === null || draggedIndex() === index) return;
		setDragOverIndex(index);

		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = "move";
		}
	};

	const handleDrop = (e: DragEvent, targetIndex: number) => {
		e.preventDefault();
		const sourceIndexRaw = e.dataTransfer?.getData("text/plain");
		const sourceIndex = sourceIndexRaw
			? parseInt(sourceIndexRaw, 10)
			: draggedIndex();

		if (sourceIndex !== null && sourceIndex !== targetIndex) {
			opts.onMove(sourceIndex, targetIndex);
		}

		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const formatPathLabel = (path: string) => {
		if (path === "home") return "Home";
		if (path === "trash") return "Trash";
		const parts = path.split(/[\\/]/).filter(Boolean);
		return parts[parts.length - 1] || "/";
	};

	return {
		draggedIndex,
		dragOverIndex,
		handleDragStart,
		handleDragOver,
		handleDrop,
		handleDragEnd,
		formatPathLabel,
	};
}
