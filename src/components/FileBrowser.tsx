import { createSelector, Show } from "solid-js";
import { AppIcon, IconPack } from "./AppIcon";
import type { FileItem } from "../utils/mockData";
import { ListView } from "./FileBrowser/ListView";
import { GridView } from "./FileBrowser/GridView";

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

  const handleItemClick = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
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
    e.preventDefault();
    props.onContextMenu(e, id);
  };

  return (
    <div
      class="file-browser"
      onClick={() => props.onSelect(null, false, false)}
      onContextMenu={(e) => props.onContextMenu(e, null)}
    >
      <Show when={props.viewMode === "list"}>
        <ListView 
          files={props.files}
          isSelected={isSelected}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleDoubleClick}
          onItemRightClick={handleRightClick}
          iconPack={props.iconPack}
        />
      </Show>

      <Show when={props.viewMode === "grid"}>
        <GridView 
          files={props.files}
          isSelected={isSelected}
          onItemClick={handleItemClick}
          onItemDoubleClick={handleDoubleClick}
          onItemRightClick={handleRightClick}
          iconPack={props.iconPack}
        />
      </Show>
    </div>
  );
}
