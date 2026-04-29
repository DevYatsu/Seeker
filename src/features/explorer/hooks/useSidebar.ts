import { useExplorer } from "../context/ExplorerContext";
import { useSettings } from "../../../hooks/useSettings";
import type { NavigationLocation } from "../../../services/apiService";

interface SidebarOptions {
	activeLocation: string;
	setActiveLocation: (id: string) => void;
	locations: NavigationLocation[];
}

/**
 * Logic hook for Sidebar.
 * Extracts state and handlers to keep UI component focused on rendering.
 */
export function useSidebar(opts: SidebarOptions) {
	const { dnd } = useExplorer();
	const { iconPack, visibleNavIds, favoritePaths, removeFavorite } =
		useSettings();

	const visibleLocations = () =>
		opts.locations.filter((loc) => visibleNavIds().includes(loc.id));

	const onDragOver = (e: DragEvent) => {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
		(e.currentTarget as HTMLElement).classList.add("drag-over");
	};

	const onDragLeave = (e: DragEvent) => {
		(e.currentTarget as HTMLElement).classList.remove("drag-over");
	};

	const onDrop = async (e: DragEvent, targetPath: string) => {
		e.preventDefault();
		(e.currentTarget as HTMLElement).classList.remove("drag-over");

		const data = e.dataTransfer?.getData("application/json") || undefined;
		await dnd.handleDrop(targetPath, data);
	};

	return {
		iconPack,
		visibleLocations,
		favoritePaths,
		removeFavorite,
		dragHandlers: {
			onDragOver,
			onDragLeave,
			onDrop,
		},
	};
}
