import { invoke } from "@tauri-apps/api/core";

// --- Navigation ---
export interface NavigationLocation {
  id: string;
  path: string;
  label: string;
}

export const getUserLocations = async (): Promise<NavigationLocation[]> => {
  return await invoke<NavigationLocation[]>("get_user_locations");
};

// --- Storage ---
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
  disks: DiskInfo[];
  total_free_bytes: number;
  total_bytes: number;
}

export const getStorageStats = async (): Promise<StorageStats> => {
  return await invoke<StorageStats>("get_storage_stats");
};

// --- Search ---
export interface SearchResult {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  updated_at: number;
}

export const searchFiles = async (rootPath: string, query: string): Promise<SearchResult[]> => {
  return await invoke<SearchResult[]>("search_files", { rootPath, query });
};

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  updated_at: number;
}

export const listDirectory = async (path: string): Promise<FileEntry[]> => {
  return await invoke<FileEntry[]>("list_directory", { path });
};

// --- File Operations ---

export const openItem = async (path: string): Promise<void> => {
  return await invoke("open_item", { path });
};

export const moveToTrash = async (paths: string[]): Promise<void> => {
  return await invoke("move_to_trash", { paths });
};

export const deletePermanently = async (paths: string[]): Promise<void> => {
  return await invoke("delete_permanently", { paths });
};

export const renameItem = async (path: string, newName: string): Promise<void> => {
  return await invoke("rename_item", { path, newName });
};

export const createDirectory = async (parentPath: string, name: string): Promise<void> => {
  return await invoke("create_directory", { parentPath, name });
};

export const createFile = async (parentPath: string, name: string): Promise<void> => {
  return await invoke("create_file", { parentPath, name });
};

export const copyItems = async (sources: string[], targetDir: string): Promise<void> => {
  return await invoke("copy_items", { sources, targetDir });
};

export const duplicateItems = async (paths: string[]): Promise<void> => {
  return await invoke("duplicate_items", { paths });
};

export const openInTerminal = async (path: string): Promise<void> => {
  return await invoke("open_in_terminal", { path });
};
