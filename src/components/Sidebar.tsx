import { For } from "solid-js";
import { sidebarDrives } from "../utils/mockData";
import { AppIcon } from "./AppIcon";
import type { NavigationLocation } from "../services/apiService";
import { useSettings } from "../hooks/useSettings";

type SidebarProps = {
  activeLocation: string;
  setActiveLocation: (id: string) => void;
  locations: NavigationLocation[];
};

const NAV_CONFIG: Record<string, { icon: string }> = {
  home: { icon: "Home" },
  desktop: { icon: "Monitor" },
  documents: { icon: "FileText" },
  downloads: { icon: "Download" },
  pictures: { icon: "Image" },
  music: { icon: "Music" },
  videos: { icon: "Film" },
  public: { icon: "Users" },
  templates: { icon: "LayoutGrid" },
  applications: { icon: "AppWindow" },
  trash: { icon: "Trash" },
};

export default function Sidebar(props: SidebarProps) {
  const { iconPack, visibleNavIds } = useSettings();
  
  const visibleLocations = () => 
    props.locations.filter(loc => visibleNavIds().includes(loc.id));

  return (
    <aside class="sidebar">
      <div class="sidebar-header" style="visibility: hidden;">
        <AppIcon
          pack={iconPack()}
          name="LayoutGrid"
          size={20}
          class="brand-icon"
        />
        <span class="brand-name">Seeker</span>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h2 class="section-title">Places</h2>
          <ul>
            <For each={visibleLocations()}>
              {(loc) => (
                <li
                  class={`nav-item ${props.activeLocation === loc.id ? "active" : ""}`}
                  onClick={() => props.setActiveLocation(loc.id)}
                  title={loc.label}
                >
                  <AppIcon 
                    pack={iconPack()} 
                    name={NAV_CONFIG[loc.id]?.icon || "Folder"} 
                    size={18} 
                  />
                  <span>{loc.label}</span>
                </li>
              )}
            </For>
          </ul>
        </div>


        <div class="nav-section">
          <h2 class="section-title">Locations</h2>
          <ul>
            <For each={sidebarDrives}>
              {(drive) => (
                <li
                  class={`nav-item ${props.activeLocation === drive.id ? "active" : ""}`}
                  onClick={() => props.setActiveLocation(drive.id)}
                  title={drive.label}
                >
                  <AppIcon pack={iconPack()} name={drive.icon} size={18} />
                  <span>{drive.label}</span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
