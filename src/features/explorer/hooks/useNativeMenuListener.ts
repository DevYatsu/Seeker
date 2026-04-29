// src/features/explorer/hooks/useNativeMenuListener.ts
import { createEffect, onCleanup } from "solid-js";
import { listen } from "@tauri-apps/api/event";

interface NativeMenuOptions {
	selection: {
		selectedIds: () => string[];
	};
	ops: {
		execute: (op: any) => Promise<void>;
		copy: (ids: string[]) => void;
		cut: (ids: string[]) => void;
		paste: (path: string) => Promise<void>;
	};
	nav: {
		navigate: (path: string) => void;
		goBack: () => void;
		goForward: () => void;
		addTab: () => void;
		closeTab: (index: number) => void;
		activeTabIndex: () => number;
		currentAbsolutePath: () => string;
	};
	resources: {
		viewMode: () => string;
		setViewMode: (mode: any) => void;
		showHidden: () => boolean;
		setShowHidden: (show: boolean) => void;
		refresh: () => void;
	};
	undo: {
		undo: () => Promise<void>;
		redo: () => Promise<void>;
	};
	handlers: {
		setPromptConfig: (config: any) => void;
	};
}

/**
 * Hook to listen for native macOS Menu Bar events emitted from the Rust backend.
 */
export function useNativeMenuListener(opts: NativeMenuOptions) {
	createEffect(() => {
		const unlisten = listen("menu-event", (event: { payload: string }) => {
			const id = event.payload;
			const root = opts.nav.currentAbsolutePath();
			const selectedCount = opts.selection.selectedIds().length;

			switch (id) {
				case "new-tab":
					opts.nav.addTab();
					break;
				case "new-folder":
					opts.handlers.setPromptConfig({
						title: "New Folder Name",
						onSubmit: (name: string) =>
							opts.ops.execute({
								type: "createFolder",
								parentPath: root,
								name,
							}),
					});
					break;
				case "new-file":
					opts.handlers.setPromptConfig({
						title: "New File Name",
						onSubmit: (name: string) =>
							opts.ops.execute({ type: "createFile", parentPath: root, name }),
					});
					break;
				case "close-tab":
					opts.nav.closeTab(opts.nav.activeTabIndex());
					break;
				case "undo":
					opts.undo.undo();
					break;
				case "redo":
					opts.undo.redo();
					break;
				case "cut":
					if (selectedCount > 0) opts.ops.cut(opts.selection.selectedIds());
					break;
				case "copy":
					if (selectedCount > 0) opts.ops.copy(opts.selection.selectedIds());
					break;
				case "paste":
					opts.ops.paste(root);
					break;
				case "view-grid":
					opts.resources.setViewMode("grid");
					break;
				case "view-list":
					opts.resources.setViewMode("list");
					break;
				case "view-column":
					opts.resources.setViewMode("column");
					break;
				case "toggle-hidden":
					opts.resources.setShowHidden(!opts.resources.showHidden());
					break;
				case "refresh":
					opts.resources.refresh();
					break;
				case "go-back":
					opts.nav.goBack();
					break;
				case "go-forward":
					opts.nav.goForward();
					break;
				case "go-home":
					opts.nav.navigate("home");
					break;
				case "go-desktop":
					opts.nav.navigate("desktop");
					break;
				case "go-downloads":
					opts.nav.navigate("downloads");
					break;
			}
		});

		onCleanup(() => {
			unlisten.then((f) => f());
		});
	});
}
