import { createMemo } from "solid-js";
import type { ContextMenuItem } from "../../../components/ContextMenu";
import type { FileItem } from "../../../utils/mockData";

interface ContextMenuOptions {
	selection: { selectedIds: () => string[] };
	ops: {
		clipboard: () => string[];
		handleCopy: (ids: string[]) => void;
		handlePaste: () => void;
		handleDelete: (ids: string[], isTrash: boolean) => void;
		handleRename: (id: string, name: string) => void;
		handleDuplicate: (ids: string[]) => void;
		handleCreateFolder: (name: string) => void;
		handleCreateFile: (name: string) => void;
	};
	nav: {
		isTrash: () => boolean;
		currentAbsolutePath: () => string;
	};
	data: { displayedFiles: () => FileItem[] };
	handlers: {
		onOpen: (id: string) => void;
		setPromptConfig: (
			config: import("../components/ExplorerModals").PromptConfig | null,
		) => void;
		setInfoModal: (
			config: import("../components/ExplorerModals").InfoModal | null,
		) => void;
		openInTerminal: (path: string) => void;
		refresh: () => void;
	};
}

export function useExplorerContextMenu(opts: ContextMenuOptions) {
	return createMemo<ContextMenuItem[]>(() => {
		const count = opts.selection.selectedIds().length;
		const hasClipboard = opts.ops.clipboard().length > 0;
		const inTrash = opts.nav.isTrash();
		const root = opts.nav.currentAbsolutePath();

		if (count === 0) {
			if (inTrash) {
				return [
					{
						label: "Empty Trash",
						icon: "Trash",
						action: opts.handlers.refresh,
						danger: true,
					},
				];
			}
			return [
				{
					label: "New Folder",
					icon: "FolderPlus",
					action: () =>
						opts.handlers.setPromptConfig({
							title: "New Folder Name",
							onSubmit: opts.ops.handleCreateFolder,
						}),
				},
				{
					label: "New File",
					icon: "FilePlus",
					action: () =>
						opts.handlers.setPromptConfig({
							title: "New File Name",
							onSubmit: opts.ops.handleCreateFile,
						}),
				},
				{
					label: hasClipboard
						? `Paste ${opts.ops.clipboard().length} Items`
						: "Paste",
					icon: "Clipboard",
					action: opts.ops.handlePaste,
					disabled: !hasClipboard,
					separator: true,
				},
				{
					label: "Open in Terminal",
					icon: "Terminal",
					action: () => opts.handlers.openInTerminal(root),
					separator: true,
				},
			];
		}

		const firstId = opts.selection.selectedIds()[0];

		if (inTrash) {
			return [
				{
					label: count > 1 ? `Put Back ${count} Items` : "Put Back",
					icon: "Undo",
					action: async () =>
						console.log("Put back not natively implemented yet"),
				},
				{
					label: "Delete Permanently",
					icon: "Trash",
					action: () =>
						opts.ops.handleDelete(opts.selection.selectedIds(), true),
					danger: true,
					separator: true,
				},
				{
					label: "Get Info",
					icon: "Info",
					action: () => {
						const item = opts.data
							.displayedFiles()
							.find((f) => f.id === firstId);
						if (item) opts.handlers.setInfoModal({ file: item });
					},
				},
			];
		}

		return [
			{
				label: count > 1 ? `Open ${count} Items` : "Open",
				icon: "ExternalLink",
				action: () =>
					opts.selection.selectedIds().forEach(opts.handlers.onOpen),
			},
			{
				label: "Open in Terminal",
				icon: "Terminal",
				action: () => opts.handlers.openInTerminal(firstId),
			},
			{
				label: "Copy",
				icon: "Copy",
				action: () => opts.ops.handleCopy(opts.selection.selectedIds()),
				separator: true,
			},
			{
				label: "Duplicate",
				icon: "CopyPlus",
				action: () => opts.ops.handleDuplicate(opts.selection.selectedIds()),
			},
			{
				label: "Rename",
				icon: "Pencil",
				action: () => {
					const item = opts.data.displayedFiles().find((f) => f.id === firstId);
					opts.handlers.setPromptConfig({
						title: "Rename Item",
						defaultValue: item?.name,
						onSubmit: (newName: string) =>
							opts.ops.handleRename(firstId, newName),
					});
				},
				separator: true,
			},
			{
				label: "Move to Trash",
				icon: "Trash",
				action: () =>
					opts.ops.handleDelete(opts.selection.selectedIds(), false),
				danger: true,
				separator: true,
			},
			{
				label: "Get Info",
				icon: "Info",
				action: () => {
					const item = opts.data.displayedFiles().find((f) => f.id === firstId);
					if (item) opts.handlers.setInfoModal({ file: item });
				},
				separator: true,
			},
		];
	});
}
