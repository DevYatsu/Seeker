import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
	createEffect,
	createMemo,
	createResource,
	createSignal,
	onCleanup,
	onMount,
	Show,
} from "solid-js";
import { fileSystem } from "../services/apiService";
import "../assets/Editor.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getExt(path: string) {
	return path.split(".").pop()?.toLowerCase() || "";
}

function getCategory(
	ext: string,
): "text" | "image" | "video" | "audio" | "pdf" | "binary" {
	if (["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"].includes(ext))
		return "image";
	if (["mp4", "webm", "mov", "mkv"].includes(ext)) return "video";
	if (["mp3", "wav", "flac", "ogg", "m4a"].includes(ext)) return "audio";
	if (ext === "pdf") return "pdf";
	return "text"; // will be corrected to "binary" after read attempt
}

// Map file extension to a CodeMirror language loader.
// Only imports packages present in package.json to avoid Vite resolution errors.
async function getLangExtension(ext: string) {
	switch (ext) {
		case "js":
		case "jsx":
		case "mjs":
		case "cjs": {
			const { javascript } = await import("@codemirror/lang-javascript");
			return javascript();
		}
		case "ts":
		case "tsx": {
			const { javascript } = await import("@codemirror/lang-javascript");
			return javascript({ typescript: true, jsx: ext === "tsx" });
		}
		case "rs": {
			const { rust } = await import("@codemirror/lang-rust");
			return rust();
		}
		case "py": {
			const { python } = await import("@codemirror/lang-python");
			return python();
		}
		default:
			// All other file types get plain text — CodeMirror still works, no highlighting
			return [];
	}
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Editor() {
	const params = new URLSearchParams(window.location.search);
	const path = params.get("path") || "";
	const name = path.split("/").pop() || "Editor";
	const ext = getExt(path);
	const category = getCategory(ext);
	const fileUrl = () => convertFileSrc(path);

	const [content, setContent] = createSignal("");
	const [isSaving, setIsSaving] = createSignal(false);
	const [saveStatus, setSaveStatus] = createSignal<"idle" | "saved" | "error">(
		"idle",
	);
	const [isBinary, setIsBinary] = createSignal(false);
	let editorRef!: HTMLDivElement;
	let cmView: any = null;

	// ── Load file content ──
	const [fileData] = createResource(async () => {
		if (category !== "text" || !path) return null;
		try {
			const data = await fileSystem.readFileContent(path);
			setContent(data);
			return data;
		} catch (_e) {
			setIsBinary(true);
			return null;
		}
	});

	// ── Mount CodeMirror after content loads ──
	createEffect(async () => {
		if (category !== "text" || isBinary()) return;
		const data = fileData();
		if (data === undefined) return; // still loading

		const [
			{ EditorView, keymap },
			{ EditorState },
			{ defaultKeymap, historyKeymap, history },
			{ oneDark },
			langExt,
		] = await Promise.all([
			import("@codemirror/view"),
			import("@codemirror/state"),
			import("@codemirror/commands"),
			import("@codemirror/theme-one-dark"),
			getLangExtension(ext),
		]);

		// Destroy previous instance
		if (cmView) cmView.destroy();

		cmView = new EditorView({
			state: EditorState.create({
				doc: data ?? "",
				extensions: [
					history(),
					keymap.of([...defaultKeymap, ...historyKeymap]),
					oneDark,
					EditorView.lineWrapping,
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							setContent(update.state.doc.toString());
							setSaveStatus("idle");
						}
					}),
					...(Array.isArray(langExt) ? langExt : [langExt]),
				],
			}),
			parent: editorRef,
		});
	});

	onCleanup(() => {
		if (cmView) cmView.destroy();
	});

	// ── Save ──
	const handleSave = async () => {
		if (category !== "text" || isBinary() || !path) return;
		setIsSaving(true);
		try {
			await fileSystem.writeFileContent(path, content());
			setSaveStatus("saved");
			setTimeout(() => setSaveStatus("idle"), 2000);
		} catch (_e) {
			setSaveStatus("error");
		} finally {
			setIsSaving(false);
		}
	};

	// ── Keyboard ──
	onMount(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "w") {
				e.preventDefault();
				getCurrentWindow().close();
			}
		};
		window.addEventListener("keydown", handler);
		onCleanup(() => window.removeEventListener("keydown", handler));
	});

	const statusLabel = createMemo(() => {
		if (isSaving()) return "Saving…";
		if (saveStatus() === "saved") return "Saved";
		if (saveStatus() === "error") return "Error";
		return null;
	});

	return (
		<div class="ew-root" role="application">
			{/* ── Title bar (draggable) ── */}
			<div class="ew-titlebar" data-tauri-drag-region>
				<div class="ew-titlebar-left">
					<button
						type="button"
						class="ew-close-btn"
						onClick={() => getCurrentWindow().close()}
						aria-label="Close"
					/>
				</div>
				<div class="ew-titlebar-center">
					<span class="ew-filename">{name}</span>
					<Show when={saveStatus() !== "idle"}>
						<span
							class="ew-save-badge"
							classList={{
								"ew-save-badge--saved": saveStatus() === "saved",
								"ew-save-badge--error": saveStatus() === "error",
							}}
						>
							{statusLabel()}
						</span>
					</Show>
				</div>
				<div class="ew-titlebar-right">
					<Show when={category === "text" && !isBinary()}>
						<button
							type="button"
							class="ew-save-btn"
							onClick={handleSave}
							disabled={isSaving()}
						>
							{isSaving() ? "Saving…" : "Save"}
						</button>
					</Show>
				</div>
			</div>

			{/* ── Body ── */}
			<div class="ew-body">
				{/* Loading state */}
				<Show when={fileData.loading && category === "text"}>
					<div class="ew-loading">
						<div class="ew-loading-spinner" />
						<span>Loading {name}…</span>
					</div>
				</Show>

				{/* Binary fallback */}
				<Show when={isBinary()}>
					<div class="ew-unsupported">
						<span class="ew-unsupported-icon">⊘</span>
						<p class="ew-unsupported-title">Binary file</p>
						<p class="ew-unsupported-sub">
							This file cannot be displayed as text.
						</p>
					</div>
				</Show>

				{/* CodeMirror mount point */}
				<Show when={category === "text" && !isBinary()}>
					<div class="ew-codemirror-host" ref={editorRef!} />
				</Show>

				{/* PDF */}
				<Show when={category === "pdf"}>
					<iframe src={fileUrl()} class="ew-pdf" title={name} />
				</Show>

				{/* Image */}
				<Show when={category === "image"}>
					<div class="ew-media-container">
						<img src={fileUrl()} alt={name} class="ew-image" />
					</div>
				</Show>

				{/* Video */}
				<Show when={category === "video"}>
					<div class="ew-media-container">
						<video src={fileUrl()} controls class="ew-video">
							<track kind="captions" />
						</video>
					</div>
				</Show>

				{/* Audio */}
				<Show when={category === "audio"}>
					<div class="ew-media-container ew-audio-container">
						<div class="ew-audio-icon">♪</div>
						<p class="ew-audio-name">{name}</p>
						<audio src={fileUrl()} controls class="ew-audio">
							<track kind="captions" />
						</audio>
					</div>
				</Show>
			</div>
		</div>
	);
}
