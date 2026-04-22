export interface FileItem {
	id: string;
	name: string;
	type: "file" | "folder";
	size: number;
	updatedAt: string;
	ext?: string;
}

export const mockFiles: FileItem[] = [
	{
		id: "1",
		name: "Documents",
		type: "folder",
		size: 0,
		updatedAt: "2026-04-18T10:00:00Z",
	},
	{
		id: "2",
		name: "Downloads",
		type: "folder",
		size: 0,
		updatedAt: "2026-04-19T08:30:00Z",
	},
	{
		id: "3",
		name: "Pictures",
		type: "folder",
		size: 0,
		updatedAt: "2026-04-10T15:20:00Z",
	},
	{
		id: "4",
		name: "Projects",
		type: "folder",
		size: 0,
		updatedAt: "2026-04-19T11:00:00Z",
	},
	{
		id: "5",
		name: "Q1_Financial_Report.pdf",
		type: "file",
		size: 2450000,
		updatedAt: "2026-04-15T09:12:00Z",
	},
	{
		id: "6",
		name: "Design_System_V2.fig",
		type: "file",
		size: 15600000,
		updatedAt: "2026-04-12T16:45:00Z",
	},
	{
		id: "7",
		name: "meeting_notes.md",
		type: "file",
		size: 12400,
		updatedAt: "2026-04-19T09:00:00Z",
	},
	{
		id: "8",
		name: "vacation_photo.jpg",
		type: "file",
		size: 4500000,
		updatedAt: "2026-03-25T14:22:00Z",
	},
	{
		id: "9",
		name: "app_build.zip",
		type: "file",
		size: 56000000,
		updatedAt: "2026-04-18T18:30:00Z",
	},
	{
		id: "10",
		name: "budget_2026.xlsx",
		type: "file",
		size: 850000,
		updatedAt: "2026-04-05T11:40:00Z",
	},
];

export const sidebarLocations = [
	{ id: "home", label: "Home", icon: "Home" },
	{ id: "desktop", label: "Desktop", icon: "Monitor" },
	{ id: "documents", label: "Documents", icon: "FileText" },
	{ id: "downloads", label: "Downloads", icon: "Download" },
	{ id: "pictures", label: "Pictures", icon: "Image" },
];

export const sidebarDrives = [
	{ id: "macintosh_hd", label: "Macintosh HD", icon: "HardDrive" },
	{ id: "external", label: "External Drive", icon: "HardDrive" },
];
