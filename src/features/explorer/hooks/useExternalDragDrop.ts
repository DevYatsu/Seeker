import { getCurrentWebview } from "@tauri-apps/api/webview";
import { onCleanup, onMount } from "solid-js";
import { fileSystem } from "../../../services/apiService";

interface DragDropOptions {
	currentPath: () => string;
	onSuccess: () => void;
}

export function useExternalDragDrop(opts: DragDropOptions) {
	const unlistenPromise = getCurrentWebview().onDragDropEvent((event) => {
		if (event.payload.type === "drop") {
			const paths = event.payload.paths;
			const targetDir = opts.currentPath();

			if (paths && paths.length > 0 && targetDir) {
				fileSystem
					.copyItems(paths, targetDir)
					.then(opts.onSuccess)
					.catch((err) => {
						console.error("External drop failed:", err);
					});
			}
		}
	});

	onCleanup(() => {
		unlistenPromise.then((f) => f());
	});
}
