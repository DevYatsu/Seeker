// src/features/explorer/components/FileBrowser/ListView.tsx
import { createEffect, For, Show } from "solid-js";
import { formatDate, formatSize } from "../../../../utils/formatters";
import type { FileItem } from "../../../../utils/mockData";
import { useFileItem } from "../../hooks/useFileItem";
import { FileIcon } from "./FileIcon";
import { useExplorer } from "../../context/ExplorerContext";

type ListViewProps = {
	files: FileItem[];
	onItemInteract: (e: MouseEvent, id: string, rightClick?: boolean) => void;
};

const Row = (props: {
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
	} = useFileItem(props.file);

	return (
		// biome-ignore lint/a11y/useSemanticElements: row is appropriate
		<div
			class="list-row"
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
			role="row"
			tabIndex={0}
			aria-selected={isSelected()}
		>
			<span class="col-name">
				<span class={`file-icon-wrapper ${props.file.type}`}>
					<FileIcon
						id={props.file.id}
						type={props.file.type}
						name={props.file.name}
						pack={iconPack()}
						size={20}
					/>
				</span>
				{props.file.name}
			</span>
			<span class="col-date">{formatDate(props.file.updatedAt)}</span>
			<span class="col-size">
				<Show
					when={props.file.type === "folder"}
					fallback={formatSize(props.file.size)}
				>
					<Show
						when={size() !== undefined}
						fallback={
							<Show
								when={props.file.name.toLowerCase().endsWith(".app")}
								fallback="--"
							>
								<button
									type="button"
									class="calc-size-btn"
									onClick={onCalculateSize}
									disabled={isCalculating()}
								>
									{isCalculating() ? "..." : "--"}
								</button>
							</Show>
						}
					>
						{formatSize(size() || 0)}
					</Show>
				</Show>
			</span>
			<span class="col-kind">
				{props.file.type === "folder"
					? "Folder"
					: `${props.file.ext?.toUpperCase() || "DOC"}`}
			</span>
		</div>
	);
};

export const ListView = (props: ListViewProps) => {
	const { fetchMetadata } = useExplorer();

	// Hydration: fetch metadata for the first batch
	createEffect(() => {
		const idsToFetch = props.files
			.filter((f) => f.size === undefined || f.updatedAt === undefined)
			.slice(0, 50)
			.map((f) => f.id);

		if (idsToFetch.length > 0) {
			const timer = setTimeout(() => fetchMetadata(idsToFetch), 100);
			return () => clearTimeout(timer);
		}
	});

	return (
		<div class="list-view">
			<div class="list-header">
				<span class="col-name">Name</span>
				<span class="col-date">Date Modified</span>
				<span class="col-size">Size</span>
				<span class="col-kind">Kind</span>
			</div>
			<div
				class="list-body"
				style={{ overflow: "auto", flex: "1", "min-height": "0" }}
			>
				<For each={props.files}>
					{(file) => <Row file={file} onInteract={props.onItemInteract} />}
				</For>
			</div>
		</div>
	);
};
