import { createContext, type JSX, useContext } from "solid-js";
import type { IconPack } from "../../components/AppIcon";

/**
 * Context to avoid prop-drilling across the complex Explorer feature.
 * Adheres to SoC and DRY by providing common state and handlers to sub-components.
 */
interface ExplorerContextValue {
	selection: {
		selectedIds: () => string[];
		isSelected: (id: string) => boolean;
		setSelectedIds: (ids: string[]) => void;
		selectItem: (
			id: string,
			options: { multi: boolean; range: boolean },
		) => void;
	};
	ops: {
		clipboard: () => string[];
		clipboardMode: () => "copy" | "cut";
		handleMove: (sourceIds: string[], targetId: string) => void;
	};
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
