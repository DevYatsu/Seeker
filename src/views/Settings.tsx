import { createSignal, onMount, For } from "solid-js";
import "../assets/App.css";
import { useSettings } from "../hooks/useSettings";
import { getUserLocations, type NavigationLocation } from "../services/apiService";

export default function Settings() {
  const { theme, setTheme, iconPack, setIconPack, visibleNavIds, toggleNavVisibility } = useSettings();
  const [locations, setLocations] = createSignal<NavigationLocation[]>([]);

  onMount(async () => {
    try {
      const locs = await getUserLocations();
      setLocations(locs);
    } catch (err) {
      console.error("Failed to fetch locations in settings:", err);
    }
  });

  return (
    <div
      class="app-container"
      style="flex-direction: column; padding: 24px; background: var(--bg-main); width: 100vw; height: 100vh; overflow-y: auto;"
    >
      <h2 style="font-size: 16px; margin-bottom: 24px; color: var(--text-main); font-weight: 600;">
        Preferences
      </h2>

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 8px;">
          Theme
        </label>
        <select
          value={theme()}
          onChange={(e) => setTheme(e.currentTarget.value as any)}
          style="width: 100%; padding: 10px; background: var(--bg-toolbar); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 8px; font-size: 13px; outline: none;"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 8px;">
          Icon Pack
        </label>
        <select
          value={iconPack()}
          onChange={(e) => setIconPack(e.currentTarget.value as any)}
          style="width: 100%; padding: 10px; background: var(--bg-toolbar); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 8px; font-size: 13px; outline: none;"
        >
          <option value="vscode">VSCode Icons</option>
          <option value="catppuccin">Catppuccin Icons</option>
          <option value="material">Material UI Icons</option>
        </select>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 8px;">
          Sidebar Folders
        </label>
        <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--bg-toolbar); border: 1px solid var(--border-color); border-radius: 8px;">
          <For each={locations()}>
            {(loc) => (
              <label style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-main); cursor: pointer; padding: 4px 0;">
                <input 
                  type="checkbox" 
                  checked={visibleNavIds().includes(loc.id)} 
                  onChange={() => toggleNavVisibility(loc.id)}
                  style="accent-color: #3b82f6; width: 14px; height: 14px;"
                />
                {loc.label}
              </label>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
