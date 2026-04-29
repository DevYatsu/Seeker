import { createMemo } from "solid-js";
import type { ContextMenuItem } from "../../../components/ContextMenu";

interface ContextMenuOptions {
	selection: { selectedIds: () => string[] };
	ops: {
		clipboard: () => string[];
		execute: (
			op: import("../modules/FileSystemManager").FileOperation,
		) => Promise<void>;
		copy: (ids: string[]) => void;
		paste: (targetPath: string) => Promise<void>;
	};
	nav: {
		isTrash: () => boolean;
		currentAbsolutePath: () => string;
	};
	resources: {
		items: () => import("../../../utils/mockData").FileItem[];
		execute?: never; // for type safety
		refresh: () => void;
	};
	handlers: {
		onOpen: (id: string) => void;
		setPromptConfig: (
			config: import("../components/ExplorerModals").PromptConfig | null,
		) => void;
		setInfoModal: (
			config: import("../components/ExplorerModals").InfoModal | null,
		) => void;
		setBatchRenameConfig: (
			config: import("../components/BatchRenameModal").BatchRenameConfig | null,
		) => void;
		openInTerminal: (path: string) => void;
		addFavorite: (path: string, label: string) => void;
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
						action: opts.resources.refresh,
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
							onSubmit: (name) =>
								opts.ops.execute({
									type: "createFolder",
									parentPath: root,
									name,
								}),
						}),
				},
				{
					label: "New File",
					icon: "FilePlus",
					action: () =>
						opts.handlers.setPromptConfig({
							title: "New File Name",
							onSubmit: (name) =>
								opts.ops.execute({
									type: "createFile",
									parentPath: root,
									name,
								}),
						}),
				},
				{
					label: hasClipboard
						? `Paste ${opts.ops.clipboard().length} Items`
						: "Paste",
					icon: "Clipboard",
					action: () => opts.ops.paste(root),
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
						opts.ops.execute({
							type: "delete",
							ids: opts.selection.selectedIds(),
							permanent: true,
						}),
					danger: true,
					separator: true,
				},
				{
					label: "Get Info",
					icon: "Info",
					action: () => {
						const item = opts.resources.items().find((f) => f.id === firstId);
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
				action: () => opts.ops.copy(opts.selection.selectedIds()),
				separator: true,
			},
			{
				label: "Duplicate",
				icon: "CopyPlus",
				action: () =>
					opts.ops.execute({
						type: "duplicate",
						ids: opts.selection.selectedIds(),
					}),
			},
			{
				label: "Compress",
				icon: "FileArchive",
				action: () => {
					const defaultName =
						count === 1
							? `${opts.resources.items().find((f) => f.id === firstId)?.name}.zip`
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
								sources: opts.selection.selectedIds(),
								outputPath,
							});
						},
					});
				},
			},
			...(count === 1 &&
			opts.resources
				.items()
				.find((f) => f.id === firstId)
				?.name.toLowerCase()
				.endsWith(".zip")
				? [
						{
							label: "Extract",
							icon: "Package",
							action: () => {
								opts.ops.execute({
									type: "extract",
									path: firstId,
									targetDir: root,
								});
							},
						},
					]
				: []),
			{
				label: "Copy as Pathname",
				icon: "Terminal",
				action: () => {
					const paths = opts.selection.selectedIds().join("\n");
					navigator.clipboard.writeText(paths);
				},
			},
			{
				label: "Rename",
				icon: "Pencil",
				action: () => {
					if (count > 1) {
						const selectedItems = opts.resources
							.items()
							.filter((f) => opts.selection.selectedIds().includes(f.id));
						opts.handlers.setBatchRenameConfig({
							items: selectedItems,
							onSubmit: (results) =>
								opts.ops.execute({
									type: "batchRename",
									items: results,
								}),
						});
					} else {
						const item = opts.resources.items().find((f) => f.id === firstId);
						opts.handlers.setPromptConfig({
							title: "Rename Item",
							defaultValue: item?.name,
							onSubmit: (newName: string) =>
								opts.ops.execute({
									type: "rename",
									id: firstId,
									newName,
									oldName: item?.name,
								}),
						});
					}
				},
				separator: true,
			},
			{
				label: "Move to Trash",
				icon: "Trash",
				action: () =>
					opts.ops.execute({
						type: "delete",
						ids: opts.selection.selectedIds(),
						permanent: false,
						sourceDirId: root,
					}),
				danger: true,
				separator: true,
			},
			{
				label: "Get Info",
				icon: "Info",
				action: () => {
					const item = opts.resources.items().find((f) => f.id === firstId);
					if (item) opts.handlers.setInfoModal({ file: item });
				},
				separator: true,
			},
			...(opts.resources.items().find((f) => f.id === firstId)?.type ===
			"folder"
				? [
						{
							label: "Add to Favorites",
							icon: "Star",
							action: () => {
								const item = opts.resources
									.items()
									.find((f) => f.id === firstId);
								if (item) opts.handlers.addFavorite(item.id, item.name);
							},
							separator: true,
						},
						{
							label: "Open in New Window",
							icon: "Window",
							action: () => {
								import("@tauri-apps/api/core").then(({ invoke }) => {
									invoke("open_new_window", { path: firstId });
								});
							},
							separator: true,
						},
					]
				: []),
		];
	});
}
