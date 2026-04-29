import { makePersisted } from "@solid-primitives/storage";
import { emit, listen } from "@tauri-apps/api/event";
import {
	batch,
	createContext,
	createEffect,
	createSignal,
	onCleanup,
	useContext,
	type JSX,
} from "solid-js";
import { resourceService } from "../services/apiService";

export type IconPack =
	| "vscode"
	| "material"
	| "catppuccin/mocha"
	| "catppuccin/frappe"
	| "catppuccin/macchiato"
	| "catppuccin/latte"
	| "lucide";

interface SettingsState {
	theme: "dark" | "light";
	iconPack: IconPack;
	visibleNavIds: string[];
	favoritePaths: { id: string; label: string; path: string }[];
	gridZoom: number;
}

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

	const [gridZoom, setGridZoom] = makePersisted(createSignal<number>(1.0), {
		name: "seeker-grid-zoom",
		deserialize: (v: string) => {
			try {
				return parseFloat(v) || 1.0;
			} catch (_e) {
				return 1.0;
			}
		},
	});

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

	// Apply theme to document
	createEffect(() => {
		const currentTheme = theme();
		document.documentElement.setAttribute("data-theme", currentTheme);
		document.body.setAttribute("data-theme", currentTheme);
	});

	// Flag to prevent broadcast loops
	let isRemoteUpdate = false;

	// Listen for remote changes (from other windows)
	const unlistenAssets = listen("sync-assets", () => syncAssets());
	onCleanup(() => unlistenAssets.then((f) => f()));

	// Sync settings state
	const unlistenSettings = listen(
		"sync-settings",
		(event: { payload: SettingsState }) => {
			const {
				theme: newTheme,
				iconPack: newIconPack,
				visibleNavIds: newNavIds,
				favoritePaths: newFavPaths,
				gridZoom: newGridZoom,
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
				if (newGridZoom !== undefined && newGridZoom !== gridZoom()) {
					setGridZoom(newGridZoom);
				}

				// Reset flag after SolidJS batch or next tick
				setTimeout(() => {
					isRemoteUpdate = false;
				}, 10);
			});
		},
	);
	onCleanup(() => unlistenSettings.then((f) => f()));

	const broadcastSettings = async () => {
		if (isRemoteUpdate) return;
		emit("sync-settings", {
			theme: theme(),
			iconPack: iconPack(),
			visibleNavIds: visibleNavIds(),
			favoritePaths: favoritePaths(),
			gridZoom: gridZoom(),
		} as SettingsState);
	};

	// Watch for settings changes and broadcast
	createEffect(() => {
		theme();
		iconPack();
		visibleNavIds();
		favoritePaths();
		gridZoom();
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
		gridZoom,
		setGridZoom,
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

export type SettingsContextType = ReturnType<typeof createSettingsState>;
const SettingsContext = createContext<SettingsContextType>(
	{} as SettingsContextType,
);

export function SettingsProvider(props: { children: JSX.Element }) {
	const settings = createSettingsState();
	return (
		<SettingsContext.Provider value={settings}>
			{props.children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	const context = useContext(SettingsContext);
	if (!context) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}
	return context;
}
