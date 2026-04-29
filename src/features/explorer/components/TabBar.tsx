import { For } from "solid-js";
import { AppIcon, type IconPack } from "../../../components/AppIcon";
import type { TabHistory } from "../modules/NavigationManager";
import { useTabBar } from "../hooks/useTabBar";

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
	const {
		draggedIndex,
		dragOverIndex,
		handleDragStart,
		handleDragOver,
		handleDrop,
		handleDragEnd,
		formatPathLabel,
	} = useTabBar(props);

	return (
		<div class="tab-bar">
			<div class="tabs-scroll-container" role="tablist">
				<For each={props.tabs}>
					{(tab, i) => {
						const currentPath = () => tab.history[tab.index];
						const label = () => formatPathLabel(currentPath());
						const fullName = () => props.getPathLabel(currentPath());
						const isActive = () => i() === props.activeIndex;

						return (
							<div
								class="tab-item"
								classList={{
									active: isActive(),
									dragging: draggedIndex() === i(),
									"drag-over": dragOverIndex() === i(),
								}}
								draggable="true"
								onDragStart={(e) => handleDragStart(e, i())}
								onDragOver={(e) => handleDragOver(e, i())}
								onDragEnd={handleDragEnd}
								onDrop={(e) => handleDrop(e, i())}
								onClick={() => props.onSelect(i())}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") props.onSelect(i());
								}}
								onAuxClick={(e) => {
									if (e.button === 1) props.onClose(i());
								}}
								title={fullName()}
								role="tab"
								aria-selected={isActive()}
								tabIndex={0}
							>
								<AppIcon
									pack={props.iconPack}
									name={
										currentPath() === "home"
											? "Home"
											: currentPath() === "trash"
												? "Trash"
												: "Folder"
									}
									size={14}
									class="tab-icon"
								/>
								<span class="tab-label">{label()}</span>
								<button
									type="button"
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
			<button
				type="button"
				class="add-tab-btn"
				onClick={props.onAdd}
				title="New Tab (Cmd+T)"
			>
				<AppIcon pack={props.iconPack} name="Plus" size={16} />
			</button>
		</div>
	);
}
