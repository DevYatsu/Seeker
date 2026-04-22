import * as Lucide from "lucide-solid";

export const IconMap: Record<string, Record<string, any>> = {
	vscode: {
		Home: Lucide.House,
		Monitor: Lucide.Monitor,
		FileText: Lucide.FileText,
		Download: Lucide.Download,
		Image: Lucide.Image,
		HardDrive: Lucide.HardDrive,
		Folder: Lucide.Folder,
		File: Lucide.File,
		Search: Lucide.Search,
		ChevronLeft: Lucide.ChevronLeft,
		ChevronRight: Lucide.ChevronRight,
		List: Lucide.List,
		Grid: Lucide.LayoutGrid,
		Settings: Lucide.Settings,
		FolderPlus: Lucide.FolderPlus,
		FilePlus: Lucide.FilePlus,
		Clipboard: Lucide.Clipboard,
		ExternalLink: Lucide.ExternalLink,
		Terminal: Lucide.Terminal,
		Copy: Lucide.Copy,
		CopyPlus: Lucide.CopyPlus,
		Pencil: Lucide.Pencil,
		Package: Lucide.Package,
		Trash: Lucide.Trash2,
		Info: Lucide.Info,
		FileCode: Lucide.FileCode,
		FileVideo: Lucide.Video,
		FileAudio: Lucide.AudioLines,
		FileArchive: Lucide.FileArchive,
		FileDigit: Lucide.Binary,
		FileSearch: Lucide.FileSearch,
		AppWindow: Lucide.AppWindow,
		Music: Lucide.Music,
		Film: Lucide.Film,
		Users: Lucide.Users,
		Undo: Lucide.Undo,
		Palette: Lucide.Palette,
		Sidebar: Lucide.PanelLeft,
		Type: Lucide.Type,
		DownloadCloud: Lucide.CloudDownload,
		Check: Lucide.Check,
		Sun: Lucide.Sun,
		Moon: Lucide.Moon,
		X: Lucide.X,
	},
};

// For now, we'll point all packs to Lucide for UI consistency until remote packs are loaded
IconMap.material = IconMap.vscode;
IconMap.catppuccin = IconMap.vscode;
IconMap["catppuccin/mocha"] = IconMap.vscode;
IconMap["catppuccin/frappe"] = IconMap.vscode;
IconMap["catppuccin/macchiato"] = IconMap.vscode;
IconMap["catppuccin/latte"] = IconMap.vscode;
IconMap.lucide = IconMap.vscode;

export type IconPack = keyof typeof IconMap;

export function AppIcon(props: {
	name: string;
	pack: string; // Allow any string for sub-variants
	size?: number;
	[key: string]: any;
}) {
	// 1. Try exact pack match
	let Pack = IconMap[props.pack];

	// 2. Try base pack match (e.g. 'catppuccin/mocha' -> 'catppuccin')
	if (!Pack && props.pack.includes("/")) {
		const base = props.pack.split("/")[0];
		Pack = IconMap[base];
	}

	// 3. Fallback to vscode standard UI icons
	if (!Pack) Pack = IconMap.vscode;

	const IconComponent = Pack[props.name] || Lucide.File;
	return <IconComponent size={props.size} {...props} />;
}
