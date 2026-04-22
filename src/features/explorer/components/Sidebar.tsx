import { For } from "solid-js";
import { AppIcon } from "../../../components/AppIcon";
import { useSettings } from "../../../hooks/useSettings";
import type { NavigationLocation } from "../../../services/apiService";
import { sidebarDrives } from "../../../utils/mockData";

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
	const { iconPack, visibleNavIds } = useSettings();

	const visibleLocations = () =>
		props.locations.filter((loc) => visibleNavIds().includes(loc.id));

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
		(e.currentTarget as HTMLElement).classList.add("drag-over");
	};

	const handleDragLeave = (e: DragEvent) => {
		(e.currentTarget as HTMLElement).classList.remove("drag-over");
	};

	const handleDrop = (e: DragEvent, targetPath: string) => {
		e.preventDefault();
		(e.currentTarget as HTMLElement).classList.remove("drag-over");

		const data = e.dataTransfer?.getData("application/json");
		if (data && props.onMove) {
			try {
				const sourceIds = JSON.parse(data) as string[];
				if (sourceIds.length > 0) {
					props.onMove(sourceIds, targetPath);
				}
			} catch (err) {
				console.error("Failed to parse drop data", err);
			}
		}
	};

	return (
		<aside class="sidebar">
			<div class="sidebar-header" style="visibility: hidden;">
				<AppIcon
					pack={iconPack()}
					name="LayoutGrid"
					size={20}
					class="brand-icon"
				/>
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
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={(e) => handleDrop(e, loc.path)}
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
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={(e) => handleDrop(e, drive.path)}
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
