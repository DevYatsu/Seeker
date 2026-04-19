import {
  Home,
  Monitor,
  FileText,
  Download,
  Image as ImageIcon,
  HardDrive,
  Folder,
  File,
  Search,
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  Settings as SettingsIcon,
  Grid,
} from "lucide-solid";
import { Dynamic } from "solid-js/web";

// Utility macro to quickly build standard components to avoid writing it 100 times
const iCmp = (iconID: string) => (props: any) => (
  <iconify-icon
    icon={iconID}
    width={props.size}
    height={props.size}
    {...props}
  ></iconify-icon>
);

export const IconMap: Record<string, Record<string, any>> = {
  lucide: {
    Home,
    Monitor,
    FileText,
    Download,
    Image: ImageIcon,
    HardDrive,
    Folder,
    File,
    Search,
    ChevronLeft,
    ChevronRight,
    List: ListIcon,
    Grid: Grid,
    Settings: SettingsIcon,
  },
  material: {
    Home: iCmp("mdi:home"),
    Monitor: iCmp("mdi:monitor"),
    FileText: iCmp("mdi:file-document"),
    Download: iCmp("mdi:download"),
    Image: iCmp("mdi:image"),
    HardDrive: iCmp("mdi:harddisk"),
    Folder: iCmp("mdi:folder"),
    File: iCmp("mdi:file"),
    Search: iCmp("mdi:magnify"),
    ChevronLeft: iCmp("mdi:chevron-left"),
    ChevronRight: iCmp("mdi:chevron-right"),
    List: iCmp("mdi:format-list-bulleted"),
    Grid: iCmp("mdi:view-grid"),
    Settings: iCmp("mdi:cog"),
  },
  catppuccin: {
    Home: iCmp("lucide:home"),
    Monitor: iCmp("lucide:monitor"),
    FileText: iCmp("catppuccin:file"),
    Download: iCmp("catppuccin:folder-download"),
    Image: iCmp("catppuccin:image"),
    HardDrive: iCmp("lucide:hard-drive"),
    Folder: iCmp("catppuccin:folder"),
    File: iCmp("catppuccin:file"),
    Search: iCmp("lucide:search"),
    ChevronLeft: iCmp("lucide:chevron-left"),
    ChevronRight: iCmp("lucide:chevron-right"),
    List: iCmp("lucide:list"),
    Grid: iCmp("lucide:grid"),
    Settings: iCmp("lucide:settings"),
  },
  fontawesome: {
    Home: iCmp("fa6-solid:house"),
    Monitor: iCmp("fa6-solid:desktop"),
    FileText: iCmp("fa6-solid:file-lines"),
    Download: iCmp("fa6-solid:download"),
    Image: iCmp("fa6-solid:image"),
    HardDrive: iCmp("fa6-solid:hard-drive"),
    Folder: iCmp("fa6-solid:folder"),
    File: iCmp("fa6-solid:file"),
    Search: iCmp("fa6-solid:magnifying-glass"),
    ChevronLeft: iCmp("fa6-solid:chevron-left"),
    ChevronRight: iCmp("fa6-solid:chevron-right"),
    List: iCmp("fa6-solid:list"),
    Grid: iCmp("fa6-solid:border-all"),
    Settings: iCmp("fa6-solid:gear"),
  },
  heroicons: {
    Home: iCmp("heroicons:home-solid"),
    Monitor: iCmp("heroicons:computer-desktop-solid"),
    FileText: iCmp("heroicons:document-text-solid"),
    Download: iCmp("heroicons:arrow-down-tray-solid"),
    Image: iCmp("heroicons:photo-solid"),
    HardDrive: iCmp("heroicons:server-solid"),
    Folder: iCmp("heroicons:folder-solid"),
    File: iCmp("heroicons:document-solid"),
    Search: iCmp("heroicons:magnifying-glass-solid"),
    ChevronLeft: iCmp("heroicons:chevron-left-solid"),
    ChevronRight: iCmp("heroicons:chevron-right-solid"),
    List: iCmp("heroicons:list-bullet-solid"),
    Grid: iCmp("heroicons:squares-2x2-solid"),
    Settings: iCmp("heroicons:cog-6-tooth-solid"),
  },
  bootstrap: {
    Home: iCmp("bi:house-fill"),
    Monitor: iCmp("bi:display-fill"),
    FileText: iCmp("bi:file-earmark-text-fill"),
    Download: iCmp("bi:download"),
    Image: iCmp("bi:image-fill"),
    HardDrive: iCmp("bi:device-hdd-fill"),
    Folder: iCmp("bi:folder-fill"),
    File: iCmp("bi:file-earmark-fill"),
    Search: iCmp("bi:search"),
    ChevronLeft: iCmp("bi:chevron-left"),
    ChevronRight: iCmp("bi:chevron-right"),
    List: iCmp("bi:list-ul"),
    Grid: iCmp("bi:grid-1x2-fill"),
    Settings: iCmp("bi:gear-fill"),
  },
  phosphor: {
    Home: iCmp("ph:house-fill"),
    Monitor: iCmp("ph:desktop-fill"),
    FileText: iCmp("ph:file-text-fill"),
    Download: iCmp("ph:download-simple-fill"),
    Image: iCmp("ph:image-fill"),
    HardDrive: iCmp("ph:hard-drive-fill"),
    Folder: iCmp("ph:folder-fill"),
    File: iCmp("ph:file-fill"),
    Search: iCmp("ph:magnifying-glass-bold"),
    ChevronLeft: iCmp("ph:caret-left-bold"),
    ChevronRight: iCmp("ph:caret-right-bold"),
    List: iCmp("ph:list-checks-fill"),
    Grid: iCmp("ph:squares-four-fill"),
    Settings: iCmp("ph:gear-fill"),
  },
  tabler: {
    Home: iCmp("tabler:home-filled"),
    Monitor: iCmp("tabler:device-desktop"),
    FileText: iCmp("tabler:file-text"),
    Download: iCmp("tabler:download"),
    Image: iCmp("tabler:photo-filled"),
    HardDrive: iCmp("tabler:database"),
    Folder: iCmp("tabler:folder-filled"),
    File: iCmp("tabler:file-filled"),
    Search: iCmp("tabler:search"),
    ChevronLeft: iCmp("tabler:chevron-left"),
    ChevronRight: iCmp("tabler:chevron-right"),
    List: iCmp("tabler:list"),
    Grid: iCmp("tabler:layout-grid-filled"),
    Settings: iCmp("tabler:settings-filled"),
  },
};

export type IconPack = keyof typeof IconMap;

export function AppIcon(props: {
  name: string;
  pack: IconPack;
  size?: number;
  [key: string]: any;
}) {
  return (
    <Dynamic
      component={
        IconMap[props.pack]?.[props.name] ||
        IconMap[props.pack]?.["File"] ||
        (() => null)
      }
      {...props}
    />
  );
}
