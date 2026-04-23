import { For, Show } from "solid-js";
import { formatSize } from "../../../../utils/formatters";
import type { FileItem } from "../../../../utils/mockData";
import { useFileItem } from "../../hooks/useFileItem";
import { FileIcon } from "./FileIcon";

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
	} = useFileItem(props.file);

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
					type={props.file.type}
					name={props.file.name}
					pack={iconPack()}
					size={48}
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
	return (
		<div class="grid-view-container">
			<div class="file-grid">
				<For each={props.files}>
					{(file) => <GridItem file={file} onInteract={props.onItemInteract} />}
				</For>
			</div>
		</div>
	);
};
