import { AppIcon, IconPack } from "./AppIcon";

type ToolbarProps = {
  activeLocation: string;
  activeLocationLabel: string;
  viewMode: "list" | "grid";
  setViewMode: (val: "list" | "grid") => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  iconPack: IconPack;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  sortBy: "name" | "size" | "date";
  setSortBy: (val: "name" | "size" | "date") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (val: "asc" | "desc") => void;
  separateFolders: boolean;
  setSeparateFolders: (val: boolean) => void;
};

export default function Toolbar(props: ToolbarProps) {
  return (
    <header class="toolbar">
      <div class="toolbar-left">
        <button 
          class="nav-btn" 
          disabled={!props.canGoBack} 
          onClick={() => props.onBack()}
        >
          <AppIcon pack={props.iconPack} name="ChevronLeft" size={18} />
        </button>
        <button 
          class="nav-btn" 
          disabled={!props.canGoForward}
          onClick={() => props.onForward()}
        >
          <AppIcon pack={props.iconPack} name="ChevronRight" size={18} />
        </button>
        <span class="breadcrumb">
          <span class="crum-segment bold" title={props.activeLocationLabel}>
            {props.activeLocationLabel}
          </span>
        </span>
      </div>

      <div class="toolbar-right">
        <div class="sort-controls">
          <select 
            class="sort-select" 
            value={props.sortBy} 
            onChange={(e) => props.setSortBy(e.currentTarget.value as any)}
          >
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="date">Date</option>
          </select>
          <button 
            class="sort-btn toggle-btn" 
            title="Toggle sort order"
            onClick={() => props.setSortOrder(props.sortOrder === "asc" ? "desc" : "asc")}
          >
            <AppIcon 
              pack={props.iconPack} 
              name={props.sortOrder === "asc" ? "ChevronRight" : "ChevronLeft"} 
              size={14} 
              style={{ transform: props.sortOrder === "asc" ? "rotate(90deg)" : "rotate(-90deg)" }}
            />
          </button>
          <button 
            class={`sort-btn toggle-btn ${props.separateFolders ? "active" : ""}`}
            title="Separate folders from files"
            onClick={() => props.setSeparateFolders(!props.separateFolders)}
          >
            <AppIcon pack={props.iconPack} name="Folder" size={14} />
          </button>
        </div>

        <div class="view-toggles">
          <button
            class={`toggle-btn ${props.viewMode === "list" ? "active" : ""}`}
            onClick={() => props.setViewMode("list")}
          >
            <AppIcon pack={props.iconPack} name="List" size={18} />
          </button>
          <button
            class={`toggle-btn ${props.viewMode === "grid" ? "active" : ""}`}
            onClick={() => props.setViewMode("grid")}
          >
            <AppIcon pack={props.iconPack} name="Grid" size={18} />
          </button>
        </div>
        <div class="search-box">
          <AppIcon pack={props.iconPack} name="Search" size={14} />
          <input
            type="text"
            placeholder="Search files..."
            value={props.searchQuery}
            onInput={(e) => props.setSearchQuery(e.currentTarget.value)}
          />
          {props.searchQuery && (
            <button class="clear-search" onClick={() => props.setSearchQuery("")}>
              <AppIcon pack={props.iconPack} name="X" size={14} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
