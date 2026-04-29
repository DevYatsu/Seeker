import {
	createResource,
	For,
	Show,
	createSignal,
	createMemo,
	onMount,
	createEffect,
	Suspense,
} from "solid-js";
import { fileSystem } from "../../../../services/apiService";
import type { FileItem } from "../../../../utils/mockData";
import { FileIcon } from "./FileIcon";
import { getFileExtension } from "../../../../utils/path";
import { formatDate, formatSize } from "../../../../utils/formatters";
import { QuickLook } from "../QuickLook";
import { useExplorer } from "../../context/ExplorerContext";

interface ColumnViewProps {
	files: FileItem[];
	onItemInteract: (e: MouseEvent, id: string, rightClick?: boolean) => void;
	onNavigate: (path: string) => void;
	iconPack: () => any;
}

export const ColumnView = (props: ColumnViewProps) => {
	const [columnPaths, setColumnPaths] = createSignal<string[]>([]);
	const [selectedFile, setSelectedFile] = createSignal<FileItem | null>(null);
	let containerRef: HTMLDivElement | undefined;

	// Reset sub-columns when root changes
	createEffect(() => {
		props.files; // track root changes
		setColumnPaths([]);
		setSelectedFile(null);
	});

	const handleItemClick = async (
		e: MouseEvent,
		item: FileItem,
		columnIndex: number,
	) => {
		props.onItemInteract(e, item.id);

		if (item.type === "folder") {
			setColumnPaths((prev) => [...prev.slice(0, columnIndex), item.id]);
			setSelectedFile(null);
		} else {
			setColumnPaths((prev) => prev.slice(0, columnIndex));
			setSelectedFile(item);
		}
	};

	createEffect(() => {
		columnPaths(); // track changes
		selectedFile();
		if (containerRef) {
			containerRef.scrollTo({
				left: containerRef.scrollWidth,
				behavior: "smooth",
			});
		}
	});

	onMount(() => {
		if (containerRef) {
			containerRef.scrollLeft = containerRef.scrollWidth;
		}
	});

	return (
		<div class="column-view-container" ref={containerRef}>
			<Column
				files={props.files}
				onItemClick={(e, item) => handleItemClick(e, item, 0)}
				onDblClick={(item) =>
					item.type === "folder" && props.onNavigate(item.id)
				}
				iconPack={props.iconPack}
				activeId={columnPaths()[0] || selectedFile()?.id}
			/>

			<For each={columnPaths()}>
				{(path, i) => (
					<Column
						path={path}
						onItemClick={(e, item) => handleItemClick(e, item, i() + 1)}
						onDblClick={(item) =>
							item.type === "folder" && props.onNavigate(item.id)
						}
						iconPack={props.iconPack}
						activeId={
							columnPaths()[i() + 1] ||
							(i() === columnPaths().length - 1
								? selectedFile()?.id
								: undefined)
						}
					/>
				)}
			</For>

			<Show when={selectedFile()}>
				{(file) => (
					<div class="column-pane preview-pane">
						<ColumnPreview file={file()} iconPack={props.iconPack} />
					</div>
				)}
			</Show>
		</div>
	);
};

interface ColumnPreviewProps {
	file: FileItem;
	iconPack: () => any;
}

const ColumnPreview = (props: ColumnPreviewProps) => {
	const { folderSizes } = useExplorer();
	const size = () =>
		props.file.type === "folder"
			? folderSizes.sizes()[props.file.id]
			: props.file.size;

	return (
		<div class="column-preview">
			<div class="preview-header">
				<FileIcon
					id={props.file.id}
					type={props.file.type}
					name={props.file.name}
					pack={props.iconPack()}
					size={128}
				/>
				<h3 class="preview-name">{props.file.name}</h3>
				<p class="preview-kind">
					{props.file.type === "folder"
						? "Folder"
						: `${props.file.ext?.toUpperCase()} File`}
				</p>
			</div>

			<div class="preview-details">
				<div class="detail-row">
					<span class="detail-label">Size</span>
					<span class="detail-value">
						{size() !== undefined ? formatSize(size()!) : "--"}
					</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Created</span>
					<span class="detail-value">{formatDate(props.file.updatedAt)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Location</span>
					<span class="detail-value truncate" title={props.file.id}>
						{props.file.id}
					</span>
				</div>
			</div>

			<div class="preview-content">
				<Suspense
					fallback={<div class="preview-loading">Loading preview...</div>}
				>
					<QuickLook
						initialFile={props.file}
						onClose={() => {}}
						iconPack={props.iconPack()}
						embedded={true}
					/>
				</Suspense>
			</div>
		</div>
	);
};

interface ColumnProps {
	path?: string;
	files?: FileItem[];
	onItemClick: (e: MouseEvent, item: FileItem) => void;
	onDblClick: (item: FileItem) => void;
	iconPack: () => any;
	activeId?: string;
}

const Column = (props: ColumnProps) => {
	const [data] = createResource(
		() => props.path,
		async (path) => {
			if (!path) return [];
			const results = await fileSystem.listDirectory(path);
			return results.map(
				(r) =>
					({
						id: r.path,
						name: r.name,
						type: r.is_dir ? "folder" : "file",
						size: r.size ?? undefined,
						updatedAt: r.updated_at ? r.updated_at * 1000 : undefined,
						ext: getFileExtension(r.name) || "--",
					}) as FileItem,
			);
		},
	);

	const items = () => props.files || data() || [];

	return (
		<div class="column-pane">
			<div class="column-list">
				<For each={items()}>
					{(item) => (
						<div
							class="column-item"
							classList={{ active: props.activeId === item.id }}
							onClick={(e) => props.onItemClick(e, item)}
							onDblClick={() => props.onDblClick(item)}
						>
							<FileIcon
								id={item.id}
								type={item.type}
								name={item.name}
								pack={props.iconPack()}
								size={18}
							/>
							<span class="item-name">{item.name}</span>
							{item.type === "folder" && <span class="folder-arrow">›</span>}
						</div>
					)}
				</For>
			</div>
		</div>
	);
};
