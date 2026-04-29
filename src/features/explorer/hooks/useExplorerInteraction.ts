import type { InteractionEvent } from "../components/FileBrowser";

interface InteractionOptions {
	selection: {
		selectedIds: () => string[];
		setSelectedIds: (ids: string[]) => void;
		handleInteraction: (event: InteractionEvent) => void;
	};
	contextMenu: {
		open: (e: MouseEvent) => void;
	};
}

/**
 * Hook to manage complex user interactions with files.
 * Adheres to SoC by moving interaction logic out of the main view.
 */
export function useExplorerInteraction(opts: InteractionOptions) {
	const handleItemInteract = (event: InteractionEvent) => {
		if (event.rightClick) {
			// Find the event from the system or pass it through
			// Note: We use window.event as a fallback if the component doesn't provide it
			const mouseEvent =
				(window.event as MouseEvent) || new MouseEvent("contextmenu");
			opts.contextMenu.open(mouseEvent);

			if (!opts.selection.selectedIds().includes(event.id)) {
				opts.selection.setSelectedIds([event.id]);
			}
		} else {
			opts.selection.handleInteraction(event);
		}
	};

	return {
		handleItemInteract,
	};
}
