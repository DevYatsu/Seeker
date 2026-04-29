// src/features/explorer/components/FileBrowser/GalleryView.tsx
import { createSignal, createMemo, For, Show, createEffect } from "solid-js";
import type { FileItem } from "../../../../utils/mockData";
import { formatSize, formatDate } from "../../../../utils/formatters";
import { QuickLook } from "../QuickLook";
import { useExplorer } from "../../context/ExplorerContext";

interface GalleryViewProps {
	files: FileItem[];
	onItemInteract: (e: MouseEvent, id: string, rightClick?: boolean) => void;
	onNavigate: (path: string) => void;
	iconPack: () => any;
}

export const GalleryView = (props: GalleryViewProps) => {
	const { selection, fetchMetadata } = useExplorer();
	const [activeIndex, setActiveIndex] = createSignal(0);
	let carouselRef: HTMLDivElement | undefined;

	const activeFile = createMemo(
		() => props.files[activeIndex()] || props.files[0],
	);

	// Sync active index with selection
	createEffect(() => {
		const selectedId = selection.selectedIds()[0];
		if (selectedId) {
			const index = props.files.findIndex((f) => f.id === selectedId);
			if (index !== -1) setActiveIndex(index);
		}
	});

	// Reset to first item when the file list changes (folder navigation)
	createEffect(() => {
		props.files;
		setActiveIndex(0);
	});

	const handleItemClick = (e: MouseEvent, index: number) => {
		const file = props.files[index];
		props.onItemInteract(e, file.id);
		setActiveIndex(index);
	};

	// Hydrate metadata for the active file and its immediate neighbours
	createEffect(() => {
		const i = activeIndex();
		const idsToFetch = [-2, -1, 0, 1, 2]
			.map((offset) => props.files[i + offset])
			.filter((f) => f && (f.size === undefined || f.updatedAt === undefined))
			.map((f) => f.id);

		if (idsToFetch.length > 0) {
			const timer = setTimeout(() => fetchMetadata(idsToFetch), 100);
			return () => clearTimeout(timer);
		}
	});

	// Scroll active carousel item into view after render
	createEffect(() => {
		const index = activeIndex();
		if (!carouselRef) return;
		const item = carouselRef.children[index] as HTMLElement | undefined;
		if (item) {
			item.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	});

	return (
		<div class="gallery-view">
			<div class="gallery-main">
				<Show when={activeFile()}>
					{(file) => (
						<div class="gallery-preview-container">
							<div class="gallery-preview-content">
								{/* 
									Lazy Loading: QuickLook only mounts when the file is active.
									It also handles content fetching internally.
								*/}
								<QuickLook
									initialFile={file()}
									onClose={() => {}}
									iconPack={props.iconPack()}
									embedded={true}
								/>
							</div>

							<div class="gallery-info">
								<h2 class="gallery-title">{file().name}</h2>
								<div class="gallery-meta">
									<span>
										{file().type === "folder"
											? "Folder"
											: file().ext?.toUpperCase()}
									</span>
									<span>•</span>
									<span>{formatSize(file().size)}</span>
									<span>•</span>
									<span>{formatDate(file().updatedAt)}</span>
								</div>
							</div>
						</div>
					)}
				</Show>
			</div>

			<div class="gallery-carousel-wrapper">
				{/* Simple flex scroll — no virtualizer needed for a filmstrip */}
				<div
					class="gallery-carousel"
					ref={carouselRef}
					style={{
						overflow: "auto",
						display: "flex",
						gap: "8px",
						padding: "8px 0",
					}}
				>
					<For each={props.files}>
						{(file, i) => (
							<div
								class="carousel-item"
								classList={{ active: activeIndex() === i() }}
								onClick={(e) => handleItemClick(e, i())}
								onDblClick={() =>
									file.type === "folder" && props.onNavigate(file.id)
								}
							>
								<FileIcon
									id={file.id}
									type={file.type}
									name={file.name}
									pack={props.iconPack()}
									size={48}
								/>
								<span class="carousel-label">{file.name}</span>
							</div>
						)}
					</For>
				</div>
			</div>
		</div>
	);
};
