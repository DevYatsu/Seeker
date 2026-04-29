import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { createEffect, onCleanup } from "solid-js";

interface WatcherOptions {
	currentPath: () => string;
	onChanged: () => void;
}

export function useDirectoryWatcher(opts: WatcherOptions) {
	createEffect(() => {
		const path = opts.currentPath();
		if (!path || path === "home") return;

		// Skip location IDs that haven't been resolved to absolute paths yet
		if (!path.startsWith("/") && !path.includes(":\\")) return;

		let isActive = true;

		// Start native watcher
		invoke("watch_directory", { path }).catch((err) => {
			if (err !== "Path is not a valid directory") {
				console.error("[Watcher Error]", err);
			}
		});

		// Listen for change events from Rust
		const unlistenPromise = listen("directory-changed", () => {
			if (isActive) {
				opts.onChanged();
			}
		});

		onCleanup(() => {
			isActive = false;
			invoke("unwatch_directory").catch(console.error);
			unlistenPromise.then((f) => f());
		});
	});
}
