import { AppIcon, IconPack } from "./AppIcon";

type ToolbarProps = {
  activeLocation: string;
  activeLocationLabel: string;
  viewMode: "list" | "grid";
  setViewMode: (val: "list" | "grid") => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  iconPack: IconPack;
};

export default function Toolbar(props: ToolbarProps) {
  return (
    <header class="toolbar">
      <div class="toolbar-left">
        <button class="nav-btn">
          <AppIcon pack={props.iconPack} name="ChevronLeft" size={18} />
        </button>
        <button class="nav-btn" disabled>
          <AppIcon pack={props.iconPack} name="ChevronRight" size={18} />
        </button>
        <span class="breadcrumb">
          <span class="crum-segment">yanis</span>
          <span class="crum-separator">/</span>
          <span class="crum-segment bold">{props.activeLocationLabel}</span>
        </span>
      </div>

      <div class="toolbar-right">
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
        </div>
      </div>
    </header>
  );
}
