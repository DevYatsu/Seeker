import { For, Show } from "solid-js";
import { formatDate, formatSize } from "../../../../utils/formatters";
import type { FileItem } from "../../../../utils/mockData";
import { useFileItem } from "../../hooks/useFileItem";
import { FileIcon } from "./FileIcon";

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
							<button
								type="button"
								class="calc-size-btn"
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
			<span class="col-kind">
				{props.file.type === "folder"
					? "Folder"
					: `${props.file.ext?.toUpperCase() || "DOC"}`}
			</span>
		</div>
	);
};

export const ListView = (props: ListViewProps) => {
	return (
		<div class="list-view">
			<div class="list-header">
				<span class="col-name">Name</span>
				<span class="col-date">Date Modified</span>
				<span class="col-size">Size</span>
				<span class="col-kind">Kind</span>
			</div>
			<div class="list-body">
				<For each={props.files}>
					{(file) => <Row file={file} onInteract={props.onItemInteract} />}
				</For>
			</div>
		</div>
	);
};
