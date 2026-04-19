import { For, createSelector } from "solid-js";
import { AppIcon, IconPack } from "./AppIcon";
import type { FileItem } from "../utils/mockData";
import { formatSize, formatDate } from "../utils/formatters";

type FileBrowserProps = {
  files: FileItem[];
  viewMode: "list" | "grid";
  selectedFileIds: string[];
  onSelect: (id: string | null, multi: boolean, range: boolean) => void;
  iconPack: IconPack;
};

export default function FileBrowser(props: FileBrowserProps) {
  const isSelected = createSelector<string[], string>(
    () => props.selectedFileIds,
    (id, selected) => selected.includes(id)
  );

  const handleItemClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const isMulti = e.metaKey || e.ctrlKey;
    const isRange = e.shiftKey;
    props.onSelect(id, isMulti, isRange);
  };

  return (
    <div class="file-browser" onClick={() => props.onSelect(null, false, false)}>
      {props.viewMode === "list" ? (
        <div class="list-view">
          <div class="list-header">
            <span class="col-name">Name</span>
            <span class="col-date">Date Modified</span>
            <span class="col-size">Size</span>
            <span class="col-kind">Kind</span>
          </div>
          <div class="list-body">
            <For each={props.files}>
              {(file) => (
                <div
                  class="list-row"
                  classList={{ selected: isSelected(file.id) }}
                  onClick={(e) => handleItemClick(e, file.id)}
                >
                  <span class="col-name">
                    <span class={`file-icon-wrapper ${file.type}`}>
                      <AppIcon
                        pack={props.iconPack}
                        name={file.type === "folder" ? "Folder" : "File"}
                        size={20}
                      />
                    </span>
                    {file.name}
                  </span>
                  <span class="col-date">{formatDate(file.updatedAt)}</span>
                  <span class="col-size">{formatSize(file.size)}</span>
                  <span class="col-kind">
                    {file.type === "folder"
                      ? "Folder"
                      : (file.ext?.toUpperCase() || "DOC") + " Document"}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      ) : (
        <div class="grid-view">
          <For each={props.files}>
            {(file) => (
              <div
                class="grid-item"
                classList={{ selected: isSelected(file.id) }}
                onClick={(e) => handleItemClick(e, file.id)}
              >
                <div class={`grid-icon ${file.type}`}>
                  <AppIcon
                    pack={props.iconPack}
                    name={file.type === "folder" ? "Folder" : "File"}
                    size={48}
                  />
                </div>
                <span class="grid-name">{file.name}</span>
              </div>
            )}
          </For>
        </div>
      )}
    </div>
  );
}
