import { Channel, invoke } from "@tauri-apps/api/core";
import { setCustomDragImage } from "../../../utils/dragDrop";

// Base64 transparent 1x1 image for drag icon fallback
const TRANSPARENT_PNG =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

interface DragDropOptions {
	file: { id: string; name: string; type: string };
	selected: boolean;
	selectedIds: string[];
	onMove: (sourceIds: string[], targetId: string) => void;
}

/**
 * Hook to provide standardized drag and drop handlers for file items.
 * Adheres to DRY by centralizing complex Tauri/HTML5 drag-drop logic.
 */
export function useFileDragDrop(opts: DragDropOptions) {
	const handleDragStart = async (e: DragEvent) => {
		const isDraggingSelection = opts.selected && opts.selectedIds.length > 1;
		const dragIds = isDraggingSelection ? opts.selectedIds : [opts.file.id];
		const dragCount = dragIds.length;

		// Internal HTML5 Drag
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("application/json", JSON.stringify(dragIds));
			setCustomDragImage(e, opts.file.name, dragCount);
		}

		// External Native Drag (Tauri)
		try {
			const onEvent = new Channel();
			await invoke("plugin:drag|start_drag", {
				item: dragIds,
				image: TRANSPARENT_PNG,
				onEvent,
			});
		} catch (err) {
			console.error("Native drag failed:", err);
		}
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

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		(e.currentTarget as HTMLElement).classList.remove("drag-over");

		if (opts.file.type !== "folder") return;

		const data = e.dataTransfer?.getData("application/json");
		if (data) {
			try {
				const sourceIds = JSON.parse(data) as string[];
				// Prevent dropping onto itself or its own children (basic check)
				if (sourceIds.length > 0 && !sourceIds.includes(opts.file.id)) {
					opts.onMove(sourceIds, opts.file.id);
				}
			} catch (err) {
				console.error("Drop data parse error:", err);
			}
		}
	};

	return {
		handleDragStart,
		handleDragOver,
		handleDragLeave,
		handleDrop,
	};
}
