import { invoke } from "@tauri-apps/api/core";

export interface FileEntry {
	name: string;
	path: string;
	is_dir: boolean;
	size: number;
	updated_at: number;
}

export interface NavigationLocation {
	id: string;
	path: string;
	label: string;
}

export interface DiskInfo {
	name: string;
	mount_point: string;
	file_system: string;
	total_space: number;
	available_space: number;
	is_removable: boolean;
	is_read_only: boolean;
	disk_kind: string;
}

export interface StorageStats {
	total_free_bytes: number;
	total_bytes: number;
	disks: DiskInfo[];
}

/**
 * Interface defining the contract for File System operations.
 */
export interface IFileSystemService {
	getUserLocations(): Promise<NavigationLocation[]>;
	getStorageStats(): Promise<StorageStats>;
	listDirectory(
		path: string,
		options?: {
			sort_by?: string;
			sort_order?: string;
			offset?: number;
			limit?: number;
			search?: string;
			show_hidden?: boolean;
		},
	): Promise<[FileEntry[], number]>;
	searchFiles(rootPath: string, query: string): Promise<FileEntry[]>;
	openItem(path: string): Promise<void>;
	moveToTrash(paths: string[]): Promise<void>;
	deletePermanently(paths: string[]): Promise<void>;
	renameItem(path: string, newName: string): Promise<void>;
	createDirectory(parentPath: string, name: string): Promise<void>;
	createFile(parentPath: string, name: string): Promise<void>;
	copyItems(sources: string[], targetDir: string): Promise<void>;
	moveItems(sources: string[], targetDir: string): Promise<void>;
	duplicateItems(paths: string[]): Promise<void>;
	compressItems(sources: string[], outputPath: string): Promise<void>;
	extractArchive(path: string, targetDir: string): Promise<void>;
	openInTerminal(path: string): Promise<void>;
	calculateDirSize(path: string): Promise<number>;
	readFilePreview(
		path: string,
		maxBytes?: number,
	): Promise<{ content: string; is_binary: boolean }>;
	readFileContent(path: string): Promise<string>;
	writeFileContent(path: string, content: string): Promise<void>;
	getItemsMetadata(paths: string[]): Promise<FileEntry[]>;
}

/**
 * Interface defining the contract for Resource Management (Downloader, etc.).
 */
export interface IResourceService {
	downloadIcons(folderPath: string): Promise<void>;
	downloadResource(
		url: string,
		filename: string,
		resourceType: string,
	): Promise<void>;
	deleteIconPack(packId: string): Promise<void>;
	deleteResource(filename: string, resourceType: string): Promise<void>;
	getInstalledPacks(): Promise<string[]>;
	getInstalledFonts(): Promise<string[]>;
	listResources(resourceType: string): Promise<string[]>;
	getBaseIconsPath(): Promise<string>;
}

/**
 * Tauri implementation of the FileSystemService.
 */
export class TauriFileSystemService implements IFileSystemService {
	async getUserLocations() {
		return invoke<NavigationLocation[]>("get_user_locations");
	}
	async getStorageStats() {
		return invoke<StorageStats>("get_storage_stats");
	}
	async listDirectory(path: string, options: any = { show_hidden: false }) {
		return invoke<[FileEntry[], number]>("list_directory", { path, options });
	}
	async searchFiles(rootPath: string, query: string) {
		return invoke<FileEntry[]>("search_files", { rootPath, query });
	}
	async openItem(path: string) {
		return invoke("open_item", { path });
	}
	async moveToTrash(paths: string[]) {
		return invoke("move_to_trash", { paths });
	}
	async deletePermanently(paths: string[]) {
		return invoke("delete_permanently", { paths });
	}
	async renameItem(path: string, newName: string) {
		return invoke("rename_item", { path, newName });
	}
	async createDirectory(parentPath: string, name: string) {
		return invoke("create_directory", { parentPath, name });
	}
	async createFile(parentPath: string, name: string) {
		return invoke("create_file", { parentPath, name });
	}
	async copyItems(sources: string[], targetDir: string) {
		return invoke<void>("copy_items", { sources, targetDir });
	}
	async moveItems(sources: string[], targetDir: string) {
		return invoke<void>("move_items", { sources, targetDir });
	}
	async duplicateItems(paths: string[]) {
		return invoke<void>("duplicate_items", { paths });
	}
	async compressItems(sources: string[], outputPath: string) {
		return invoke<void>("compress_items", { sources, outputPath });
	}
	async extractArchive(path: string, targetDir: string) {
		return invoke<void>("extract_archive", { path, targetDir });
	}
	async openInTerminal(path: string) {
		return invoke("open_in_terminal", { path });
	}
	async calculateDirSize(path: string) {
		return invoke<number>("calculate_dir_size", { path });
	}
	async readFilePreview(path: string, maxBytes?: number) {
		return invoke<{ content: string; is_binary: boolean }>(
			"read_file_preview",
			{ path, maxBytes },
		);
	}
	async readFileContent(path: string) {
		return invoke<string>("read_file_content", { path });
	}
	async writeFileContent(path: string, content: string) {
		return invoke<void>("write_file_content", { path, content });
	}
	async getItemsMetadata(paths: string[]) {
		return invoke<any[]>("get_items_metadata", { paths });
	}
}

/**
 * Tauri implementation of the ResourceService.
 */
export class TauriResourceService implements IResourceService {
	async downloadIcons(folderPath: string) {
		return invoke("download_icons", { folderPath });
	}
	async downloadResource(url: string, filename: string, resourceType: string) {
		return invoke("download_resource", { url, filename, resourceType });
	}
	async deleteIconPack(packId: string) {
		return invoke("delete_icon_pack", { packId });
	}
	async deleteResource(filename: string, resourceType: string) {
		return invoke("delete_resource", { filename, resourceType });
	}
	async getInstalledPacks() {
		return invoke<string[]>("get_installed_packs");
	}
	async getInstalledFonts() {
		return invoke<string[]>("get_installed_fonts");
	}
	async listResources(resourceType: string) {
		return invoke<string[]>("list_resources", { resourceType });
	}
	async getBaseIconsPath() {
		return invoke<string>("get_base_icons_path");
	}
}

// Export singleton instances
export const fileSystem = new TauriFileSystemService();
export const resourceService = new TauriResourceService();
