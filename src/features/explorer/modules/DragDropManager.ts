import { createSignal, type Accessor } from "solid-js";
import { invoke, Channel } from "@tauri-apps/api/core";
import { setCustomDragImage } from "../../../utils/dragDrop";
import type { FileOperation } from "./FileSystemManager";

// Base64 transparent 1x1 image for drag icon fallback
const TRANSPARENT_PNG =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/**
 * Drag & Drop Orchestrator
 *
 * Depth: High. Manages application-wide drag state and drop execution.
 * Leverage: Single module to handle all drag/drop interactions (Files, Tabs, Sidebar).
 * Locality: Centralizes drag data parsing and target validation.
 */
export function createDragDropManager(config: {
	execute: (op: FileOperation) => Promise<void>;
}) {
	const [draggedIds, setDraggedIds] = createSignal<string[] | null>(null);
	const [isDraggingExternal, setIsDraggingExternal] = createSignal(false);

	const onDragStart = async (
		e: DragEvent,
		ids: string[],
		fileName: string,
	) => {
		if (ids.length === 0) return;
		setDraggedIds(ids);

		// 1. Internal HTML5 Drag
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("application/json", JSON.stringify(ids));
			setCustomDragImage(e, fileName, ids.length);
		}

		// 2. External Native Drag (Tauri)
		try {
			const onEvent = new Channel();
			await invoke("plugin:drag|start_drag", {
				item: ids,
				image: TRANSPARENT_PNG,
				onEvent,
			});
		} catch (err) {
			console.error("Native drag failed:", err);
		}
	};

	const onDragEnd = () => {
		setDraggedIds(null);
		setIsDraggingExternal(false);
	};

	const handleDrop = async (targetPath: string, data?: string) => {
		// 1. Handle Internal Drag
		const internalIds = draggedIds();
		if (internalIds && internalIds.length > 0) {
			await config.execute({
				type: "move",
				sourceIds: internalIds,
				targetDirId: targetPath,
			});
			onDragEnd();
			return;
		}

		// 2. Handle External Drag (JSON or Files)
		if (data) {
			try {
				const sourceIds = JSON.parse(data) as string[];
				if (sourceIds.length > 0) {
					await config.execute({
						type: "move",
						sourceIds,
						targetDirId: targetPath,
					});
				}
			} catch (_e) {
				console.error("Failed to parse external drop data");
			}
		}
	};

	return {
		draggedIds,
		isDragging: () => !!draggedIds() || isDraggingExternal(),
		onDragStart,
		onDragEnd,
		handleDrop,
		setIsDraggingExternal,
	};
}
