import { createEventListener } from "@solid-primitives/event-listener";
import { createEffect, createSignal, Suspense, onMount, onCleanup } from "solid-js";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import ContextMenu from "../components/ContextMenu";
import LoadingOverlay from "../components/LoadingOverlay";
import TitleBar from "../components/TitleBar";
import { ExplorerModals } from "../features/explorer/components/ExplorerModals";
// Feature Components
import FileBrowser, {
	type InteractionEvent,
} from "../features/explorer/components/FileBrowser";
import Sidebar from "../features/explorer/components/Sidebar";
import StatusBar from "../features/explorer/components/StatusBar";
import Toolbar from "../features/explorer/components/Toolbar";
import TabBar from "../features/explorer/components/TabBar";
import { useExplorerContextMenu } from "../features/explorer/hooks/useExplorerContextMenu";
import { useExplorerData } from "../features/explorer/hooks/useExplorerData";
import { useExplorerNavigation } from "../features/explorer/hooks/useExplorerNavigation";
import { useFolderSizes } from "../features/explorer/hooks/useFolderSizes";
import { useExplorerState } from "../features/explorer/hooks/useExplorerState";
import { useFileOperations } from "../features/explorer/hooks/useFileOperations";
import { useSelectionLogic } from "../features/explorer/hooks/useSelectionLogic";
import { useContextMenu } from "../hooks/useContextMenu";
import { useSettings } from "../hooks/useSettings";
import { fileSystem } from "../services/apiService";

/**
 * Explorer ViewModel / Container Component
 * This component acts as the "glue" between business logic (hooks/services) and UI.
 * It follows the principle of separating UI from logic by orchestrating specialized hooks.
 */
