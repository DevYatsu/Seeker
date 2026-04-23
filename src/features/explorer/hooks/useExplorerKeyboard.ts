import { createEventListener } from "@solid-primitives/event-listener";

interface KeyboardOptions {
	selection: {
		selectedIds: () => string[];
		selectAll: () => void;
		clearSelection: () => void;
		selectByDelta: (delta: number, extend: boolean) => void;
	};
	ops: {
		handleCopy: (ids: string[]) => void;
		handleCut: (ids: string[]) => void;
		handlePaste: () => void;
		handleDelete: (ids: string[], isTrash: boolean) => void;
	};
	nav: {
		history: {
			canGoBack: boolean;
			goBack: () => void;
			addTab: () => void;
			closeTab: (index: number) => void;
			activeTabIndex: () => number;
		};
		isTrash: () => boolean;
	};
	state: {
		viewMode: () => "grid" | "list";
		setSearchQuery: (q: string) => void;
	};
	handlers: {
		handleOpen: (id: string) => void;
		setQuickLookFileId: (id: string | null) => void;
		quickLookFileId: () => string | null;
	};
	getGridColumns: () => number;
}

export function useExplorerKeyboard(opts: KeyboardOptions) {
	const handleKeyDown = async (e: KeyboardEvent) => {
		// Skip when typing in inputs
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement
		)
			return;

		const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
		const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
		const key = e.key;

		// --- Modifier combos ---
		if (cmdOrCtrl) {
			switch (key.toLowerCase()) {
				case "c":
					opts.ops.handleCopy(opts.selection.selectedIds());
					return;
				case "x":
					opts.ops.handleCut(opts.selection.selectedIds());
					return;
				case "v":
					opts.ops.handlePaste();
					return;
				case "a":
					e.preventDefault();
					opts.selection.selectAll();
					return;
				case "f":
					e.preventDefault();
					document
						.querySelector<HTMLInputElement>(".search-box input")
						?.focus();
					return;
				case "t":
					e.preventDefault();
					opts.nav.history.addTab();
					return;
				case "w":
					e.preventDefault();
					opts.nav.history.closeTab(opts.nav.history.activeTabIndex());
					return;
			}
		}

		// --- Arrow key navigation ---
		if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(key)) {
			e.preventDefault();
			const isGrid = opts.state.viewMode() === "grid";

			let delta = 0;
			if (key === "ArrowDown") delta = isGrid ? opts.getGridColumns() : 1;
			if (key === "ArrowUp") delta = isGrid ? -opts.getGridColumns() : -1;
			if (key === "ArrowRight") delta = isGrid ? 1 : 0;
			if (key === "ArrowLeft") delta = isGrid ? -1 : 0;

			if (delta !== 0) {
				opts.selection.selectByDelta(delta, e.shiftKey);
			}
			return;
		}

		// --- Enter to open ---
		if (key === "Enter") {
			const ids = opts.selection.selectedIds();
			if (ids.length > 0) {
				e.preventDefault();
				ids.forEach(opts.handlers.handleOpen);
			}
			return;
		}

		// --- Space to Quick Look ---
		if (key === " ") {
			e.preventDefault();
			if (opts.handlers.quickLookFileId()) {
				opts.handlers.setQuickLookFileId(null);
			} else {
				const ids = opts.selection.selectedIds();
				if (ids.length > 0) {
					opts.handlers.setQuickLookFileId(ids[0]);
				}
			}
			return;
		}

		// --- Escape to deselect/close ---
		if (key === "Escape") {
			if (opts.handlers.quickLookFileId()) {
				opts.handlers.setQuickLookFileId(null);
			} else {
				opts.selection.clearSelection();
				opts.state.setSearchQuery("");
			}
			return;
		}

		// --- Backspace/Delete ---
		if (key === "Backspace" || key === "Delete") {
			if (opts.selection.selectedIds().length > 0) {
				opts.ops.handleDelete(opts.selection.selectedIds(), opts.nav.isTrash());
			} else if (key === "Backspace" && opts.nav.history.canGoBack) {
				opts.nav.history.goBack();
			}
			return;
		}
	};

	createEventListener(window, "keydown", handleKeyDown);
}
