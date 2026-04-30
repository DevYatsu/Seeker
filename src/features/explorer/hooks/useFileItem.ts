// src/features/explorer/hooks/useFileItem.ts
import type { FileItem } from "../../../utils/mockData";
import { useExplorer } from "../context/ExplorerContext";
import { useFileDragDrop } from "./useFileDragDrop";
import { createEffect } from "solid-js";

/**
 * Shared logic for file items (Grid or List view).
 */
export function useFileItem(props: { file: FileItem }) {
	const { selection, ops, iconPack, folderSizes, handlers } = useExplorer();

	const isSelected = () => selection.isSelected(props.file.id);
	const isCut = () =>
		ops.clipboardMode() === "cut" && ops.isClipboardItem(props.file.id);
	const size = () => folderSizes.sizes()[props.file.id];
	const isCalculating = () => folderSizes.calculating().has(props.file.id);

	createEffect(() => {
		const isApp = props.file.name.toLowerCase().endsWith(".app");
		if (
			props.file.type === "folder" &&
			isApp &&
			size() === undefined &&
			!isCalculating()
		) {
			// Small timeout so it runs after initial render without blocking
			setTimeout(() => {
				folderSizes.queueSizeCalculation(props.file.id);
			}, 100);
		}
	});

	const {
		handleDragStart: onDragStart,
		handleDragOver: onDragOver,
		handleDragLeave: onDragLeave,
		handleDrop: onDrop,
	} = useFileDragDrop({
		get file() { return props.file; },
		selected: isSelected,
		selectedIds: selection.selectedIds,
	});

	const onOpen = () => handlers.onOpen(props.file.id);

	const onCalculateSize = (e: MouseEvent) => {
		e.stopPropagation();
		folderSizes.calculateSize(props.file.id);
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
