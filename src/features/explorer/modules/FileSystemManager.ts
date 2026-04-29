import { createSignal, type Accessor } from "solid-js";
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
	| { type: "duplicate"; ids: string[] };

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
 *
 * Depth: High. Orchestrates API calls, optimistic UI updates, and refresh cycles.
 * Leverage: Callers use a single 'execute' method. Implementation handles the complexity of state sync.
 * Locality: All filesystem mutation logic and clipboard state live here.
 */
export function createFileSystemManager(config: FileSystemConfig) {
	const [clipboard, setClipboard] = createSignal<string[]>([]);
	const [clipboardMode, setClipboardMode] = createSignal<"copy" | "cut">(
		"copy",
	);

	const calculateInverse = (op: FileOperation): FileOperation | null => {
		switch (op.type) {
			case "rename":
				if (!op.oldName) return null;
				return {
					type: "rename",
					id: op.id.replace(op.newName, op.oldName), // approximation
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
			// 1. Optimistic Update
			applyOptimistic(op);

			try {
				// 2. API Call
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
				}

				// 3. Report for Undo
				if (!isUndoRedo && config.onExecuted) {
					const inverse = calculateInverse(op);
					if (inverse) config.onExecuted(op, inverse);
				}
			} catch (err) {
				console.error(`Operation ${op.type} failed:`, err);
				throw err;
			} finally {
				// 4. Final Sync (Revalidate)
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
			await execute({ type: "move", sourceIds: items, targetDirId: targetPath });
			setClipboard([]);
		} else {
			await execute({ type: "copy", sourceIds: items, targetDirId: targetPath });
		}
	};


	return {
		execute,
		clipboard,
		clipboardMode,
		copy,
		cut,
		paste,
	};
}
