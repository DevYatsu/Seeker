import { createEventListener } from "@solid-primitives/event-listener";
import { useSettings } from "../../../hooks/useSettings";

interface KeyboardOptions {
	selection: {
		selectedIds: () => string[];
		selectAll: () => void;
		clear: () => void;
		handleNavigation: (
			direction: "up" | "down" | "left" | "right",
			options: { extend: boolean },
		) => void;
	};
	ops: {
		execute: (
			op: import("../modules/FileSystemManager").FileOperation,
		) => Promise<void>;
		copy: (ids: string[]) => void;
		cut: (ids: string[]) => void;
		paste: (targetPath: string) => Promise<void>;
	};
	nav: {
		currentAbsolutePath: () => string;
		canGoBack: () => boolean;
		goBack: () => void;
		addTab: () => void;
		closeTab: (index: number) => void;
		activeTabIndex: () => number;
		isTrash: () => boolean;
	};
	resources: {
		setSearchQuery: (q: string) => void;
		setViewMode: (mode: import("../modules/ResourceManager").ViewMode) => void;
	};
	undo: {
		undo: () => Promise<void>;
		redo: () => Promise<void>;
	};
	handlers: {
		handleOpen: (id: string) => void;
		setQuickLookFileId: (ids: string[] | null) => void;
		quickLookFileId: () => string[] | null;
		setIsPaletteOpen: (val: boolean) => void;
	};
}

export function useExplorerKeyboard(opts: KeyboardOptions) {
	const { gridZoom, setGridZoom } = useSettings();

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
				case "=":
				case "+":
					e.preventDefault();
					setGridZoom((z) => Math.min(3.0, z + 0.15));
					return;
				case "-":
					e.preventDefault();
					setGridZoom((z) => Math.max(0.4, z - 0.15));
					return;
				case "0":
					e.preventDefault();
					setGridZoom(1.0);
					return;
				case "c":
					opts.ops.copy(opts.selection.selectedIds());
					return;
				case "x":
					opts.ops.cut(opts.selection.selectedIds());
					return;
				case "v":
					opts.ops.paste(opts.nav.currentAbsolutePath());
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
					opts.nav.addTab();
					return;
				case "w":
					e.preventDefault();
					opts.nav.closeTab(opts.nav.activeTabIndex());
					return;
				case "z":
					e.preventDefault();
					if (e.shiftKey) {
						opts.undo.redo();
					} else {
						opts.undo.undo();
					}
					return;
				case "p":
					if (e.shiftKey) {
						e.preventDefault();
						opts.handlers.setIsPaletteOpen(true);
					}
					return;
				case "1":
					e.preventDefault();
					opts.resources.setViewMode("list");
					return;
				case "2":
					e.preventDefault();
					opts.resources.setViewMode("grid");
					return;
				case "3":
					e.preventDefault();
					opts.resources.setViewMode("column");
					return;
			}
		}

		// --- Arrow key navigation ---
		if (key === "ArrowDown") {
			e.preventDefault();
			opts.selection.handleNavigation("down", { extend: e.shiftKey });
			return;
		}
		if (key === "ArrowUp") {
			e.preventDefault();
			opts.selection.handleNavigation("up", { extend: e.shiftKey });
			return;
		}
		if (key === "ArrowRight") {
			e.preventDefault();
			opts.selection.handleNavigation("right", { extend: e.shiftKey });
			return;
		}
		if (key === "ArrowLeft") {
			e.preventDefault();
			opts.selection.handleNavigation("left", { extend: e.shiftKey });
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
					opts.handlers.setQuickLookFileId(ids);
				}
			}
			return;
		}

		// --- Escape to deselect/close ---
		if (key === "Escape") {
			if (opts.handlers.quickLookFileId()) {
				opts.handlers.setQuickLookFileId(null);
			} else {
				opts.selection.clear();
				opts.resources.setSearchQuery("");
			}
			return;
		}

		// --- Backspace/Delete ---
		if (key === "Backspace" || key === "Delete") {
			if (opts.selection.selectedIds().length > 0) {
				opts.ops.execute({
					type: "delete",
					ids: opts.selection.selectedIds(),
					permanent: opts.nav.isTrash(),
				});
			} else if (key === "Backspace" && opts.nav.canGoBack()) {
				opts.nav.goBack();
			}
			return;
		}
	};

	createEventListener(window, "keydown", handleKeyDown);
}
