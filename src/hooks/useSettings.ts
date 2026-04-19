import { createSignal, onMount, onCleanup } from "solid-js";
import { IconPack } from "../components/AppIcon";

export type Theme = "dark" | "light";

export function useSettings() {
  const [theme, setThemeState] = createSignal<Theme>(
    (localStorage.getItem("seeker-theme") as Theme) || "dark"
  );
  
  const [iconPack, setIconPackState] = createSignal<IconPack>(
    (localStorage.getItem("seeker-icon-pack") as IconPack) || "lucide"
  );

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("seeker-theme", newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  const setIconPack = (newPack: IconPack) => {
    setIconPackState(newPack);
    localStorage.setItem("seeker-icon-pack", newPack);
  };

  onMount(() => {
    document.documentElement.dataset.theme = theme();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "seeker-theme" && e.newValue) {
        setThemeState(e.newValue as Theme);
        document.documentElement.dataset.theme = e.newValue;
      }
      if (e.key === "seeker-icon-pack" && e.newValue) {
        setIconPackState(e.newValue as IconPack);
      }
    };
    
    window.addEventListener("storage", handleStorage);

    onCleanup(() => {
      window.removeEventListener("storage", handleStorage);
    });
  });

  return { theme, setTheme, iconPack, setIconPack };
}
