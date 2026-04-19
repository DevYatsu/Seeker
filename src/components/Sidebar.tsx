import { For } from "solid-js";
import { sidebarLocations, sidebarDrives } from "../utils/mockData";
import { AppIcon, IconPack } from "./AppIcon";

type SidebarProps = {
  activeLocation: string;
  setActiveLocation: (id: string) => void;
  iconPack: IconPack;
};

export default function Sidebar(props: SidebarProps) {
  return (
    <aside class="sidebar">
      <div class="sidebar-header" style="visibility: hidden;">
        <AppIcon
          pack={props.iconPack}
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
            <For each={sidebarLocations}>
              {(loc) => (
                <li
                  class={`nav-item ${props.activeLocation === loc.id ? "active" : ""}`}
                  onClick={() => props.setActiveLocation(loc.id)}
                  title={loc.label}
                >
                  <AppIcon pack={props.iconPack} name={loc.icon} size={18} />
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
                  <AppIcon pack={props.iconPack} name={drive.icon} size={18} />
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
