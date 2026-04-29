import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import {
	createEffect,
	createMemo,
	createSignal,
	Match,
	Show,
	Switch,
} from "solid-js";
import {
	getCatppuccinFileIcon,
	getCatppuccinFolderIcon,
	getMaterialFileIcon,
	getMaterialFolderIcon,
	getVSIFileIcon,
	getVSIFolderIcon,
} from "vscode-icon-resolver";
import { AppIcon, type IconPack } from "../../../../components/AppIcon";
import { useSettings } from "../../../../hooks/useSettings";

// Global cache for .app icons to avoid redundant IPC calls
const APP_ICON_CACHE = new Map<string, string>();

export const FileIcon = (props: {
	id?: string;
	type: "file" | "folder";
	name: string;
	pack: IconPack;
	size: number;
	isRoot?: boolean;
}) => {
	const { baseIconsPath, installedPacks, lastSync } = useSettings();

	const [hasError, setHasError] = createSignal(false);
	const [fallbackToDefault, setFallbackToDefault] = createSignal(false);
	const [appIconPath, setAppIconPath] = createSignal<string | null>(null);

	createEffect(() => {
		if (props.id && props.name.endsWith(".app")) {
			const cached = APP_ICON_CACHE.get(props.id);
			if (cached) {
				setAppIconPath(cached);
				return;
			}

			invoke<string>("get_app_icon", { app_path: props.id })
				.then((path) => {
					APP_ICON_CACHE.set(props.id!, path);
					setAppIconPath(path);
				})
				.catch((err) => {
					console.error("Failed to load app icon:", err);
					setFallbackToDefault(true);
				});
		}
	});

	const isThumbnailable = createMemo(() => {
		const ext = props.name.split(".").pop()?.toLowerCase();
		if (props.type === "folder" && ext !== "app") return false;
		return ["jpg", "jpeg", "png", "gif", "webp", "svg", "app"].includes(
			ext || "",
		);
	});

	createEffect(() => {
		// Reset error state when pack or name changes
		props.pack;
		props.name;
		setHasError(false);
		setFallbackToDefault(false);
	});

	const iconData = createMemo(() => {
		const pack = props.pack;
		const name = props.name;
		const isFolder = props.type === "folder";

		// ... existing logic ...
		let resolvedName = isFolder ? "folder" : "file";

		if (pack.includes("material")) {
			resolvedName = isFolder
				? getMaterialFolderIcon(name, props.isRoot)
				: getMaterialFileIcon(name);
		} else if (pack.includes("catppuccin")) {
			resolvedName = isFolder
				? getCatppuccinFolderIcon(name)
				: getCatppuccinFileIcon(name);
		} else if (pack.includes("vscode")) {
			resolvedName = isFolder
				? getVSIFolderIcon(name, props.isRoot)
				: getVSIFileIcon(name);
		}

		const packFolderName = pack.replace("/", "_");
		const isInstalled = installedPacks().includes(pack);
		const basePath = baseIconsPath();
		const timestamp = lastSync();

		if (isInstalled && basePath && !hasError()) {
			let fileName = resolvedName;

			if (fallbackToDefault()) {
				if (pack.includes("vscode")) {
					fileName = isFolder ? "default_folder" : "default_file";
					if (isFolder && props.isRoot) {
						fileName = "default_root_folder";
					}
				} else if (pack.includes("catppuccin")) {
					fileName = isFolder ? "_folder" : "_file";
				} else {
					fileName = isFolder ? "folder" : "file";
					if (isFolder && props.isRoot) {
						fileName = "root_folder";
					}
				}
			} else if (pack.includes("vscode") && !resolvedName.includes("default")) {
				fileName = isFolder
					? `folder_type_${resolvedName}`
					: `file_type_${resolvedName}`;
			}

			const iconPath = `${basePath}/${packFolderName}/${fileName}.svg`;
			return {
				src: `${convertFileSrc(iconPath)}?t=${timestamp}`,
				isCustom: true,
			};
		}

		return {
			name: resolvedName,
			isCustom: false,
		};
	});

	return (
		<Switch>
			<Match when={isThumbnailable() && props.id}>
				<div
					class="image-thumbnail"
					style={{
						width: `${props.size}px`,
						height: `${props.size}px`,
						display: "flex",
						"align-items": "center",
						"justify-content": "center",
						overflow: "hidden",
						"border-radius": "4px",
					}}
				>
					<img
						src={convertFileSrc(appIconPath() || props.id!)}
						alt=""
						style={{
							"max-width": "100%",
							"max-height": "100%",
							"object-fit": "cover",
						}}
					/>
				</div>
			</Match>

			<Match when={iconData().isCustom}>
				<img
					src={iconData().src}
					alt=""
					onerror={() => {
						if (!fallbackToDefault() && iconData().isCustom) {
							setFallbackToDefault(true);
						} else {
							setHasError(true);
						}
					}}
					style={{
						width: `${props.size}px`,
						height: `${props.size}px`,
						"flex-shrink": 0,
						"object-fit": "contain",
					}}
				/>
			</Match>

			<Match when={true}>
				<AppIcon
					name={
						iconData().name || (props.type === "folder" ? "Folder" : "File")
					}
					pack="lucide"
					size={props.size}
					style={{ "flex-shrink": 0 }}
				/>
			</Match>
		</Switch>
	);
};
