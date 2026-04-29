// src/views/QuickLookPage.tsx
import { createResource, onMount, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { QuickLook } from "../features/explorer/components/QuickLook";
import { fileSystem } from "../services/apiService";
import { useSettings } from "../hooks/useSettings";
import type { FileItem } from "../utils/mockData";

export default function QuickLookPage() {
	const params = new URLSearchParams(window.location.search);
	const ids = params.get("ids")?.split(",") || [];
	const { iconPack } = useSettings();
	const appWindow = getCurrentWindow();

	const [files] = createResource(async () => {
		if (ids.length === 0) return [];
		try {
			// Reuse metadata fetcher to get file details
			const metadata = await fileSystem.getItemsMetadata(ids);
			// Map to FileItem format (basic mapping)
			return metadata.map(
				(m) =>
					({
						id: m.path,
						name: m.path.split("/").pop() || "",
						type: m.is_dir ? "folder" : "file",
						size: m.size,
						updatedAt: m.modified_at || Date.now(),
						ext: m.path.split(".").pop()?.toLowerCase(),
					}) as FileItem,
			);
		} catch (e) {
			console.error("Failed to load QuickLook files", e);
			return [];
		}
	});

	const handleClose = () => {
		appWindow.close();
	};

	return (
		<div
			class="quick-look-page"
			style={{ height: "100vh", background: "transparent" }}
		>
			<Show
				when={!files.loading}
				fallback={<div class="loading">Loading...</div>}
			>
				<QuickLook
					files={files() || []}
					onClose={handleClose}
					iconPack={iconPack()}
				/>
			</Show>
		</div>
	);
}
