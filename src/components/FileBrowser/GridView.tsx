import { For } from "solid-js";
import { FileIcon } from "./FileIcon";
import type { FileItem } from "../../utils/mockData";
import type { IconPack } from "../AppIcon";

type GridViewProps = {
  files: FileItem[];
  isSelected: (id: string) => boolean;
  onItemClick: (e: MouseEvent, id: string) => void;
  onItemDoubleClick: (e: MouseEvent, file: FileItem) => void;
  onItemRightClick: (e: MouseEvent, id: string) => void;
  iconPack: IconPack;
};

export const GridView = (props: GridViewProps) => {
  const GridItem = (item: { file: FileItem }) => (
    <div
      class={`grid-item ${item.file.type}`}
      classList={{ selected: props.isSelected(item.file.id) }}
      onClick={(e) => props.onItemClick(e, item.file.id)}
      onDblClick={(e) => props.onItemDoubleClick(e, item.file)}
      onContextMenu={(e) => props.onItemRightClick(e, item.file.id)}
    >
      <div class={`grid-icon ${item.file.type}`}>
        <FileIcon type={item.file.type} ext={item.file.ext} pack={props.iconPack} size={48} />
      </div>
      <span class="grid-name">{item.file.name}</span>
    </div>
  );

  return (
    <div class="grid-view-container">
      <div class="file-grid">
        <For each={props.files}>
          {(file) => <GridItem file={file} />}
        </For>
      </div>
    </div>
  );
};
