// src/features/explorer/hooks/useFileItem.ts
import type { FileItem } from "../../../utils/mockData";
import { useExplorer } from "../context/ExplorerContext";
import { useFileDragDrop } from "./useFileDragDrop";
import { createEffect } from "solid-js";

/**
 * Shared logic for file items (Grid or List view).
 */
export function useFileItem(file: FileItem) {
	const { selection, ops, iconPack, folderSizes, handlers } = useExplorer();

	const isSelected = () => selection.isSelected(file.id);
	const isCut = () =>
		ops.clipboardMode() === "cut" && ops.isClipboardItem(file.id);
	const size = () => folderSizes.sizes()[file.id];
	const isCalculating = () => folderSizes.calculating().has(file.id);

	createEffect(() => {
		const isApp = file.name.toLowerCase().endsWith(".app");
		if (
			file.type === "folder" &&
			isApp &&
			size() === undefined &&
			!isCalculating()
		) {
			// Small timeout so it runs after initial render without blocking
			setTimeout(() => {
				folderSizes.queueSizeCalculation(file.id);
			}, 100);
		}
	});

	const {
		handleDragStart: onDragStart,
		handleDragOver: onDragOver,
		handleDragLeave: onDragLeave,
		handleDrop: onDrop,
	} = useFileDragDrop({
		file,
		selected: isSelected,
		selectedIds: selection.selectedIds,
	});

	const onOpen = () => handlers.onOpen(file.id);

	const onCalculateSize = (e: MouseEvent) => {
		e.stopPropagation();
		folderSizes.calculateSize(file.id);
	};

	return {
		isSelected,
		isCut,
		size,
		isCalculating,
		iconPack,
		onOpen,
		onCalculateSize,
		dragHandlers: {
			onDragStart,
			onDragOver,
			onDragLeave,
			onDrop,
		},
	};
}
