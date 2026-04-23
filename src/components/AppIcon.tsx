import {
	AppWindow,
	AudioLines,
	Binary,
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Clipboard,
	CloudDownload,
	Copy,
	CopyPlus,
	Download,
	ExternalLink,
	Eye,
	EyeOff,
	File,
	FileArchive,
	FileCode,
	FilePlus,
	FileSearch,
	FileText,
	Film,
	Folder,
	FolderOpen,
	FolderPlus,
	GitBranch,
	HardDrive,
	House,
	Image,
	Info,
	LayoutGrid,
	List,
	Monitor,
	Moon,
	MoreHorizontal,
	MoreVertical,
	Music,
	Package,
	Palette,
	PanelLeft,
	Pencil,
	Plus,
	RefreshCw,
	Search,
	Settings,
	Star,
	Sun,
	Telescope,
	Terminal,
	Trash2,
	Type,
	Undo,
	Users,
	Video,
	X,
} from "lucide-solid";

/**
 * Standard UI Icon Mappings
 * Maps semantic names used in the app to Lucide component names.
 */
// biome-ignore lint/suspicious/noExplicitAny: generic component map
export const IconMap: Record<string, any> = {
	// Brand
	Brand: Telescope,

	// Navigation
	Home: House,
	Monitor: Monitor,
	FileText: FileText,
	Download: Download,
	Image: Image,
	HardDrive: HardDrive,
	Folder: Folder,
	File: File,
	Search: Search,
	ChevronLeft: ChevronLeft,
	ChevronRight: ChevronRight,
	ChevronDown: ChevronDown,
	ChevronUp: ChevronUp,
	List: List,
	Grid: LayoutGrid,
	Settings: Settings,
	FolderPlus: FolderPlus,
	FilePlus: FilePlus,
	Clipboard: Clipboard,
	ExternalLink: ExternalLink,
	Terminal: Terminal,
	Copy: Copy,
	CopyPlus: CopyPlus,
	Pencil: Pencil,
	Package: Package,
	Trash: Trash2,
	Plus: Plus,
	Info: Info,
	FileCode: FileCode,
	FileVideo: Video,
	FileAudio: AudioLines,
	FileArchive: FileArchive,
	FileDigit: Binary,
	FileSearch: FileSearch,
	AppWindow: AppWindow,
	Music: Music,
	Film: Film,
	Users: Users,
	Undo: Undo,
	Palette: Palette,
	Sidebar: PanelLeft,
	Type: Type,
	DownloadCloud: CloudDownload,
	Check: Check,
	Sun: Sun,
	Moon: Moon,
	X: X,
	Star: Star,
	Eye: Eye,
	EyeOff: EyeOff,
	LayoutGrid: LayoutGrid,
	PanelLeft: PanelLeft,
	MoreVertical: MoreVertical,
	MoreHorizontal: MoreHorizontal,
	RefreshCw: RefreshCw,
};

/**
 * File Extension Mappings (Fallback for when no icon pack is installed)
 * Maps vscode-icon-resolver names to Lucide icons.
 */
// biome-ignore lint/suspicious/noExplicitAny: generic component map
const ResolverFallbackMap: Record<string, any> = {
	javascript: FileCode,
	typescript: FileCode,
	python: FileCode,
	rust: FileCode,
	html: FileCode,
	css: FileCode,
	json: FileCode,
	markdown: FileText,
	pdf: FileText,
	image: Image,
	video: Video,
	audio: AudioLines,
	archive: FileArchive,
	zip: FileArchive,
	binary: Binary,
	exe: AppWindow,
	folder: Folder,
	folder_open: FolderOpen,
	folder_images: Image,
	folder_videos: Video,
	folder_audio: Music,
	folder_github: Folder,
	folder_git: GitBranch,
};

export type IconPack = "lucide" | "vscode" | "material" | string;

export function AppIcon(props: {
	name: string;
	pack?: string;
	size?: number;
	class?: string;
	style?: unknown;
	// biome-ignore lint/suspicious/noExplicitAny: needed for rest props spreading
	[key: string]: any;
}) {
	// 1. Try semantic mapping
	let IconComponent = IconMap[props.name];

	// 2. Try resolver fallback
	if (!IconComponent) {
		IconComponent = ResolverFallbackMap[props.name.toLowerCase()];
	}

	// 3. Ultimate fallback
	if (!IconComponent) {
		IconComponent = props.name.toLowerCase().includes("folder") ? Folder : File;
	}

	return (
		<IconComponent
			size={props.size}
			class={props.class}
			style={props.style}
			{...props}
		/>
	);
}
