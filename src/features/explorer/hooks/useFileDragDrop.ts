// src/features/explorer/hooks/useFileDragDrop.ts
import { type Accessor } from "solid-js";
import { useExplorer } from "../context/ExplorerContext";

interface DragDropOptions {
	file: { id: string; name: string; type: string };
	selected: Accessor<boolean>;
	selectedIds: Accessor<string[]>;
}

/**
 * Hook to provide standardized drag and drop handlers for file items.
 */
export function useFileDragDrop(opts: DragDropOptions) {
	const { dnd, handlers } = useExplorer();

	const handleDragStart = (e: DragEvent) => {
		const isDraggingSelection =
			opts.selected() && opts.selectedIds().length > 1;
		const dragIds = isDraggingSelection ? opts.selectedIds() : [opts.file.id];
		dnd.onDragStart(e, dragIds, opts.file.name);
	};

	let springTimer: any;

	const handleDragOver = (e: DragEvent) => {
		if (opts.file.type === "folder") {
			e.preventDefault();
			if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

			const target = e.currentTarget as HTMLElement;
			if (!target.classList.contains("drag-over")) {
				target.classList.add("drag-over");

				// Spring-loaded folder navigation (Finder style)
				clearTimeout(springTimer);
				springTimer = setTimeout(() => {
					if (target.classList.contains("drag-over")) {
						handlers.onOpen(opts.file.id);
					}
				}, 1000);
			}
		}
	};

	const handleDragLeave = (e: DragEvent) => {
		clearTimeout(springTimer);
		(e.currentTarget as HTMLElement).classList.remove("drag-over");
	};

	const handleDrop = async (e: DragEvent) => {
		e.preventDefault();
		clearTimeout(springTimer);
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
