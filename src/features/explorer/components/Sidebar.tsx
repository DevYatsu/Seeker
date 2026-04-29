import { For } from "solid-js";
import { AppIcon } from "../../../components/AppIcon";
import type {
	NavigationLocation,
	StorageStats,
} from "../../../services/apiService";
import { useSidebar } from "../hooks/useSidebar";

type SidebarProps = {
	activeLocation: string;
	setActiveLocation: (id: string) => void;
	locations: NavigationLocation[];
	storage?: StorageStats;
	onMove?: (sourceIds: string[], targetId: string) => void;
};

const NAV_CONFIG: Record<string, { icon: string }> = {
	home: { icon: "Home" },
	desktop: { icon: "Monitor" },
	documents: { icon: "FileText" },
	downloads: { icon: "Download" },
	pictures: { icon: "Image" },
	music: { icon: "Music" },
	videos: { icon: "Film" },
	public: { icon: "Users" },
	templates: { icon: "LayoutGrid" },
	applications: { icon: "AppWindow" },
	trash: { icon: "Trash" },
};

export default function Sidebar(props: SidebarProps) {
	const {
		iconPack,
		visibleLocations,
		favoritePaths,
		removeFavorite,
		dragHandlers,
	} = useSidebar(props);

	return (
		<aside class="sidebar">
			<nav class="sidebar-nav">
				<div class="nav-section">
					<h2 class="section-title">Locations</h2>
					<ul>
						<For each={visibleLocations()}>
							{(loc) => (
								<button
									type="button"
									class={`nav-item ${props.activeLocation === loc.id ? "active" : ""}`}
									onClick={() => props.setActiveLocation(loc.id)}
									title={loc.label}
									onDragOver={dragHandlers.onDragOver}
									onDragLeave={dragHandlers.onDragLeave}
									onDrop={(e) => dragHandlers.onDrop(e, loc.path)}
								>
									<AppIcon
										pack={iconPack()}
										name={NAV_CONFIG[loc.id]?.icon || "Folder"}
										size={16}
									/>
									<span class="nav-label">{loc.label}</span>
								</button>
							)}
						</For>
					</ul>
				</div>

				<div class="nav-section">
					<h2 class="section-title">Favorites</h2>
					<ul>
						<For each={favoritePaths()}>
							{(fav) => (
								<button
									type="button"
									class={`nav-item ${props.activeLocation === fav.path ? "active" : ""}`}
									onClick={() => props.setActiveLocation(fav.path)}
									title={fav.path}
									onContextMenu={(e) => {
										e.preventDefault();
										removeFavorite(fav.id);
									}}
									onDragOver={dragHandlers.onDragOver}
									onDragLeave={dragHandlers.onDragLeave}
									onDrop={(e) => dragHandlers.onDrop(e, fav.path)}
								>
									<AppIcon pack={iconPack()} name="Star" size={16} />
									<span class="nav-label">{fav.label}</span>
								</button>
							)}
						</For>
					</ul>
				</div>

				<div class="nav-section">
					<h2 class="section-title">Devices</h2>
					<ul>
						<For each={props.storage?.disks || []}>
							{(drive) => (
								<button
									type="button"
									class={`nav-item ${props.activeLocation === drive.mount_point ? "active" : ""}`}
									onClick={() => props.setActiveLocation(drive.mount_point)}
									title={`${drive.name} (${drive.mount_point})`}
									onDragOver={dragHandlers.onDragOver}
									onDragLeave={dragHandlers.onDragLeave}
									onDrop={(e) => dragHandlers.onDrop(e, drive.mount_point)}
								>
									<AppIcon
										pack={iconPack()}
										name={drive.is_removable ? "Usb" : "HardDrive"}
										size={16}
									/>
									<span class="nav-label">
										{drive.name ||
											(drive.mount_point === "/"
												? "Macintosh HD"
												: drive.mount_point)}
									</span>
								</button>
							)}
						</For>
					</ul>
				</div>
			</nav>
		</aside>
	);
}
