import { makePersisted } from "@solid-primitives/storage";
import { emit, listen } from "@tauri-apps/api/event";
import { batch, createEffect, createRoot, createSignal } from "solid-js";
import { resourceService } from "../services/apiService";

export type IconPack =
	| "vscode"
	| "material"
	| "catppuccin/mocha"
	| "catppuccin/frappe"
	| "catppuccin/macchiato"
	| "catppuccin/latte"
	| "lucide";

function createSettingsState() {
	const [theme, setTheme] = makePersisted(
		createSignal<"dark" | "light">("dark"),
		{
			name: "seeker-theme",
			deserialize: (v: string) => {
				try {
					return JSON.parse(v);
				} catch (_e) {
					return v;
				}
			},
		},
	);

	const [iconPack, setIconPack] = makePersisted(
		createSignal<IconPack>("vscode"),
		{
			name: "seeker-icon-pack",
			deserialize: (v: string) => {
				try {
					return JSON.parse(v);
				} catch (_e) {
					return v;
				}
			},
		},
	);

	const [baseIconsPath, setBaseIconsPath] = makePersisted(
		createSignal<string>(""),
		{
			name: "seeker-base-icons-path",
			deserialize: (v: string) => {
				try {
					return JSON.parse(v);
				} catch (_e) {
					return v;
				}
			},
		},
	);

	const [visibleNavIds, setVisibleNavIds] = makePersisted(
		createSignal<string[]>([
			"home",
			"desktop",
			"documents",
			"downloads",
			"pictures",
			"music",
			"videos",
			"trash",
		]),
		{
			name: "seeker-visible-nav-ids",
		},
	);

	const [favoritePaths, setFavoritePaths] = makePersisted(
		createSignal<{ id: string; label: string; path: string }[]>([]),
		{
			name: "seeker-favorite-paths",
			deserialize: (v: string) => {
				try {
					return JSON.parse(v);
				} catch (_e) {
					return v;
				}
			},
		},
	);

	const [isDownloading, setIsDownloading] = createSignal(false);
	const [downloadProgress, setDownloadProgress] = createSignal<{
		pack: string;
		status: string;
	} | null>(null);

	const [installedPacks, setInstalledPacks] = createSignal<string[]>([]);
	const [installedFonts, setInstalledFonts] = createSignal<string[]>([]);
	const [lastSync, setLastSync] = createSignal(Date.now());

	// Sync function
	const syncAssets = async () => {
		const [packs, fonts, path] = await Promise.all([
			resourceService.getInstalledPacks(),
			resourceService.getInstalledFonts(),
			resourceService.getBaseIconsPath(),
		]);
		setInstalledPacks(packs);
		setInstalledFonts(fonts);
		if (path) setBaseIconsPath(path);
		setLastSync(Date.now());
	};

	// Initial sync
	createEffect(() => {
		syncAssets();
	});

	interface SettingsState {
		theme: "dark" | "light";
		iconPack: IconPack;
		visibleNavIds: string[];
		favoritePaths: { id: string; label: string; path: string }[];
	}

	// Apply theme to document
	createEffect(() => {
		const currentTheme = theme();
		document.documentElement.setAttribute("data-theme", currentTheme);
		document.body.setAttribute("data-theme", currentTheme);
	});

	// Flag to prevent broadcast loops
	let isRemoteUpdate = false;

	// Listen for remote changes (from other windows)
	listen("sync-assets", () => syncAssets());

	// Sync settings state
	listen("sync-settings", (event: { payload: SettingsState }) => {
		const {
			theme: newTheme,
			iconPack: newIconPack,
			visibleNavIds: newNavIds,
			favoritePaths: newFavPaths,
		} = event.payload;

		batch(() => {
			isRemoteUpdate = true;
			if (newTheme && newTheme !== theme()) setTheme(newTheme);
			if (newIconPack && newIconPack !== iconPack()) setIconPack(newIconPack);
			if (
				newNavIds &&
				JSON.stringify(newNavIds) !== JSON.stringify(visibleNavIds())
			) {
				setVisibleNavIds(newNavIds);
			}
			if (
				newFavPaths &&
				JSON.stringify(newFavPaths) !== JSON.stringify(favoritePaths())
			) {
				setFavoritePaths(newFavPaths);
			}

			// Reset flag after SolidJS batch or next tick
			setTimeout(() => {
				isRemoteUpdate = false;
			}, 10);
		});
	});
	const broadcastSettings = async () => {
		if (isRemoteUpdate) return;
		emit("sync-settings", {
			theme: theme(),
			iconPack: iconPack(),
			visibleNavIds: visibleNavIds(),
			favoritePaths: favoritePaths(),
		} as SettingsState);
	};

	// Watch for settings changes and broadcast
	createEffect(() => {
		theme();
		iconPack();
		visibleNavIds();
		favoritePaths();
		broadcastSettings();
	});

	const notifySync = async () => {
		emit("sync-assets");
	};

	const downloadPack = async (packId: string) => {
		setIsDownloading(true);
		setDownloadProgress({ pack: packId, status: "Downloading..." });
		try {
			await resourceService.downloadIcons(packId);
			await syncAssets();
			await notifySync();
		} catch (err) {
			console.error("Failed to download pack:", err);
		} finally {
			setIsDownloading(false);
			setDownloadProgress(null);
		}
	};

	const removePack = async (packId: string) => {
		try {
			await resourceService.deleteIconPack(packId);
			await syncAssets();
			await notifySync();
		} catch (err) {
			console.error("Failed to remove pack:", err);
		}
	};

	const downloadFont = async (fontId: string, url: string) => {
		setIsDownloading(true);
		setDownloadProgress({ pack: fontId, status: "Downloading font..." });
		try {
			await resourceService.downloadResource(url, fontId, "font");
			await syncAssets();
			await notifySync();
		} catch (err) {
			console.error("Failed to download font:", err);
		} finally {
			setIsDownloading(false);
			setDownloadProgress(null);
		}
	};

	const removeFont = async (fontId: string) => {
		try {
			await resourceService.deleteResource(fontId, "font");
			await syncAssets();
			await notifySync();
		} catch (err) {
			console.error("Failed to remove font:", err);
		}
	};

	const toggleNavVisibility = (id: string) => {
		setVisibleNavIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
		);
	};

	const addFavorite = (path: string, label: string) => {
		setFavoritePaths((prev) => {
			if (prev.some((p) => p.path === path)) return prev;
			return [...prev, { id: crypto.randomUUID(), path, label }];
		});
	};

	const removeFavorite = (id: string) => {
		setFavoritePaths((prev) => prev.filter((p) => p.id !== id));
	};

	return {
		theme,
		setTheme,
		iconPack,
		setIconPack,
		baseIconsPath,
		setBaseIconsPath,
		visibleNavIds,
		toggleNavVisibility,
		favoritePaths,
		addFavorite,
		removeFavorite,
		isDownloading,
		downloadProgress,
		installedPacks,
		installedFonts,
		lastSync,
		downloadPack,
		removePack,
		downloadFont,
		removeFont,
	};
}

// Create a global instance
const settings = createRoot(createSettingsState);

// Hook to access the global instance
export function useSettings() {
	return settings;
}
