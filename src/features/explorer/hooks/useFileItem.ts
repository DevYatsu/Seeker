import type { FileItem } from "../../../utils/mockData";
import { useExplorer } from "../context/ExplorerContext";
import { useFileDragDrop } from "./useFileDragDrop";

/**
 * Shared logic for file items (Grid or List view).
 * Adheres to SoC, DRY and KISS principles.
 */
export function useFileItem(file: FileItem) {
	const { selection, ops, iconPack, folderSizes, handlers } = useExplorer();

	const isSelected = () => selection.isSelected(file.id);
	const isCut = () =>
		ops.clipboardMode() === "cut" && ops.clipboard().includes(file.id);
	const size = () => folderSizes.sizes()[file.id];
	const isCalculating = () => folderSizes.calculating().has(file.id);

	const {
		handleDragStart: onDragStart,
		handleDragOver: onDragOver,
		handleDragLeave: onDragLeave,
		handleDrop: onDrop,
	} = useFileDragDrop({
		file,
		selected: isSelected(),
		selectedIds: selection.selectedIds(),
		onMove: ops.handleMove,
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
