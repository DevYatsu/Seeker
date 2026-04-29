import { createSignal, For, Show } from "solid-js";
import { AppIcon, type IconPack } from "../../../components/AppIcon";
import { useToolbar } from "../hooks/useToolbar";
import { useExplorer } from "../context/ExplorerContext";

type ToolbarProps = {
	activeLocation: string;
	activeLocationLabel: string;
	currentAbsolutePath: string;
	onNavigate: (path: string) => void;
	viewMode: "list" | "grid" | "column";
	setViewMode: (val: "list" | "grid" | "column") => void;
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	iconPack: IconPack;
	canGoBack: boolean;
	canGoForward: boolean;
	onBack: () => void;
	onForward: () => void;
	sortBy: "name" | "size" | "date";
	setSortBy: (val: "name" | "size" | "date") => void;
	sortOrder: "asc" | "desc";
	setSortOrder: (val: "asc" | "desc") => void;
	separateFolders: boolean;
	setSeparateFolders: (val: boolean) => void;
	showHidden: boolean;
	setShowHidden: (val: boolean) => void;
};

export default function Toolbar(props: ToolbarProps) {
	const { dnd } = useExplorer();
	const [isEditingPath, setIsEditingPath] = createSignal(false);
	const [pathInput, setPathInput] = createSignal("");

	const {
		breadcrumbs,
		toggleSortOrder,
		toggleSeparateFolders,
		toggleShowHidden,
	} = useToolbar(props);

	return (
		<header class="toolbar">
			<div class="toolbar-left">
				<button
					type="button"
					class="nav-btn"
					disabled={!props.canGoBack}
					onClick={() => props.onBack()}
				>
					<AppIcon pack={props.iconPack} name="ArrowLeft" size={18} />
				</button>
				<button
					type="button"
					class="nav-btn"
					disabled={!props.canGoForward}
					onClick={() => props.onForward()}
				>
					<AppIcon pack={props.iconPack} name="ArrowRight" size={18} />
				</button>
				<nav
					class="breadcrumb"
					aria-label="Path"
					onClick={(e) => {
						if (e.target === e.currentTarget) {
							setIsEditingPath(true);
							setPathInput(props.currentAbsolutePath);
						}
					}}
				>
					<Show
						when={isEditingPath()}
						fallback={
							<For each={breadcrumbs()}>
								{(segment, i) => {
									const [isOver, setIsOver] = createSignal(false);
									return (
										<>
											{i() > 0 && <span class="crum-separator">/</span>}
											<button
												type="button"
												class={`crum-segment ${i() === breadcrumbs().length - 1 ? "bold" : ""} ${isOver() ? "is-over" : ""}`}
												onClick={() => props.onNavigate(segment.path)}
												onDragOver={(e) => {
													e.preventDefault();
													setIsOver(true);
												}}
												onDragLeave={() => setIsOver(false)}
												onDrop={async (e) => {
													e.preventDefault();
													setIsOver(false);
													const data =
														e.dataTransfer?.getData("application/json") ||
														undefined;
													await dnd.handleDrop(segment.path, data);
												}}
												title={segment.path}
											>
												{segment.name}
											</button>
										</>
									);
								}}
							</For>
						}
					>
						<input
							type="text"
							class="path-input"
							value={pathInput()}
							onInput={(e) => setPathInput(e.currentTarget.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									props.onNavigate(pathInput());
									setIsEditingPath(false);
								} else if (e.key === "Escape") {
									setIsEditingPath(false);
								}
							}}
							onBlur={() => setIsEditingPath(false)}
							ref={(el) => setTimeout(() => el.focus(), 0)}
						/>
					</Show>
				</nav>
			</div>

			<div class="toolbar-right">
				<div class="sort-controls">
					<select
						class="sort-select"
						value={props.sortBy}
						onChange={(e) =>
							props.setSortBy(e.currentTarget.value as "name" | "size" | "date")
						}
					>
						<option value="name">Name</option>
						<option value="size">Size</option>
						<option value="date">Date</option>
					</select>
					<button
						type="button"
						class="sort-btn toggle-btn"
						title="Toggle sort order"
						onClick={toggleSortOrder}
					>
						<AppIcon
							pack={props.iconPack}
							name={props.sortOrder === "asc" ? "ArrowUp" : "ArrowDown"}
							size={14}
						/>
					</button>
					<button
						type="button"
						class={`sort-btn toggle-btn ${props.separateFolders ? "active" : ""}`}
						title="Separate folders from files"
						onClick={toggleSeparateFolders}
					>
						<AppIcon pack={props.iconPack} name="Folder" size={14} />
					</button>
				</div>

				<div class="view-toggles">
					<button
						type="button"
						class={`toggle-btn ${props.viewMode === "list" ? "active" : ""}`}
						onClick={() => props.setViewMode("list")}
						title="List View"
					>
						<AppIcon pack={props.iconPack} name="List" size={18} />
					</button>
					<button
						type="button"
						class={`toggle-btn ${props.viewMode === "grid" ? "active" : ""}`}
						onClick={() => props.setViewMode("grid")}
						title="Grid View"
					>
						<AppIcon pack={props.iconPack} name="Grid" size={18} />
					</button>
					<button
						type="button"
						class={`toggle-btn ${props.viewMode === "column" ? "active" : ""}`}
						onClick={() => props.setViewMode("column")}
						title="Column View"
					>
						<AppIcon pack={props.iconPack} name="Columns" size={18} />
					</button>
				</div>

				<button
					type="button"
					class={`toggle-btn ${props.showHidden ? "active" : ""}`}
					title={props.showHidden ? "Hide hidden files" : "Show hidden files"}
					onClick={toggleShowHidden}
					style={{ padding: "5px 8px" }}
				>
					<AppIcon
						pack={props.iconPack}
						name={props.showHidden ? "Eye" : "EyeOff"}
						size={16}
					/>
				</button>

				<div class="search-box">
					<AppIcon pack={props.iconPack} name="Search" size={14} />
					<input
						type="text"
						placeholder="Search files..."
						value={props.searchQuery}
						onInput={(e) => props.setSearchQuery(e.currentTarget.value)}
					/>
					{props.searchQuery && (
						<button
							type="button"
							class="clear-search"
							onClick={() => props.setSearchQuery("")}
						>
							<AppIcon pack={props.iconPack} name="X" size={14} />
						</button>
					)}
				</div>
			</div>
		</header>
	);
}
