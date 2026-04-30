// src/features/explorer/components/FileBrowser/GridView.tsx
import { createEffect, createSignal, createMemo, For, Show, onMount, onCleanup } from "solid-js";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { formatSize } from "../../../../utils/formatters";
import type { FileItem } from "../../../../utils/mockData";
import { useFileItem } from "../../hooks/useFileItem";
import { FileIcon } from "./FileIcon";
import { useSettings } from "../../../../hooks/useSettings";
import { useExplorer } from "../../context/ExplorerContext";

type GridViewProps = {
	files: FileItem[];
	onItemInteract: (e: MouseEvent, id: string, rightClick?: boolean) => void;
};

const GridItem = (props: {
	file: FileItem;
	onInteract: (e: MouseEvent, id: string, rightClick?: boolean) => void;
}) => {
	const {
		isSelected,
		isCut,
		size,
		isCalculating,
		iconPack,
		onOpen,
		onCalculateSize,
		dragHandlers,
	} = useFileItem(props);
	const { gridZoom } = useSettings();

	return (
		// biome-ignore lint/a11y/useSemanticElements: gridcell is appropriate
		<div
			class={`grid-item ${props.file.type}`}
			classList={{ selected: isSelected(), "cut-item": isCut() }}
			onClick={(e) => props.onInteract(e, props.file.id)}
			onDblClick={onOpen}
			onContextMenu={(e) => props.onInteract(e, props.file.id, true)}
			draggable={true}
			{...dragHandlers}
			onKeyDown={(e) => {
				if (e.key === "Enter") onOpen();
				if (e.key === " ") onOpen();
			}}
			role="gridcell"
			tabIndex={0}
			aria-selected={isSelected()}
		>
			<div class={`grid-icon ${props.file.type}`}>
				<FileIcon
					id={props.file.id}
					type={props.file.type}
					name={props.file.name}
					pack={iconPack()}
					size={36 * gridZoom()}
				/>
			</div>
			<span class="grid-name">{props.file.name}</span>
			<span class="grid-meta">
				<Show
					when={props.file.type === "folder"}
					fallback={formatSize(props.file.size)}
				>
					<Show
						when={size() !== undefined}
						fallback={
							<button
								type="button"
								class="calc-size-btn-mini"
								onClick={onCalculateSize}
								disabled={isCalculating()}
							>
								{isCalculating() ? "..." : "--"}
							</button>
						}
					>
						{formatSize(size() || 0)}
					</Show>
				</Show>
			</span>
		</div>
	);
};

export const GridView = (props: GridViewProps) => {
	const { fetchMetadata } = useExplorer();
	let parentRef!: HTMLDivElement;
	const [containerWidth, setContainerWidth] = createSignal(800);

	onMount(() => {
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContainerWidth(entry.contentRect.width);
			}
		});
		observer.observe(parentRef);
		onCleanup(() => observer.disconnect());
	});

	// Grid layout calculations matching CSS:
	// grid-template-columns: repeat(auto-fill, minmax(108px, 1fr))
	// padding: 16px, gap: 4px
	const itemMinWidth = 108;
	const gap = 4;
	const padding = 32;

	const columns = createMemo(() => {
		const cols = Math.floor(
			(containerWidth() - padding + gap) / (itemMinWidth + gap),
		);
		return Math.max(1, cols);
	});

	const rowCount = createMemo(() =>
		Math.ceil(props.files.length / columns()),
	);

	const rowVirtualizer = createVirtualizer({
		get count() {
			return rowCount();
		},
		getScrollElement: () => parentRef,
		estimateSize: () => 120, // Approximate height of a grid item
		overscan: 4,
	});

	// Hydration: fetch metadata for first batch
	createEffect(() => {
		const idsToFetch = props.files
			.filter((f) => f.size === undefined || f.updatedAt === undefined)
			.slice(0, 50)
			.map((f) => f.id);

		if (idsToFetch.length > 0) {
			const timer = setTimeout(() => fetchMetadata(idsToFetch), 150);
			return () => clearTimeout(timer);
		}
	});

	return (
		<div
			ref={parentRef}
			class="grid-view-container"
			style={{ overflow: "auto", flex: "1", "min-height": "0", position: "relative" }}
		>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize() + padding}px`,
					width: "100%",
					position: "relative",
				}}
			>
				<For each={rowVirtualizer.getVirtualItems()}>
					{(virtualRow) => {
						const startIndex = virtualRow.index * columns();
						const endIndex = Math.min(
							startIndex + columns(),
							props.files.length,
						);
						const rowFiles = () => props.files.slice(startIndex, endIndex);

						return (
							<div
								style={{
									position: "absolute",
									top: "0",
									left: "16px",
									right: "16px",
									height: `${virtualRow.size}px`,
									transform: `translateY(${virtualRow.start + 16}px)`,
									display: "grid",
									"grid-template-columns": `repeat(${columns()}, 1fr)`,
									gap: `${gap}px`,
								}}
							>
								<For each={rowFiles()}>
									{(file) => (
										<GridItem
											file={file}
											onInteract={props.onItemInteract}
										/>
									)}
								</For>
							</div>
						);
					}}
				</For>
			</div>
		</div>
	);
};
