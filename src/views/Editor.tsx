import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createResource, createSignal, onMount, Show } from "solid-js";
import { fileSystem } from "../services/apiService";
import "../assets/Editor.css";

export default function Editor() {
	const params = new URLSearchParams(window.location.search);
	const path = params.get("path") || "";
	const name = path.split("/").pop() || "Editor";

	const [content, setContent] = createSignal("");
	const [isSaving, setIsSaving] = createSignal(false);
	const [fileType, setFileType] = createSignal<
		"text" | "pdf" | "image" | "video" | "audio"
	>("text");

	onMount(() => {
		const ext = path.split(".").pop()?.toLowerCase() || "";
		if (ext === "pdf") {
			setFileType("pdf");
		} else if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
			setFileType("image");
		} else if (["mp4", "webm", "ogg"].includes(ext)) {
			setFileType("video");
		} else if (["mp3", "wav", "flac"].includes(ext)) {
			setFileType("audio");
		} else {
			setFileType("text");
		}
	});

	const [initialContent] = createResource(
		() => (fileType() === "text" && path ? path : null),
		async (p) => {
			try {
				const data = await fileSystem.readFileContent(p);
				setContent(data);
				return data;
			} catch (e) {
				console.error("Failed to load file:", e);
				setContent("Error loading file: Binary file or invalid encoding.");
				return "";
			}
		},
	);

	const handleSave = async () => {
		if (fileType() !== "text" || !path) return;
		setIsSaving(true);
		try {
			await fileSystem.writeFileContent(path, content());
		} catch (e) {
			console.error("Failed to save file:", e);
		} finally {
			setIsSaving(false);
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "s") {
			e.preventDefault();
			handleSave();
		}
	};

	const closeWindow = () => {
		getCurrentWindow().close();
	};

	return (
		<div class="editor-window" onKeyDown={handleKeyDown} role="application">
			<div class="editor-titlebar" data-tauri-drag-region>
				<span class="editor-title">{name}</span>
				<div class="editor-actions">
					<Show when={fileType() === "text"}>
						<button
							type="button"
							class="editor-btn"
							onClick={handleSave}
							disabled={isSaving()}
						>
							{isSaving() ? "Saving..." : "Save"}
						</button>
					</Show>
					<button type="button" class="editor-btn danger" onClick={closeWindow}>
						Close
					</button>
				</div>
			</div>

			<div class="editor-body">
				<Show when={fileType() === "text"}>
					<Show when={initialContent.loading}>
						<div class="editor-loading">Loading...</div>
					</Show>
					<textarea
						class="editor-textarea"
						value={content()}
						onInput={(e) => setContent(e.currentTarget.value)}
						spellcheck={false}
					/>
				</Show>

				<Show when={fileType() === "pdf"}>
					<iframe src={convertFileSrc(path)} class="editor-pdf" title={name} />
				</Show>

				<Show when={fileType() === "image"}>
					<div class="editor-media-container">
						<img src={convertFileSrc(path)} class="editor-image" alt={name} />
					</div>
				</Show>

				<Show when={fileType() === "video"}>
					<div class="editor-media-container">
						<video src={convertFileSrc(path)} controls class="editor-video">
							<track kind="captions" />
						</video>
					</div>
				</Show>

				<Show when={fileType() === "audio"}>
					<div class="editor-media-container">
						<audio src={convertFileSrc(path)} controls class="editor-audio">
							<track kind="captions" />
						</audio>
					</div>
				</Show>
			</div>
		</div>
	);
}
