import { For } from "solid-js";
import { AppIcon, IconPack } from "./AppIcon";
import type { FileItem } from "../utils/mockData";

type FileBrowserProps = {
  files: FileItem[];
  viewMode: "list" | "grid";
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;
  iconPack: IconPack;
};

export default function FileBrowser(props: FileBrowserProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return "--";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div class="file-browser" onClick={() => props.setSelectedFileId(null)}>
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
                  class={`list-row ${props.selectedFileId === file.id ? "selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.setSelectedFileId(file.id);
                  }}
                >
                  <span class="col-name">
                    <span class={`file-icon-wrapper ${file.type}`}>
                      {file.type === "folder" ? (
                        <AppIcon
                          pack={props.iconPack}
                          name="Folder"
                          size={20}
                        />
                      ) : (
                        <AppIcon pack={props.iconPack} name="File" size={20} />
                      )}
                    </span>
                    {file.name}
                  </span>
                  <span class="col-date">{formatDate(file.updatedAt)}</span>
                  <span class="col-size">{formatSize(file.size)}</span>
                  <span class="col-kind">
                    {file.type === "folder"
                      ? "Folder"
                      : file.ext?.toUpperCase() + " Document"}
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
                class={`grid-item ${props.selectedFileId === file.id ? "selected" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  props.setSelectedFileId(file.id);
                }}
              >
                <div class={`grid-icon ${file.type}`}>
                  {file.type === "folder" ? (
                    <AppIcon pack={props.iconPack} name="Folder" size={48} />
                  ) : (
                    <AppIcon pack={props.iconPack} name="File" size={48} />
                  )}
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
