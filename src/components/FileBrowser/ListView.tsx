import { For } from "solid-js";
import { FileIcon } from "./FileIcon";
import type { FileItem } from "../../utils/mockData";
import { formatSize, formatDate } from "../../utils/formatters";
import type { IconPack } from "../AppIcon";

type ListViewProps = {
  files: FileItem[];
  isSelected: (id: string) => boolean;
  onItemClick: (e: MouseEvent, id: string) => void;
  onItemDoubleClick: (e: MouseEvent, file: FileItem) => void;
  onItemRightClick: (e: MouseEvent, id: string) => void;
  iconPack: IconPack;
};

export const ListView = (props: ListViewProps) => {
  const Row = (item: { file: FileItem }) => (
    <div
      class="list-row"
      classList={{ selected: props.isSelected(item.file.id) }}
      onClick={(e) => props.onItemClick(e, item.file.id)}
      onDblClick={(e) => props.onItemDoubleClick(e, item.file)}
      onContextMenu={(e) => props.onItemRightClick(e, item.file.id)}
    >
      <span class="col-name">
        <span class={`file-icon-wrapper ${item.file.type}`}>
          <FileIcon type={item.file.type} ext={item.file.ext} pack={props.iconPack} size={20} />
        </span>
        {item.file.name}
      </span>
      <span class="col-date">{formatDate(item.file.updatedAt)}</span>
      <span class="col-size">{formatSize(item.file.size)}</span>
      <span class="col-kind">
        {item.file.type === "folder" ? "Folder" : (item.file.ext?.toUpperCase() || "DOC") + " Document"}
      </span>
    </div>
  );

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
          {(file) => <Row file={file} />}
        </For>
      </div>
    </div>
  );
};
