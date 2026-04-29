// src/features/explorer/components/QuickLook.tsx
import { createEventListener } from "@solid-primitives/event-listener";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
	createMemo,
	createResource,
	Match,
	Show,
	Switch,
	For,
	createSignal,
	createEffect,
	onCleanup,
} from "solid-js";
import { AppIcon, type IconPack } from "../../../components/AppIcon";
import { fileSystem } from "../../../services/apiService";
import { formatDate, formatSize } from "../../../utils/formatters";
import type { FileItem } from "../../../utils/mockData";
import { getFileTypeCategory } from "../../../utils/path";

// Types for dynamic imports
type Highlighter = any;

let _highlighter: Highlighter = null;
async function getHighlighter() {
	if (_highlighter) return _highlighter;
	const { createHighlighter } = await import("shiki");
	_highlighter = await createHighlighter({
		themes: ["vitesse-dark", "vitesse-light"],
		langs: [
			"typescript",
			"javascript",
			"rust",
			"python",
			"json",
			"html",
			"css",
			"bash",
			"markdown",
			"yaml",
			"toml",
			"c",
			"cpp",
			"go",
			"java",
			"kotlin",
			"swift",
			"ruby",
			"php",
			"sql",
			"xml",
			"r",
			"lua",
			"dart",
		],
	});
	return _highlighter;
}

type QuickLookProps = {
	initialFile?: FileItem;
	files?: FileItem[];
	onClose: () => void;
	iconPack: IconPack;
	embedded?: boolean;
};

