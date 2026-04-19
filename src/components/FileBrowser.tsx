import { For, createSelector, Show } from "solid-js";
import { AppIcon, IconPack } from "./AppIcon";
import type { FileItem } from "../utils/mockData";
import { formatSize, formatDate } from "../utils/formatters";

type FileBrowserProps = {
  files: FileItem[];
  viewMode: "list" | "grid";
  selectedFileIds: string[];
  onSelect: (id: string | null, multi: boolean, range: boolean) => void;
  onOpen?: (id: string) => void;
  onContextMenu: (e: MouseEvent, id: string | null) => void;
  iconPack: IconPack;
};

export default function FileBrowser(props: FileBrowserProps) {
  const isSelected = createSelector<string[], string>(
    () => props.selectedFileIds,
    (id, selected) => selected.includes(id)
  );

  const folders = () => props.files.filter(f => f.type === "folder");
  const filesOnly = () => props.files.filter(f => f.type === "file");

  const handleItemClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    // On Mac, Ctrl+Click is a right click equivalent
    if (isMac && e.ctrlKey) {
      handleRightClick(e, id);
      return;
    }

    const isMulti = e.metaKey || (!isMac && e.ctrlKey);
    const isRange = e.shiftKey;
    props.onSelect(id, isMulti, isRange);
  };

  const handleDoubleClick = (e: MouseEvent, file: FileItem) => {
    e.stopPropagation();
    if (file.type === "folder" && props.onOpen) {
      props.onOpen(file.id);
    }
  };

  const handleRightClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault(); // Ensure system menu is suppressed
    props.onContextMenu(e, id);
  };

  const getFileIcon = (ext?: string) => {
    if (!ext) return "File";
    const lowExt = ext.toLowerCase();
    
    if (["js", "ts", "jsx", "tsx", "html", "css", "rs", "py", "json", "c", "cpp"].includes(lowExt)) return "FileCode";
    if (["jpg", "jpeg", "png", "gif", "svg", "webp", "heic"].includes(lowExt)) return "Image";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(lowExt)) return "FileVideo";
    if (["mp3", "wav", "flac", "m4a", "ogg"].includes(lowExt)) return "FileAudio";
    if (["zip", "tar", "gz", "7z", "rar"].includes(lowExt)) return "FileArchive";
    if (["pdf", "doc", "docx", "txt", "md"].includes(lowExt)) return "FileText";
    if (["xlsx", "csv", "numbers"].includes(lowExt)) return "FileDigit";
    
    return "File";
  };

  return (
    <div class="file-browser" onClick={() => props.onSelect(null, false, false)}>
      {props.files.length === 0 && (
        <div class="empty-state">
          <AppIcon pack={props.iconPack} name="SearchSlash" size={48} />
          <p>No results found</p>
          <span>Try a different search term</span>
        </div>
      )}

      <Show when={props.viewMode === "list"}>
        <div class="list-view">
          <div class="list-header">
            <span class="col-name">Name</span>
            <span class="col-date">Date Modified</span>
            <span class="col-size">Size</span>
            <span class="col-kind">Kind</span>
          </div>
          <div class="list-body">
            <For each={folders()}>
              {(file) => (
                <div
                  class="list-row"
                  classList={{ selected: isSelected(file.id) }}
                  onClick={(e) => handleItemClick(e, file.id)}
                  onDblClick={(e) => handleDoubleClick(e, file)}
                  onContextMenu={(e) => handleRightClick(e, file.id)}
                >
                  <span class="col-name">
                    <span class={`file-icon-wrapper ${file.type}`}>
                      <AppIcon
                        pack={props.iconPack}
                        name="Folder"
                        size={20}
                      />
                    </span>
                    {file.name}
                  </span>
                  <span class="col-date">{formatDate(file.updatedAt)}</span>
                  <span class="col-size">{formatSize(file.size)}</span>
                  <span class="col-kind">Folder</span>
                </div>
              )}
            </For>
            <For each={filesOnly()}>
              {(file) => (
                <div
                  class="list-row"
                  classList={{ selected: isSelected(file.id) }}
                  onClick={(e) => handleItemClick(e, file.id)}
                  onDblClick={(e) => handleDoubleClick(e, file)}
                  onContextMenu={(e) => handleRightClick(e, file.id)}
                >
                  <span class="col-name">
                    <span class={`file-icon-wrapper ${file.type}`}>
                      <AppIcon
                        pack={props.iconPack}
                        name={getFileIcon(file.ext)}
                        size={20}
                      />
                    </span>
                    {file.name}
                  </span>
                  <span class="col-date">{formatDate(file.updatedAt)}</span>
                  <span class="col-size">{formatSize(file.size)}</span>
                  <span class="col-kind">
                    {(file.ext?.toUpperCase() || "DOC") + " Document"}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={props.viewMode === "grid"}>
        <div class="grid-view-container">
          <div class="folder-section">
            <div class="folder-grid">
              <For each={folders()}>
                {(file) => (
                  <div
                    class="grid-item folder"
                    classList={{ selected: isSelected(file.id) }}
                    onClick={(e) => handleItemClick(e, file.id)}
                    onDblClick={(e) => handleDoubleClick(e, file)}
                    onContextMenu={(e) => handleRightClick(e, file.id)}
                  >
                    <div class="grid-icon folder">
                      <AppIcon pack={props.iconPack} name="Folder" size={48} />
                    </div>
                    <span class="grid-name">{file.name}</span>
                  </div>
                )}
              </For>
            </div>
          </div>

          <div class="file-section">
            <div class="file-grid">
              <For each={filesOnly()}>
                {(file) => (
                  <div
                    class="grid-item"
                    classList={{ selected: isSelected(file.id) }}
                    onClick={(e) => handleItemClick(e, file.id)}
                    onDblClick={(e) => handleDoubleClick(e, file)}
                    onContextMenu={(e) => handleRightClick(e, file.id)}
                  >
                    <div class={`grid-icon ${file.type}`}>
                      <AppIcon pack={props.iconPack} name={getFileIcon(file.ext)} size={48} />
                    </div>
                    <span class="grid-name">{file.name}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
