import { createEventListener } from "@solid-primitives/event-listener";
import { convertFileSrc } from "@tauri-apps/api/core";
import { createMemo, createResource, Match, Show, Switch } from "solid-js";
import { AppIcon, type IconPack } from "../../../components/AppIcon";
import { fileSystem } from "../../../services/apiService";
import { formatDate, formatSize } from "../../../utils/formatters";
import type { FileItem } from "../../../utils/mockData";
import { getFileTypeCategory } from "../../../utils/path";

type QuickLookProps = {
	file: FileItem;
	onClose: () => void;
	iconPack: IconPack;
};

/**
 * QuickLook Component
 * Displays a fast preview of the selected file (images, videos, text).
 */
export default function QuickLook(props: QuickLookProps) {
	const category = createMemo(() => getFileTypeCategory(props.file));
	const fileUrl = createMemo(() => convertFileSrc(props.file.id));

	// Text preview resource - only runs for text files
	const [textPreview] = createResource(
		() => (category() === "text" ? props.file.id : null),
		async (path) => {
			try {
				return await fileSystem.readFilePreview(path, 10000);
			} catch (_err) {
				return "Unable to preview this file type.";
			}
		},
	);

	// Keyboard handling
	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			props.onClose();
		}
	};

	createEventListener(document, "keydown", handleKeyDown);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop close is a standard pattern
		<div class="quick-look-overlay" onClick={props.onClose} role="presentation">
			<div
				class="quick-look-modal"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === "Escape") props.onClose();
				}}
				role="dialog"
				aria-modal="true"
				tabIndex={-1}
			>
				{/* Header */}
				<div class="quick-look-header">
					<div class="quick-look-title">
						<AppIcon
							pack={props.iconPack}
							name={props.file.type === "folder" ? "Folder" : "File"}
							size={16}
						/>
						<span class="file-name">{props.file.name}</span>
					</div>
					<button
						type="button"
						class="quick-look-close"
						onClick={props.onClose}
					>
						<AppIcon pack={props.iconPack} name="X" size={16} />
					</button>
				</div>

				{/* Content Area */}
				<div class="quick-look-content">
					<Switch>
						<Match when={category() === "folder"}>
							<div class="quick-look-placeholder">
								<AppIcon pack={props.iconPack} name="Folder" size={64} />
								<p>Folder</p>
							</div>
						</Match>

						<Match when={category() === "image"}>
							<img
								src={fileUrl()}
								alt={props.file.name}
								class="quick-look-media"
							/>
						</Match>

						<Match when={category() === "video"}>
							<video src={fileUrl()} controls autoplay class="quick-look-media">
								<track kind="captions" />
							</video>
						</Match>

						<Match when={category() === "audio"}>
							<div class="quick-look-audio-wrapper">
								<AppIcon pack={props.iconPack} name="Music" size={48} />
								<audio src={fileUrl()} controls autoplay>
									<track kind="captions" />
								</audio>
							</div>
						</Match>

						<Match when={category() === "text"}>
							<div class="quick-look-text">
								<Show when={textPreview.loading}>
									<div class="loading-text">Loading preview...</div>
								</Show>
								<Show
									when={textPreview()}
									fallback={
										<Show when={!textPreview.loading}>
											<div class="loading-text">
												{props.file.size === 0
													? "Empty file"
													: "No preview available"}
											</div>
										</Show>
									}
								>
									<pre>{textPreview()}</pre>
								</Show>
							</div>
						</Match>
					</Switch>
				</div>

				{/* Footer */}
				<div class="quick-look-footer">
					<span>
						{props.file.type === "folder"
							? "Folder"
							: formatSize(props.file.size)}
					</span>
					<span>•</span>
					<span>Modified {formatDate(props.file.updatedAt)}</span>
				</div>
			</div>
		</div>
	);
}