export function QuickLook(props: QuickLookProps) {
	const [currentIndex, setCurrentIndex] = createSignal(0);

	// Initialize index based on initialFile
	createEffect(() => {
		if (props.files && props.initialFile) {
			const idx = props.files.findIndex((f) => f.id === props.initialFile?.id);
			if (idx !== -1) setCurrentIndex(idx);
		}
	});

	const files = createMemo(
		() => props.files || (props.initialFile ? [props.initialFile] : []),
	);
	const currentFile = createMemo(
		() => files()[currentIndex()] || props.initialFile,
	);

	const category = createMemo(() =>
		currentFile() ? getFileTypeCategory(currentFile()!) : "unknown",
	);
	const fileUrl = createMemo(() =>
		currentFile() ? convertFileSrc(currentFile()!.id) : "",
	);

	const [isEditing, setIsEditing] = createSignal(false);
	const [editContent, setEditContent] = createSignal("");
	const [isSaving, setIsSaving] = createSignal(false);

	// Text preview resource
	const [textPreview, { refetch }] = createResource(
		() =>
			currentFile() && (category() === "text" || category() === "unknown")
				? currentFile()!.id
				: null,
		async (path) => {
			try {
				const res = await fileSystem.readFilePreview(path, 10000);
				if (res) setEditContent(res.content);
				return res;
			} catch (_err) {
				return null;
			}
		},
	);

	const [highlighter] = createResource(getHighlighter);

	const highlightedCode = createMemo(() => {
		const res = textPreview();
		const h = highlighter();
		if (!res || !res.content || res.is_binary || !h || !currentFile())
			return null;

		const ext = currentFile()!.ext?.toLowerCase() || "";
		const langMap: Record<string, string> = {
			js: "javascript",
			ts: "typescript",
			tsx: "typescript",
			jsx: "javascript",
			rs: "rust",
			py: "python",
			json: "json",
			md: "markdown",
			html: "html",
			css: "css",
			sh: "bash",
			bash: "bash",
			yml: "yaml",
			yaml: "yaml",
			toml: "toml",
		};

		const lang = langMap[ext] || "text";
		const theme =
			document.documentElement.getAttribute("data-theme") === "light"
				? "vitesse-light"
				: "vitesse-dark";

		try {
			return h.codeToHtml(res.content, { lang, theme });
		} catch (_e) {
			return `<pre><code>${res.content}</code></pre>`;
		}
	});

	const handleNext = () => {
		if (currentIndex() < files().length - 1) {
			setCurrentIndex(currentIndex() + 1);
			setIsEditing(false);
		}
	};

	const handlePrev = () => {
		if (currentIndex() > 0) {
			setCurrentIndex(currentIndex() - 1);
			setIsEditing(false);
		}
	};

	// Keyboard handling
	const handleKeyDown = (e: KeyboardEvent) => {
		if (isEditing()) return;

		if (e.key === "ArrowRight") {
			handleNext();
		} else if (e.key === "ArrowLeft") {
			handlePrev();
		} else if (e.key === "Escape") {
			props.onClose();
		}
	};

	createEventListener(document, "keydown", handleKeyDown);

	const content = () => (
		<div class="quick-look-content" classList={{ embedded: props.embedded }}>
			<Show when={files().length > 1}>
				<div class="quick-look-nav">
					<button
						class="ql-nav-btn prev"
						onClick={handlePrev}
						disabled={currentIndex() === 0}
					>
						<AppIcon pack={props.iconPack} name="ChevronLeft" size={24} />
					</button>
					<button
						class="ql-nav-btn next"
						onClick={handleNext}
						disabled={currentIndex() === files().length - 1}
					>
						<AppIcon pack={props.iconPack} name="ChevronRight" size={24} />
					</button>
				</div>
			</Show>

			<Switch>
				<Match when={category() === "folder"}>
					<div class="quick-look-placeholder">
						<AppIcon
							pack={props.iconPack}
							name="Folder"
							size={props.embedded ? 32 : 64}
						/>
						<p>Folder</p>
					</div>
				</Match>

				<Match when={category() === "image"}>
					<img
						src={fileUrl()}
						alt={currentFile()?.name}
						class="quick-look-media"
					/>
				</Match>

				<Match when={category() === "video"}>
					<video
						src={fileUrl()}
						controls
						autoplay={!props.embedded}
						class="quick-look-media"
					>
						<track kind="captions" />
					</video>
				</Match>

				<Match when={category() === "audio"}>
					<div class="quick-look-audio-wrapper">
						<AppIcon
							pack={props.iconPack}
							name="Music"
							size={props.embedded ? 32 : 48}
						/>
						<audio src={fileUrl()} controls autoplay={!props.embedded}>
							<track kind="captions" />
						</audio>
					</div>
				</Match>

				<Match
					when={
						category() === "text" ||
						(category() === "unknown" &&
							textPreview() &&
							!textPreview()?.is_binary)
					}
				>
					<div
						class="quick-look-text"
						classList={{
							markdown: currentFile()?.ext === "md",
							editing: isEditing(),
						}}
					>
						<Show when={textPreview.loading || highlighter.loading}>
							<div class="loading-text">Loading...</div>
						</Show>
						<div class="code-preview shiki-preview">
							<div
								class="shiki-container"
								innerHTML={highlightedCode() || ""}
							/>
						</div>
					</div>
				</Match>

				<Match when={category() === "binary"}>
					<div class="quick-look-placeholder">
						<AppIcon
							pack={props.iconPack}
							name="Binary"
							size={props.embedded ? 32 : 64}
						/>
						<p>Binary File</p>
					</div>
				</Match>
			</Switch>

			<Show when={files().length > 1}>
				<div class="quick-look-gallery-strip">
					<For each={files()}>
						{(file, idx) => (
							<div
								class="gallery-strip-item"
								classList={{ active: currentIndex() === idx() }}
								onClick={() => setCurrentIndex(idx())}
							>
								<div class="gallery-strip-icon">
									<AppIcon
										pack={props.iconPack}
										name={file.type === "folder" ? "Folder" : "File"}
										size={20}
									/>
								</div>
							</div>
						)}
					</For>
				</div>
			</Show>
		</div>
	);

	return (
		<Show when={!props.embedded} fallback={content()}>
			<div class="quick-look-overlay" onClick={props.onClose}>
				<div class="quick-look-modal" onClick={(e) => e.stopPropagation()}>
					<div class="quick-look-header">
						<div class="quick-look-title">
							<AppIcon
								pack={props.iconPack}
								name={currentFile()?.type === "folder" ? "Folder" : "File"}
								size={16}
							/>
							<span class="file-name">{currentFile()?.name}</span>
						</div>
						<button class="quick-look-close" onClick={props.onClose}>
							<AppIcon pack={props.iconPack} name="X" size={16} />
						</button>
					</div>
					{content()}
					<div class="quick-look-footer">
						<span>
							{currentFile()?.type === "folder"
								? "Folder"
								: formatSize(currentFile()?.size || 0)}
						</span>
						<span>•</span>
						<span>
							Modified{" "}
							{currentFile() ? formatDate(currentFile()!.updatedAt) : ""}
						</span>
					</div>
				</div>
			</div>
		</Show>
	);
}

export default QuickLook;
