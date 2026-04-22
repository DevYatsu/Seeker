import { Show } from "solid-js";
import type { IconPack } from "../../../components/AppIcon";
import type { FileItem } from "../../../utils/mockData";
import { GridView } from "./FileBrowser/GridView";
import { ListView } from "./FileBrowser/ListView";

export interface InteractionEvent {
	id: string;
	multi: boolean;
	range: boolean;
	rightClick: boolean;
}

type FileBrowserProps = {
	files: FileItem[];
	viewMode: "list" | "grid";
	isSelected: (id: string) => boolean;
	selectedIds: string[];
	onItemInteract: (event: InteractionEvent) => void;
	onItemOpen: (id: string) => void;
	onItemMove: (sourceIds: string[], targetId: string) => void;
	onBackgroundInteract: (e: UIEvent) => void;
	iconPack: IconPack;
	folderSizes: Record<string, number>;
	calculating: Set<string>;
	onCalculateSize: (path: string) => void;
	clipboard: string[];
	clipboardMode: "copy" | "cut";
};

export default function FileBrowser(props: FileBrowserProps) {
	const handleInteraction = (e: MouseEvent, id: string, rightClick = false) => {
		e.stopPropagation();
		if (rightClick) e.preventDefault();

		const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
		const multi = e.metaKey || (!isMac && e.ctrlKey);
		const range = e.shiftKey;

		props.onItemInteract({ id, multi, range, rightClick });
	};

	return (
		<div
			class="file-browser"
			onClick={(e) => props.onBackgroundInteract(e)}
			onContextMenu={(e) => {
				e.preventDefault();
				props.onBackgroundInteract(e);
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					props.onBackgroundInteract(e);
				}
			}}
			role="grid"
			tabIndex={-1}
		>
			<Show when={props.viewMode === "list"}>
				<ListView
					files={props.files}
					isSelected={props.isSelected}
					selectedIds={props.selectedIds}
					onItemClick={(e, id) => handleInteraction(e as MouseEvent, id)}
					onItemDoubleClick={(_, file) => props.onItemOpen(file.id)}
					onItemRightClick={(e, id) => handleInteraction(e as MouseEvent, id, true)}
					onItemMove={props.onItemMove}
					iconPack={props.iconPack}
					folderSizes={props.folderSizes}
					calculating={props.calculating}
					onCalculateSize={props.onCalculateSize}
					clipboard={props.clipboard}
					clipboardMode={props.clipboardMode}
				/>
			</Show>

			<Show when={props.viewMode === "grid"}>
				<GridView
					files={props.files}
					isSelected={props.isSelected}
					selectedIds={props.selectedIds}
					onItemClick={(e, id) => handleInteraction(e, id)}
					onItemDoubleClick={(_, file) => props.onItemOpen(file.id)}
					onItemRightClick={(e, id) => handleInteraction(e, id, true)}
					onItemMove={props.onItemMove}
					iconPack={props.iconPack}
					folderSizes={props.folderSizes}
					calculating={props.calculating}
					onCalculateSize={props.onCalculateSize}
					clipboard={props.clipboard}
					clipboardMode={props.clipboardMode}
				/>
			</Show>
		</div>
	);
}
