import { For } from "solid-js";
import { AppIcon } from "../../../components/AppIcon";
import type { NavigationLocation } from "../../../services/apiService";
import { sidebarDrives } from "../../../utils/mockData";
import { useSidebar } from "../hooks/useSidebar";

type SidebarProps = {
	activeLocation: string;
	setActiveLocation: (id: string) => void;
	locations: NavigationLocation[];
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
			<div class="sidebar-header">
				<AppIcon pack={iconPack()} name="Brand" size={20} class="brand-icon" />
				<span class="brand-name">Seeker</span>
			</div>

			<nav class="sidebar-nav">
				<div class="nav-section">
					<h2 class="section-title">Places</h2>
					<ul>
						<For each={visibleLocations()}>
							{(loc) => (
								<li class="nav-item-wrapper">
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
											size={18}
										/>
										<span>{loc.label}</span>
									</button>
								</li>
							)}
						</For>
					</ul>
				</div>

				{favoritePaths().length > 0 && (
					<div class="nav-section">
						<h2 class="section-title">Favorites</h2>
						<ul>
							<For each={favoritePaths()}>
								{(fav) => (
									<li class="nav-item-wrapper">
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
											<AppIcon pack={iconPack()} name="Star" size={18} />
											<span>{fav.label}</span>
										</button>
									</li>
								)}
							</For>
						</ul>
					</div>
				)}

				<div class="nav-section">
					<h2 class="section-title">Locations</h2>
					<ul>
						<For each={sidebarDrives}>
							{(drive) => (
								<li class="nav-item-wrapper">
									<button
										type="button"
										class={`nav-item ${props.activeLocation === drive.id ? "active" : ""}`}
										onClick={() => props.setActiveLocation(drive.id)}
										title={drive.label}
										onDragOver={dragHandlers.onDragOver}
										onDragLeave={dragHandlers.onDragLeave}
										onDrop={(e) => dragHandlers.onDrop(e, drive.path)}
									>
										<AppIcon pack={iconPack()} name={drive.icon} size={18} />
										<span>{drive.label}</span>
									</button>
								</li>
							)}
						</For>
					</ul>
				</div>
			</nav>
		</aside>
	);
}
