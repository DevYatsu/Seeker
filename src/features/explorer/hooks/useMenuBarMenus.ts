// src/features/explorer/hooks/useMenuBarMenus.ts
import { createMemo } from "solid-js";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

interface MenuBarOptions {
	selection: {
		selectedIds: () => string[];
		selectAll: () => void;
		clear: () => void;
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
		items: () => any[];
	};
	undo: {
		undo: () => Promise<void>;
		redo: () => Promise<void>;
	};
	handlers: {
		setPromptConfig: (config: any) => void;
		setBatchRenameConfig: (config: any) => void;
	};
}

export function useMenuBarMenus(opts: MenuBarOptions) {
	const appWindow = getCurrentWebviewWindow();

	return createMemo(() => {
		const selectedCount = opts.selection.selectedIds().length;
		const root = opts.nav.currentAbsolutePath();

		return [
			{
				label: "File",
				items: [
					{
						label: "New Tab",
						shortcut: "⌘T",
						icon: "Plus",
						action: opts.nav.addTab,
					},
					{
						label: "Close Tab",
						shortcut: "⌘W",
						icon: "X",
						action: () => opts.nav.closeTab(opts.nav.activeTabIndex()),
					},
					{ separator: true },
					{
						label: "New Folder",
						shortcut: "⇧⌘N",
						icon: "FolderPlus",
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
						label: "New File",
						shortcut: "⌘N",
						icon: "FilePlus",
						action: () =>
							opts.handlers.setPromptConfig({
								title: "New File Name",
								onSubmit: (name: string) =>
									opts.ops.execute({
										type: "createFile",
										parentPath: root,
										name,
									}),
							}),
					},
					{ separator: true },
					{
						label: "Duplicate",
						shortcut: "⌘D",
						icon: "CopyPlus",
						disabled: selectedCount === 0,
						action: () =>
							opts.ops.execute({
								type: "duplicate",
								ids: opts.selection.selectedIds(),
							}),
					},
					{
						label: "Move to Trash",
						shortcut: "⌘⌫",
						icon: "Trash",
						disabled: selectedCount === 0,
						danger: true,
						action: () =>
							opts.ops.execute({
								type: "delete",
								ids: opts.selection.selectedIds(),
								permanent: false,
								sourceDirId: root,
							}),
					},
				],
			},
			{
				label: "Edit",
				items: [
					{
						label: "Undo",
						shortcut: "⌘Z",
						icon: "Undo",
						action: opts.undo.undo,
					},
					{
						label: "Redo",
						shortcut: "⇧⌘Z",
						icon: "Redo",
						action: opts.undo.redo,
					},
					{ separator: true },
					{
						label: "Cut",
						shortcut: "⌘X",
						icon: "Scissors",
						disabled: selectedCount === 0,
						action: () => opts.ops.cut(opts.selection.selectedIds()),
					},
					{
						label: "Copy",
						shortcut: "⌘C",
						icon: "Copy",
						disabled: selectedCount === 0,
						action: () => opts.ops.copy(opts.selection.selectedIds()),
					},
					{
						label: "Paste",
						shortcut: "⌘V",
						icon: "Clipboard",
						action: () => opts.ops.paste(root),
					},
					{ separator: true },
					{
						label: "Select All",
						shortcut: "⌘A",
						action: opts.selection.selectAll,
					},
				],
			},
			{
				label: "View",
				items: [
					{
						label: "as Icons",
						shortcut: "⌘1",
						icon: "Grid",
						action: () => opts.resources.setViewMode("grid"),
						disabled: opts.resources.viewMode() === "grid",
					},
					{
						label: "as List",
						shortcut: "⌘2",
						icon: "List",
						action: () => opts.resources.setViewMode("list"),
						disabled: opts.resources.viewMode() === "list",
					},
					{
						label: "as Columns",
						shortcut: "⌘3",
						icon: "Columns",
						action: () => opts.resources.setViewMode("column"),
						disabled: opts.resources.viewMode() === "column",
					},
					{ separator: true },
					{
						label: opts.resources.showHidden()
							? "Hide Hidden Files"
							: "Show Hidden Files",
						shortcut: "⇧⌘.",
						action: () =>
							opts.resources.setShowHidden(!opts.resources.showHidden()),
					},
					{
						label: "Refresh",
						shortcut: "⌘R",
						icon: "RefreshCw",
						action: opts.resources.refresh,
					},
				],
			},
			{
				label: "Go",
				items: [
					{
						label: "Back",
						shortcut: "⌘[",
						icon: "ArrowLeft",
						action: opts.nav.goBack,
					},
					{
						label: "Forward",
						shortcut: "⌘]",
						icon: "ArrowRight",
						action: opts.nav.goForward,
					},
					{ separator: true },
					{ label: "Home", icon: "Home", action: () => opts.nav.navigate("~") },
					{
						label: "Desktop",
						icon: "Monitor",
						action: () => opts.nav.navigate("~/Desktop"),
					},
					{
						label: "Downloads",
						icon: "Download",
						action: () => opts.nav.navigate("~/Downloads"),
					},
					{
						label: "Documents",
						icon: "FileText",
						action: () => opts.nav.navigate("~/Documents"),
					},
				],
			},
			{
				label: "Window",
				items: [
					{
						label: "Minimize",
						shortcut: "⌘M",
						action: () => appWindow.minimize(),
					},
					{ label: "Zoom", action: () => appWindow.toggleMaximize() },
					{ separator: true },
					{ label: "Bring All to Front", action: () => appWindow.setFocus() },
				],
			},
		];
	});
}
