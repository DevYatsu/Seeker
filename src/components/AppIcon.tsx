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
  FolderPlus,
  FilePlus,
  Clipboard,
  ExternalLink,
  Terminal,
  Copy,
  CopyPlus,
  Pencil,
  Package,
  Trash,
  Info,
  FileCode,
  FileVideo,
  FileAudio,
  FileArchive,
  FileDigit,
  FileSearch,
  AppWindow,
  Music,
  Film,
  Users,
  Undo,
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
  vscode: {
    Home, Monitor, FileText, Download, Image: ImageIcon, HardDrive, Folder, File, Search, ChevronLeft, ChevronRight,
    List: ListIcon, Grid: Grid, Settings: SettingsIcon, FolderPlus, FilePlus, Clipboard, ExternalLink, Terminal,
    Copy, CopyPlus, Pencil, Package, Trash, Info, FileCode, FileVideo, FileAudio, FileArchive, FileDigit, FileSearch, AppWindow, Music, Film, Users, Undo,
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
    FolderPlus: iCmp("mdi:folder-plus"),
    FilePlus: iCmp("mdi:file-plus"),
    Clipboard: iCmp("mdi:clipboard-outline"),
    ExternalLink: iCmp("mdi:open-in-new"),
    Terminal: iCmp("mdi:terminal"),
    Copy: iCmp("mdi:content-copy"),
    CopyPlus: iCmp("mdi:content-duplicate"),
    Pencil: iCmp("mdi:pencil"),
    Package: iCmp("mdi:package-variant-closed"),
    Trash: iCmp("mdi:trash-can"),
    Info: iCmp("mdi:information"),
    FileCode: iCmp("mdi:file-code"),
    FileVideo: iCmp("mdi:file-video"),
    FileAudio: iCmp("mdi:file-music"),
    FileArchive: iCmp("mdi:file-cabinet"),
    FileDigit: iCmp("mdi:file-numeric"),
    FileSearch: iCmp("mdi:file-search"),
    AppWindow: iCmp("mdi:application-window"),
    Music: iCmp("mdi:music"),
    Film: iCmp("mdi:filmstrip"),
    Users: iCmp("mdi:account-group"),
    Undo: iCmp("mdi:undo"),
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
    FolderPlus: iCmp("lucide:folder-plus"),
    FilePlus: iCmp("lucide:file-plus"),
    Clipboard: iCmp("lucide:clipboard"),
    ExternalLink: iCmp("lucide:external-link"),
    Terminal: iCmp("lucide:terminal"),
    Copy: iCmp("lucide:copy"),
    CopyPlus: iCmp("lucide:copy-plus"),
    Pencil: iCmp("lucide:pencil"),
    Package: iCmp("lucide:package"),
    Trash: iCmp("lucide:trash"),
    Info: iCmp("lucide:info"),
    FileCode: iCmp("catppuccin:javascript"),
    FileVideo: iCmp("catppuccin:video"),
    FileAudio: iCmp("catppuccin:audio"),
    FileArchive: iCmp("catppuccin:zip"),
    FileDigit: iCmp("catppuccin:binary"),
    FileSearch: iCmp("lucide:file-search"),
    AppWindow: iCmp("lucide:app-window"),
    Music: iCmp("lucide:music"),
    Film: iCmp("lucide:film"),
    Users: iCmp("lucide:users"),
    Undo: iCmp("lucide:undo"),
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
