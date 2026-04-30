// src/features/explorer/modules/FileSystemManager.ts
import { createSignal, createSelector, onCleanup } from "solid-js";
import { listen } from "@tauri-apps/api/event";
import { fileSystem } from "../../../services/apiService";
import type { FileItem } from "../../../utils/mockData";

export type FileOperation =
	| { type: "rename"; id: string; newName: string; oldName?: string }
	| {
			type: "move";
			sourceIds: string[];
			targetDirId: string;
			sourceDirId?: string;
	  }
	| { type: "copy"; sourceIds: string[]; targetDirId: string }
	| { type: "delete"; ids: string[]; permanent: boolean; sourceDirId?: string }
	| { type: "createFolder"; parentPath: string; name: string }
	| { type: "createFile"; parentPath: string; name: string }
	| { type: "duplicate"; ids: string[] }
	| { type: "batchRename"; items: { id: string; newName: string }[] }
	| { type: "compress"; sources: string[]; outputPath: string }
	| { type: "extract"; path: string; targetDir: string };

export interface FileSystemConfig {
	refresh: () => void;
	mutate: (
		fn: (prev: FileItem[] | undefined) => FileItem[] | undefined,
	) => void;
	onExecuted?: (op: FileOperation, inverse: FileOperation) => void;
	runTask: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
}

/**
 * FileSystem Transaction Module
 */
export function createFileSystemManager(config: FileSystemConfig) {
	const [clipboard, setClipboard] = createSignal<string[]>([]);
	const [clipboardMode, setClipboardMode] = createSignal<"copy" | "cut">(
		"copy",
	);
	const isClipboardItem = createSelector(clipboard);

	const unlistenPromise = listen("directory-changed", () => {
		config.refresh();
	});

	onCleanup(async () => {
		const unlisten = await unlistenPromise;
		unlisten();
	});

	const calculateInverse = (op: FileOperation): FileOperation | null => {
		switch (op.type) {
			case "rename":
				if (!op.oldName) return null;
				return {
					type: "rename",
					id: op.id.replace(op.newName, op.oldName),
					newName: op.oldName,
					oldName: op.newName,
				};
			case "move":
				if (!op.sourceDirId) return null;
				return {
					type: "move",
					sourceIds: op.sourceIds,
					targetDirId: op.sourceDirId,
					sourceDirId: op.targetDirId,
				};
			default:
				return null;
		}
	};

	const execute = async (op: FileOperation, isUndoRedo = false) => {
		return config.runTask(`${op.type} operation`, async () => {
			applyOptimistic(op);

			try {
				switch (op.type) {
					case "rename":
						await fileSystem.renameItem(op.id, op.newName);
						break;
					case "move":
						await fileSystem.moveItems(op.sourceIds, op.targetDirId);
						break;
					case "copy":
						await fileSystem.copyItems(op.sourceIds, op.targetDirId);
						break;
					case "delete":
						if (op.permanent) {
							await fileSystem.deletePermanently(op.ids);
						} else {
							await fileSystem.moveToTrash(op.ids);
						}
						break;
					case "createFolder":
						await fileSystem.createDirectory(op.parentPath, op.name);
						break;
					case "createFile":
						await fileSystem.createFile(op.parentPath, op.name);
						break;
					case "duplicate":
						await fileSystem.duplicateItems(op.ids);
						break;
					case "batchRename":
						for (const item of op.items) {
							await fileSystem.renameItem(item.id, item.newName);
						}
						break;
					case "compress":
						await fileSystem.compressItems(op.sources, op.outputPath);
						break;
					case "extract":
						await fileSystem.extractArchive(op.path, op.targetDir);
						break;
				}

				if (!isUndoRedo && config.onExecuted) {
					const inverse = calculateInverse(op);
					if (inverse) config.onExecuted(op, inverse);
				}
			} catch (err) {
				console.error(`Operation ${op.type} failed:`, err);
				throw err;
			} finally {
				config.refresh();
			}
		});
	};

	const applyOptimistic = (op: FileOperation) => {
		config.mutate((prev) => {
			if (!prev) return prev;
			switch (op.type) {
				case "rename":
					return prev.map((f) =>
						f.id === op.id ? { ...f, name: op.newName } : f,
					);
				case "batchRename": {
					const map = new Map(op.items.map((i) => [i.id, i.newName]));
					return prev.map((f) =>
						map.has(f.id) ? { ...f, name: map.get(f.id)! } : f,
					);
				}
				case "delete":
					return prev.filter((f) => !op.ids.includes(f.id));
				case "move":
					return prev.filter((f) => !op.sourceIds.includes(f.id));
				default:
					return prev;
			}
		});
	};

	const copy = (ids: string[]) => {
		if (ids.length === 0) return;
		setClipboard(ids);
		setClipboardMode("copy");
	};

	const cut = (ids: string[]) => {
		if (ids.length === 0) return;
		setClipboard(ids);
		setClipboardMode("cut");
	};

	const paste = async (targetPath: string) => {
		const items = clipboard();
		if (items.length === 0) return;

		if (clipboardMode() === "cut") {
			await execute({
				type: "move",
				sourceIds: items,
				targetDirId: targetPath,
			});
			setClipboard([]);
		} else {
			await execute({
				type: "copy",
				sourceIds: items,
				targetDirId: targetPath,
			});
		}
	};

	return {
		execute,
		clipboard,
		isClipboardItem,
		clipboardMode,
		copy,
		cut,
		paste,
	};
}
