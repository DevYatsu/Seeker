import { createSignal } from "solid-js";
import { fileSystem } from "../../../services/apiService";
import type { FileItem } from "../../../utils/mockData";

interface FileOpContext {
	currentRoot: () => string;
	refresh: () => void;
	mutate: (
		fn: (prev: FileItem[] | undefined) => FileItem[] | undefined,
	) => void;
}

export function useFileOperations(ctx: FileOpContext) {
	const [clipboard, setClipboard] = createSignal<string[]>([]);
	const [clipboardMode, setClipboardMode] = createSignal<"copy" | "cut">("copy");

	const handleCopy = (ids: string[]) => {
		if (ids.length > 0) {
			setClipboard(ids);
			setClipboardMode("copy");
		}
	};

	const handleCut = (ids: string[]) => {
		if (ids.length > 0) {
			setClipboard(ids);
			setClipboardMode("cut");
		}
	};

	const handlePaste = async () => {
		const root = ctx.currentRoot();
		const items = clipboard();
		if (items.length > 0 && root) {
			if (clipboardMode() === "cut") {
				await fileSystem.moveItems(items, root);
			} else {
				await fileSystem.copyItems(items, root);
			}
			setClipboard([]);
			ctx.refresh();
		}
	};

	const handleDelete = async (ids: string[], isTrash: boolean) => {
		ctx.mutate((old) => old?.filter((f) => !ids.includes(f.id)));
		try {
			if (isTrash) {
				await fileSystem.deletePermanently(ids);
			} else {
				await fileSystem.moveToTrash(ids);
			}
			ctx.refresh();
		} catch (err) {
			console.error("Delete failed:", err);
			ctx.refresh(); // Trigger reload to restore
		}
	};

	const handleRename = async (id: string, newName: string) => {
		ctx.mutate((prev) =>
			prev?.map((f) => (f.id === id ? { ...f, name: newName } : f)),
		);
		try {
			await fileSystem.renameItem(id, newName);
			ctx.refresh();
		} catch (err) {
			console.error("Rename failed:", err);
			ctx.refresh();
		}
	};

	const handleDuplicate = async (ids: string[]) => {
		await fileSystem.duplicateItems(ids);
		ctx.refresh();
	};

	const handleCreateFolder = async (name: string) => {
		await fileSystem.createDirectory(ctx.currentRoot(), name);
		ctx.refresh();
	};

	const handleCreateFile = async (name: string) => {
		await fileSystem.createFile(ctx.currentRoot(), name);
		ctx.refresh();
	};

	const handleMove = async (sourceIds: string[], targetDirId: string) => {
		try {
			await fileSystem.moveItems(sourceIds, targetDirId);
			ctx.refresh();
		} catch (err) {
			console.error("Move failed:", err);
			ctx.refresh();
		}
	};

	return {
		clipboard,
		clipboardMode,
		handleCopy,
		handleCut,
		handlePaste,
		handleDelete,
		handleRename,
		handleDuplicate,
		handleCreateFolder,
		handleCreateFile,
		handleMove,
	};
}