export default function Explorer() {
	// 1. Core Services & Domain Logic
	const { iconPack } = useSettings();
	const contextMenu = useContextMenu();

	// 2. Logic Hooks (ViewModel State)
	const state = useExplorerState();
	const nav = useExplorerNavigation();

	const data = useExplorerData({
		currentPath: nav.currentAbsolutePath,
		refreshTrigger: state.refreshTrigger,
		searchQuery: state.searchQuery,
		sortBy: state.sortBy,
		sortOrder: state.sortOrder,
		separateFolders: state.separateFolders,
		showHidden: state.showHidden,
	});

	const selection = useSelectionLogic(data.displayedFiles);
	const folderSizes = useFolderSizes();

	const ops = useFileOperations({
		currentRoot: nav.currentAbsolutePath,
		refresh: state.refresh,
		mutate: data.mutate,
	});

	// 3. UI-only State (Modals)
	const [promptConfig, setPromptConfig] = createSignal<
		import("../features/explorer/components/ExplorerModals").PromptConfig | null
	>(null);
	const [infoModal, setInfoModal] = createSignal<
		import("../features/explorer/components/ExplorerModals").InfoModal | null
	>(null);

	// 4. Action Handlers (Separating Event Logic from UI)
	const handleItemInteract = (event: InteractionEvent) => {
		if (event.rightClick) {
			contextMenu.open(window.event as MouseEvent); // Hacky for now, better to pass coords
			if (!selection.selectedIds().includes(event.id)) {
				selection.setSelectedIds([event.id]);
			}
		} else {
			selection.selectItem(event.id, {
				multi: event.multi,
				range: event.range,
			});
		}
	};

	const handleOpen = (id: string) => {
		const file = data.displayedFiles().find((f) => f.id === id);
		file?.type === "folder" ? nav.navigate(id) : fileSystem.openItem(id);
	};

	// 5. Computed Menus (Logic for what actions are available)
	const menuItems = useExplorerContextMenu({
		selection,
		ops,
		nav,
		data,
		handlers: {
			onOpen: handleOpen,
			setPromptConfig,
			setInfoModal,
			openInTerminal: fileSystem.openInTerminal,
			refresh: state.refresh,
		},
	});

	// 6. Global Side Effects (Lifecycle/Environment logic)
	createEffect(() => {
		nav.history.currentPath;
		selection.clearSelection();
		state.setSearchQuery("");
		folderSizes.clearCache();
	});

	// File Watcher Effect
	createEffect(() => {
		const path = nav.currentAbsolutePath();
		if (!path || path === "home") return;

		let unlisten: () => void;
		let isActive = true;

		invoke("watch_directory", { path }).catch(console.error);

		listen("directory-changed", () => {
			if (isActive) {
				state.refresh();
			}
		}).then((fn) => {
			unlisten = fn;
		});

		onCleanup(() => {
			isActive = false;
			invoke("unwatch_directory").catch(console.error);
			if (unlisten) unlisten();
		});
	});

	createEventListener(window, "keydown", async (e) => {
		// Skip when typing in inputs
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement
		)
			return;

		const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
		const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
		const key = e.key;

		// --- Modifier combos ---
		if (cmdOrCtrl) {
			switch (key.toLowerCase()) {
				case "c":
					ops.handleCopy(selection.selectedIds());
					return;
				case "x":
					ops.handleCut(selection.selectedIds());
					return;
				case "v":
					ops.handlePaste();
					return;
				case "a":
					e.preventDefault();
					selection.selectAll();
					return;
				case "f":
					e.preventDefault();
					// Focus the search input
					document.querySelector<HTMLInputElement>(".search-box input")?.focus();
					return;
				case "t":
					e.preventDefault();
					nav.history.addTab();
					return;
				case "w":
					e.preventDefault();
					nav.history.closeTab(nav.history.activeTabIndex());
					return;
			}
		}

		// --- Arrow key navigation ---
		if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(key)) {
			e.preventDefault();
			const isGrid = state.viewMode() === "grid";

			let delta = 0;
			if (key === "ArrowDown") delta = isGrid ? getGridColumns() : 1;
			if (key === "ArrowUp") delta = isGrid ? -getGridColumns() : -1;
			if (key === "ArrowRight") delta = isGrid ? 1 : 0;
			if (key === "ArrowLeft") delta = isGrid ? -1 : 0;

			if (delta !== 0) {
				selection.selectByDelta(delta, e.shiftKey);
			}
			return;
		}

		// --- Enter to open ---
		if (key === "Enter") {
			const ids = selection.selectedIds();
			if (ids.length > 0) {
				ids.forEach(handleOpen);
			}
			return;
		}

		// --- Escape to deselect ---
		if (key === "Escape") {
			selection.clearSelection();
			state.setSearchQuery("");
			return;
		}

		// --- Backspace/Delete ---
		if (key === "Backspace" || key === "Delete") {
			if (selection.selectedIds().length > 0) {
				ops.handleDelete(selection.selectedIds(), nav.isTrash());
			} else if (key === "Backspace" && nav.history.canGoBack) {
				// No selection → go back
				nav.history.goBack();
			}
			return;
		}
	});

	/** Estimate number of columns in grid view for up/down arrow jumps */
	const getGridColumns = (): number => {
		const grid = document.querySelector(".folder-grid, .file-grid");
		if (!grid) return 1;
		const style = getComputedStyle(grid);
		const cols = style.gridTemplateColumns.split(" ").length;
		return cols || 1;
	};

	// Listen for external app drops
	onMount(async () => {
		const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
			if (event.payload.type === "drop") {
				const paths = event.payload.paths;
				if (paths && paths.length > 0) {
					// To avoid conflicts with our internal drag and drop which we might also want to do via Tauri,
					// let's check if the dropped files are already in our current view. 
					// If they are, it's just an internal drag (which we handle natively).
					// Wait! We actually just want to copy external files here.
					// We can use our copy API which we can add to fileSystem!
					const targetDir = nav.currentAbsolutePath();
					fileSystem.copyItems(paths, targetDir).then(() => {
						data.refresh();
					}).catch((err) => {
						console.error("External drop failed:", err);
					});
				}
			}
		});

		onCleanup(() => {
			unlisten();
		});
	});

	return (
		<div class="root-view" classList={{ "is-navigating": nav.isPending() }}>
			<TitleBar />

			<div class="app-container">
				<Sidebar
					activeLocation={nav.history.currentPath}
					setActiveLocation={nav.navigate}
					locations={nav.locations() || []}
					onMove={ops.handleMove}
				/>

				<main class="main-content">
					<TabBar
						tabs={nav.history.tabs()}
						activeIndex={nav.history.activeTabIndex()}
						onSelect={nav.history.setActiveTab}
						onClose={nav.history.closeTab}
						onAdd={() => nav.history.addTab()}
						onMove={nav.history.moveTab}
						iconPack={iconPack()}
						getPathLabel={nav.getLabel}
					/>
					<Toolbar
						activeLocation={nav.history.currentPath}
						activeLocationLabel={nav.activeLocationLabel()}
						currentAbsolutePath={nav.currentAbsolutePath()}
						onNavigate={nav.navigate}
						viewMode={state.viewMode()}
						setViewMode={state.setViewMode}
						searchQuery={state.searchQuery()}
						setSearchQuery={state.setSearchQuery}
						iconPack={iconPack()}
						canGoBack={nav.history.canGoBack}
						canGoForward={nav.history.canGoForward}
						onBack={nav.history.goBack}
						onForward={nav.history.goForward}
						sortBy={state.sortBy()}
						setSortBy={state.setSortBy}
						sortOrder={state.sortOrder()}
						setSortOrder={state.setSortOrder}
						separateFolders={state.separateFolders()}
						setSeparateFolders={state.setSeparateFolders}
						showHidden={state.showHidden()}
						setShowHidden={state.setShowHidden}
					/>

					<div class="browser-wrapper">
						<Suspense fallback={<LoadingOverlay active={true} />}>
							<FileBrowser
								files={data.displayedFiles()}
								viewMode={state.viewMode()}
								isSelected={selection.isSelected}
								selectedIds={selection.selectedIds()}
								onItemInteract={handleItemInteract}
								onItemOpen={handleOpen}
								onItemMove={ops.handleMove}
								onBackgroundInteract={() => selection.clearSelection()}
								iconPack={iconPack()}
								folderSizes={folderSizes.sizes()}
								calculating={folderSizes.calculating()}
								onCalculateSize={folderSizes.calculateSize}
								clipboard={ops.clipboard()}
								clipboardMode={ops.clipboardMode()}
							/>
						</Suspense>
						<LoadingOverlay active={nav.isPending()} />
					</div>

					<StatusBar
						itemCount={data.displayedFiles().length}
						selectionCount={selection.selectedIds().length}
					/>
				</main>
			</div>

			<ExplorerModals
				infoModal={infoModal()}
				setInfoModal={setInfoModal}
				promptConfig={promptConfig()}
				setPromptConfig={setPromptConfig}
				iconPack={iconPack()}
			/>

			<ContextMenu
				x={contextMenu.pos().x}
				y={contextMenu.pos().y}
				visible={contextMenu.visible()}
				onClose={contextMenu.close}
				items={menuItems()}
				iconPack={iconPack()}
			/>
		</div>
	);
}
