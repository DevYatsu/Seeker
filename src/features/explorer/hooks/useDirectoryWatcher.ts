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

		let unlisten: (() => void) | undefined;
		let isActive = true;

		// Start native watcher
		invoke("watch_directory", { path }).catch(console.error);

		// Listen for change events from Rust
		listen("directory-changed", () => {
			if (isActive) {
				opts.onChanged();
			}
		}).then((fn) => {
			unlisten = fn;
		});

		onCleanup(() => {
			isActive = false;
			invoke("unwatch_directory").catch(console.error);
			if (unlisten) unlisten();
		});
	});
}
