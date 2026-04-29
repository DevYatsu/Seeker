// src/features/explorer/hooks/useCommandPalette.ts
import { createMemo } from "solid-js";
import type { Command } from "../../../components/CommandPalette";

interface PaletteOptions {
	selection: {
		selectedIds: () => string[];
		selectAll: () => void;
	};
	items: () => import("../modules/FileSystemManager").FileItem[];
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
		currentAbsolutePath: () => string;
	};
	resources: {
		setViewMode: (mode: any) => void;
		setShowHidden: (show: boolean) => void;
		refresh: () => void;
	};
	undo: {
		undo: () => Promise<void>;
		redo: () => Promise<void>;
	};
	handlers: {
		setPromptConfig: (config: any) => void;
		setInfoModal: (config: any) => void;
		setBatchRenameConfig: (config: any) => void;
	};
}

export function useCommandPalette(opts: PaletteOptions) {
	return createMemo(() => {
		const selectedCount = opts.selection.selectedIds().length;
		const root = opts.nav.currentAbsolutePath();

		const commands: Command[] = [
			// File Operations
			{
				id: "new-file",
				label: "New File",
				category: "File",
				icon: "FilePlus",
				shortcut: "⌘N",
				action: () =>
					opts.handlers.setPromptConfig({
						title: "New File Name",
						onSubmit: (name: string) =>
							opts.ops.execute({ type: "createFile", parentPath: root, name }),
					}),
			},
			{
				id: "new-folder",
				label: "New Folder",
				category: "File",
				icon: "FolderPlus",
				shortcut: "⇧⌘N",
				action: () =>
					opts.handlers.setPromptConfig({
						title: "New Folder Name",
						onSubmit: (name: string) =>
							opts.ops.execute({
								type: "createFolder",
								parentPath: root,
								name,
							}),
					}),
			},
			{
				id: "batch-rename",
				label: "Batch Rename",
				category: "File",
				icon: "Pencil",
				shortcut: "F2",
				action: () => {
					const ids = opts.selection.selectedIds();
					if (ids.length > 0) {
						const selectedItems = opts
							.items()
							.filter((item) => ids.includes(item.id));
						opts.handlers.setBatchRenameConfig({
							items: selectedItems,
							onRename: (items, mode, params) =>
								opts.ops.execute({ type: "batchRename", items, mode, params }),
						});
					}
				},
			},
			{
				id: "compress-items",
				label: "Compress (Zip)",
				category: "File",
				icon: "FileArchive",
				action: () => {
					const ids = opts.selection.selectedIds();
					if (ids.length > 0) {
						const firstId = ids[0];
						const count = ids.length;
						const defaultName =
							count === 1
								? `${opts.items().find((f) => f.id === firstId)?.name}.zip`
								: "Archive.zip";
						opts.handlers.setPromptConfig({
							title: "Compress Items",
							defaultValue: defaultName,
							onSubmit: (name: string) => {
								const outputPath = root.endsWith("/")
									? `${root}${name}`
									: `${root}/${name}`;
								opts.ops.execute({
									type: "compress",
									sources: ids,
									outputPath,
								});
							},
						});
					}
				},
			},
			{
				id: "extract-archive",
				label: "Extract (Unzip)",
				category: "File",
				icon: "Package",
				action: () => {
					const ids = opts.selection.selectedIds();
					if (ids.length === 1) {
						const firstId = ids[0];
						const item = opts.items().find((f) => f.id === firstId);
						if (item?.name.toLowerCase().endsWith(".zip")) {
							opts.ops.execute({
								type: "extract",
								path: firstId,
								targetDir: root,
							});
						}
					}
				},
			},

			// Navigation
			{
				id: "go-home",
				label: "Go Home",
				category: "Navigation",
				icon: "Home",
				action: () => opts.nav.navigate("~"),
			},
			{
				id: "go-back",
				label: "Back",
				category: "Navigation",
				icon: "ArrowLeft",
				shortcut: "⌘[",
				action: opts.nav.goBack,
			},
			{
				id: "go-forward",
				label: "Forward",
				category: "Navigation",
				icon: "ArrowRight",
				shortcut: "⌘]",
				action: opts.nav.goForward,
			},

			// View Settings
			{
				id: "view-list",
				label: "Switch to List View",
				category: "View",
				icon: "List",
				shortcut: "⌘1",
				action: () => opts.resources.setViewMode("list"),
			},
			{
				id: "view-grid",
				label: "Switch to Grid View",
				category: "View",
				icon: "LayoutGrid",
				shortcut: "⌘2",
				action: () => opts.resources.setViewMode("grid"),
			},
			{
				id: "view-column",
				label: "Switch to Column View",
				category: "View",
				icon: "Columns",
				shortcut: "⌘3",
				action: () => opts.resources.setViewMode("column"),
			},
			{
				id: "toggle-hidden",
				label: "Toggle Hidden Files",
				category: "View",
				icon: "Eye",
				shortcut: "⇧⌘.",
				action: () => opts.resources.setShowHidden(true), // Toggle logic simplified here
			},
			{
				id: "refresh",
				label: "Refresh Explorer",
				category: "System",
				icon: "RefreshCw",
				shortcut: "⌘R",
				action: opts.resources.refresh,
			},

			// Edit
			{
				id: "undo",
				label: "Undo",
				category: "Edit",
				icon: "Undo",
				shortcut: "⌘Z",
				action: opts.undo.undo,
			},
			{
				id: "redo",
				label: "Redo",
				category: "Edit",
				icon: "Redo",
				shortcut: "⇧⌘Z",
				action: opts.undo.redo,
			},
			{
				id: "select-all",
				label: "Select All",
				category: "Selection",
				shortcut: "⌘A",
				action: opts.selection.selectAll,
			},
			{
				id: "open-settings",
				label: "Open Settings",
				category: "System",
				icon: "Settings",
				shortcut: "⌘,",
				action: async () => {
					try {
						const { WebviewWindow } = await import(
							"@tauri-apps/api/webviewWindow"
						);
						const winLabel = `settings-${crypto.randomUUID()}`;
						const win = new WebviewWindow(winLabel, {
							url: "/?window=settings",
							title: "Settings",
							width: 800,
							height: 600,
							decorations: false,
							transparent: true,
							shadow: true,
						});
						await win.setFocus();
					} catch (e) {
						console.error("Failed to open settings:", e);
					}
				},
			},
		];

		return commands;
	});
}
