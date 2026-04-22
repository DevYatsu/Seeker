import { For, Show, createSignal } from "solid-js";
import { AppIcon, type IconPack } from "../../../components/AppIcon";
import type { TabHistory } from "../../../hooks/useTabs";

type TabBarProps = {
	tabs: TabHistory[];
	activeIndex: number;
	onSelect: (index: number) => void;
	onClose: (index: number) => void;
	onAdd: () => void;
	onMove: (from: number, to: number) => void;
	iconPack: IconPack;
	getPathLabel: (path: string) => string;
};

export default function TabBar(props: TabBarProps) {
	const getShortLabel = (path: string) => {
		if (path === "home") return "Home";
		if (path === "trash") return "Trash";
		const parts = path.split(/[\\/]/).filter(Boolean);
		return parts[parts.length - 1] || "/";
	};

	const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);

	const handleDragStart = (e: DragEvent, index: number) => {
		setDraggedIndex(index);
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", index.toString());
			
			// Set a transparent ghost image
			const img = new Image();
			img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
			e.dataTransfer.setDragImage(img, 0, 0);
		}
	};

	const handleDragOver = (e: DragEvent, index: number) => {
		e.preventDefault();
		if (draggedIndex() === null || draggedIndex() === index) return;
		setDragOverIndex(index);
		
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = "move";
		}
	};

	const handleDrop = (e: DragEvent, targetIndex: number) => {
		e.preventDefault();
		const sourceIndexRaw = e.dataTransfer?.getData("text/plain");
		const sourceIndex = sourceIndexRaw ? parseInt(sourceIndexRaw, 10) : draggedIndex();
		
		if (sourceIndex !== null && sourceIndex !== targetIndex) {
			props.onMove(sourceIndex, targetIndex);
		}
		
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	const handleDragEnd = () => {
		setDraggedIndex(null);
		setDragOverIndex(null);
	};

	return (
		<div class="tab-bar">
			<div class="tabs-scroll-container">
				<For each={props.tabs}>
					{(tab, i) => {
						const currentPath = () => tab.history[tab.index];
						const label = () => getShortLabel(currentPath());
						const fullName = () => props.getPathLabel(currentPath());
						const isActive = () => i() === props.activeIndex;

						return (
							<div
								class="tab-item"
								classList={{ 
									active: isActive(),
									dragging: draggedIndex() === i(),
									"drag-over": dragOverIndex() === i()
								}}
								draggable="true"
								onDragStart={(e) => handleDragStart(e, i())}
								onDragOver={(e) => handleDragOver(e, i())}
								onDragEnd={handleDragEnd}
								onDrop={(e) => handleDrop(e, i())}
								onClick={() => props.onSelect(i())}
								onAuxClick={(e) => {
									if (e.button === 1) props.onClose(i());
								}}
								title={fullName()}
							>
								<AppIcon
									pack={props.iconPack}
									name={currentPath() === "home" ? "Home" : currentPath() === "trash" ? "Trash2" : "Folder"}
									size={14}
									class="tab-icon"
								/>
								<span class="tab-label">{label()}</span>
								<button
									class="tab-close-btn"
									onClick={(e) => {
										e.stopPropagation();
										props.onClose(i());
									}}
								>
									<AppIcon pack={props.iconPack} name="X" size={12} />
								</button>
							</div>
						);
					}}
				</For>
			</div>
			<button class="add-tab-btn" onClick={props.onAdd} title="New Tab (Cmd+T)">
				<AppIcon pack={props.iconPack} name="Plus" size={16} />
			</button>
		</div>
	);
}
