import { For, Show } from "solid-js";
import type { IconPack } from "../../../../components/AppIcon";
import { formatSize } from "../../../../utils/formatters";
import type { FileItem } from "../../../../utils/mockData";
import { FileIcon } from "./FileIcon";

import { invoke, Channel } from "@tauri-apps/api/core";

import { setCustomDragImage } from "../../../../utils/dragDrop";

// Base64 transparent 1x1 image for drag icon fallback
const TRANSPARENT_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

type GridViewProps = {
	files: FileItem[];
	isSelected: (id: string) => boolean;
	selectedIds: string[];
	onItemClick: (e: UIEvent, id: string) => void;
	onItemDoubleClick: (e: UIEvent, file: FileItem) => void;
	onItemRightClick: (e: UIEvent, id: string) => void;
	onItemMove: (sourceIds: string[], targetId: string) => void;
	iconPack: IconPack;
	folderSizes: Record<string, number>;
	calculating: Set<string>;
	onCalculateSize: (path: string) => void;
	clipboard: string[];
	clipboardMode: "copy" | "cut";
};

const GridItem = (props: {
	file: FileItem;
	selected: boolean;
	selectedIds: string[];
	iconPack: IconPack;
	onClick: (e: UIEvent) => void;
	onDblClick: (e: UIEvent) => void;
	onContextMenu: (e: UIEvent) => void;
	onMove: (sourceIds: string[], targetId: string) => void;
	size?: number;
	isCalculating?: boolean;
	isCut?: boolean;
	onCalculateSize: () => void;
}) => {
	const handleDragStart = async (e: DragEvent) => {
		// If the dragged item is part of the selection, drag all selected items.
		// Otherwise, just drag this single item.
		const isDraggingSelection = props.selected && props.selectedIds.length > 1;
		const dragIds = isDraggingSelection ? props.selectedIds : [props.file.id];
		const dragCount = dragIds.length;

		// Native HTML5 drag for internal moves
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("application/json", JSON.stringify(dragIds));
			setCustomDragImage(e, props.file.name, dragCount);
		}

		// Tauri plugin drag for external moves (drag out)
		try {
			const onEvent = new Channel();
			onEvent.onmessage = (event) => {
				console.log("Drag event:", event);
			};

			await invoke("plugin:drag|start_drag", {
				item: dragIds,
				image: TRANSPARENT_PNG,
				onEvent: onEvent
			});
		} catch (err) {
			console.error("Failed to start native drag:", err);
		}
	};

	const handleDragOver = (e: DragEvent) => {
		if (props.file.type === "folder") {
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
		
		if (props.file.type !== "folder") return;

		const data = e.dataTransfer?.getData("application/json");
		if (data) {
			try {
				const sourceIds = JSON.parse(data) as string[];
				if (sourceIds.length > 0 && !sourceIds.includes(props.file.id)) {
					props.onMove(sourceIds, props.file.id);
				}
			} catch (err) {
				console.error("Failed to parse drop data", err);
			}
		}
	};

	return (
		<div
			class={`grid-item ${props.file.type}`}
			classList={{ 
				selected: props.selected,
				"cut-item": props.isCut
			}}
			onClick={props.onClick}
			onDblClick={props.onDblClick}
			onContextMenu={props.onContextMenu}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					props.onClick(e);
				}
			}}
			draggable={true}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			role="gridcell"
			tabIndex={0}
			aria-selected={props.selected}
		>
			<div class={`grid-icon ${props.file.type}`}>
				<FileIcon
					type={props.file.type}
					name={props.file.name}
					pack={props.iconPack}
					size={48}
				/>
			</div>
			<span class="grid-name">{props.file.name}</span>
			<span class="grid-meta">
				<Show
					when={props.file.type === "folder"}
					fallback={formatSize(props.file.size)}
				>
					<Show when={props.size !== undefined} fallback={
						<button 
							class="calc-size-btn-mini" 
							onClick={(e) => { e.stopPropagation(); props.onCalculateSize(); }}
							disabled={props.isCalculating}
						>
							{props.isCalculating ? "..." : "--"}
						</button>
					}>
						{formatSize(props.size || 0)}
					</Show>
				</Show>
			</span>
		</div>
	);
};

export const GridView = (props: GridViewProps) => {
	return (
		<div class="grid-view-container">
			<div class="file-grid">
				<For each={props.files}>
					{(file) => (
						<GridItem
							file={file}
							selected={props.isSelected(file.id)}
							selectedIds={props.selectedIds}
							iconPack={props.iconPack}
							onClick={(e) => props.onItemClick(e, file.id)}
							onDblClick={(e) => props.onItemDoubleClick(e, file)}
							onContextMenu={(e) => props.onItemRightClick(e, file.id)}
							onMove={props.onItemMove}
							size={props.folderSizes[file.id]}
							isCalculating={props.calculating.has(file.id)}
							isCut={props.clipboardMode === "cut" && props.clipboard.includes(file.id)}
							onCalculateSize={() => props.onCalculateSize(file.id)}
						/>
					)}
				</For>
			</div>
		</div>
	);
};
