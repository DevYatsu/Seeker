import { useExplorer } from "../context/ExplorerContext";

interface DragDropOptions {
	file: { id: string; name: string; type: string };
	selected: boolean;
	selectedIds: string[];
}

/**
 * Hook to provide standardized drag and drop handlers for file items.
 * Deep Module pattern: Hook is now a shallow interface to the central DragDropManager.
 */
export function useFileDragDrop(opts: DragDropOptions) {
	const { dnd } = useExplorer();

	const handleDragStart = (e: DragEvent) => {
		const isDraggingSelection = opts.selected && opts.selectedIds.length > 1;
		const dragIds = isDraggingSelection ? opts.selectedIds : [opts.file.id];
		dnd.onDragStart(e, dragIds, opts.file.name);
	};

	const handleDragOver = (e: DragEvent) => {
		if (opts.file.type === "folder") {
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
			(e.currentTarget as HTMLElement).classList.add("drag-over");
		}
	};

	const handleDragLeave = (e: DragEvent) => {
		(e.currentTarget as HTMLElement).classList.remove("drag-over");
	};

	const handleDrop = async (e: DragEvent) => {
		e.preventDefault();
		(e.currentTarget as HTMLElement).classList.remove("drag-over");

		if (opts.file.type !== "folder") return;

		const data = e.dataTransfer?.getData("application/json") || undefined;
		await dnd.handleDrop(opts.file.id, data);
	};

	return {
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
	};
}
