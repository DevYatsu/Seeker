import "../assets/App.css";
import { useSettings } from "../hooks/useSettings";

export default function Settings() {
  const { theme, setTheme, iconPack, setIconPack } = useSettings();

  return (
    <div
      class="app-container"
      style="flex-direction: column; padding: 24px; background: var(--bg-main); width: 100vw; height: 100vh;"
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
          <option value="lucide">Lucide Solid</option>
          <option value="material">Material UI</option>
          <option value="fontawesome">Font Awesome (Solid)</option>
          <option value="heroicons">Heroicons</option>
          <option value="bootstrap">Bootstrap Icons</option>
          <option value="phosphor">Phosphor</option>
          <option value="tabler">Tabler Icons</option>
          <option value="catppuccin">Catppuccin (Themed)</option>
        </select>
      </div>
    </div>
  );
}
