import { createContext, type JSX, useContext } from "solid-js";

/**
 * Context to avoid prop-drilling across the complex Explorer feature.
 * Adheres to SoC and DRY by providing common state and handlers to sub-components.
 */
import type { createSelectionManager } from "../modules/SelectionManager";
import type { createFileSystemManager } from "../modules/FileSystemManager";
import type { createNavigationManager } from "../modules/NavigationManager";
import type { createResourceManager } from "../modules/ResourceManager";
import type { createUndoManager } from "../modules/UndoManager";
import type { createDragDropManager } from "../modules/DragDropManager";
import type { createTaskManager } from "../modules/TaskManager";
import { IconPack } from "../../../components/AppIcon";

/**
 * Context to avoid prop-drilling across the complex Explorer feature.
 * Adheres to SoC and DRY by providing common state and handlers to sub-components.
 */
interface ExplorerContextValue {
	selection: ReturnType<typeof createSelectionManager>;
	ops: ReturnType<typeof createFileSystemManager>;
	nav: ReturnType<typeof createNavigationManager>;
	resources: ReturnType<typeof createResourceManager>;
	undo: ReturnType<typeof createUndoManager>;
	dnd: ReturnType<typeof createDragDropManager>;
	tasks: ReturnType<typeof createTaskManager>;
	iconPack: () => IconPack;
	folderSizes: {
		sizes: () => Record<string, number>;
		calculating: () => Set<string>;
		calculateSize: (path: string) => void;
	};
	handlers: {
		onOpen: (id: string) => void;
	};
}

const ExplorerContext = createContext<ExplorerContextValue>();

export function ExplorerProvider(props: {
	value: ExplorerContextValue;
	children: JSX.Element;
}) {
	return (
		<ExplorerContext.Provider value={props.value}>
			{props.children}
		</ExplorerContext.Provider>
	);
}

export function useExplorer() {
	const context = useContext(ExplorerContext);
	if (!context) {
		throw new Error("useExplorer must be used within an ExplorerProvider");
	}
	return context;
}
