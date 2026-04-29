import { Show } from "solid-js";
import type { FileItem } from "../../../utils/mockData";
import { getSelectionModifiers } from "../../../utils/ui";
import { GridView } from "./FileBrowser/GridView";
import { ListView } from "./FileBrowser/ListView";
import { ColumnView } from "./FileBrowser/ColumnView";

export interface InteractionEvent {
	id: string;
	multi: boolean;
	range: boolean;
	rightClick: boolean;
}

type FileBrowserProps = {
	files: FileItem[];
	viewMode: "list" | "grid" | "column";
	onItemInteract: (event: InteractionEvent) => void;
	onBackgroundInteract: (e: UIEvent) => void;
	onNavigate: (path: string) => void;
	iconPack: () => any;
};

/**
 * File Browser Component
 * Simple router between List and Grid view modes.
 * Uses ExplorerContext (internally in views) to handle complex state.
 */
export default function FileBrowser(props: FileBrowserProps) {
	const handleInteraction = (e: MouseEvent, id: string, rightClick = false) => {
		e.stopPropagation();
		if (rightClick) e.preventDefault();

		const { multi, range } = getSelectionModifiers(e);
		props.onItemInteract({ id, multi, range, rightClick });
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: grid is appropriate
		<div
			class="file-browser"
			onClick={(e) => props.onBackgroundInteract(e)}
			onContextMenu={(e) => {
				e.preventDefault();
				props.onBackgroundInteract(e);
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") props.onBackgroundInteract(e);
			}}
			role="grid"
			tabIndex={-1}
		>
			<Show when={props.viewMode === "list"}>
				<ListView files={props.files} onItemInteract={handleInteraction} />
			</Show>

			<Show when={props.viewMode === "grid"}>
				<GridView files={props.files} onItemInteract={handleInteraction} />
			</Show>

			<Show when={props.viewMode === "column"}>
				<ColumnView
					files={props.files}
					onItemInteract={handleInteraction}
					onNavigate={props.onNavigate}
					iconPack={props.iconPack}
				/>
			</Show>
		</div>
	);
}
