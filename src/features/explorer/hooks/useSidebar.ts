import { useSettings } from "../../../hooks/useSettings";
import type { NavigationLocation } from "../../../services/apiService";

interface SidebarOptions {
	activeLocation: string;
	setActiveLocation: (id: string) => void;
	locations: NavigationLocation[];
	onMove?: (sourceIds: string[], targetId: string) => void;
}

/**
 * Logic hook for Sidebar.
 * Extracts state and handlers to keep UI component focused on rendering.
 */
export function useSidebar(opts: SidebarOptions) {
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

	const onDrop = (e: DragEvent, targetPath: string) => {
		e.preventDefault();
		(e.currentTarget as HTMLElement).classList.remove("drag-over");

		const data = e.dataTransfer?.getData("application/json");
		if (data && opts.onMove) {
			try {
				const sourceIds = JSON.parse(data) as string[];
				if (sourceIds.length > 0) {
					opts.onMove(sourceIds, targetPath);
				}
			} catch (err) {
				console.error("Failed to parse drop data", err);
			}
		}
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
